import { Hono, type MiddlewareHandler } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { z } from 'zod'
import type { CompatResponse, ProfileResponse } from '../shared/types.js'
import { parseProfileInput } from '../shared/profileInput.js'
import { getCompat } from './compat.js'
import { UpstreamError } from './http.js'
import { getOwnedGames, getPlayer, resolveVanity } from './steam.js'

export const MAX_BATCH = 50

/** Compat answers are the same for everyone: browsers keep them an hour, the CDN a day. */
const COMPAT_CACHE = 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800'
/** A profile only in the visitor's own browser, briefly, so back/forward is instant. Never on the CDN. */
const PROFILE_CACHE = 'private, max-age=300'

/**
 * The API is only for this site. Browsers mark every request with Sec-Fetch-Site,
 * and we answer only same-origin (our pages) or none (typed into the address bar).
 * No CORS headers are sent, so other sites can't read responses either.
 * This stops other websites from using the API through their visitors' browsers;
 * scripts outside a browser are handled by the Vercel firewall rate limit (README).
 */
const sameOriginOnly: MiddlewareHandler = async (c, next) => {
  const site = c.req.header('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return c.json({ error: 'forbidden' }, 403)

  const origin = c.req.header('origin')
  if (origin) {
    let ok = false
    try {
      ok = new URL(origin).host === new URL(c.req.url).host
    } catch {
      /* malformed origin */
    }
    if (!ok) return c.json({ error: 'forbidden' }, 403)
  }
  await next()
}

const app = new Hono().basePath('/api')

app.use('*', secureHeaders({ crossOriginResourcePolicy: 'same-origin' }))
app.use('*', async (c, next) => {
  await next()
  c.header('X-Robots-Tag', 'noindex')
})

app.get('/health', (c) => {
  c.header('Cache-Control', 'no-store')
  return c.json({ ok: true })
})

app.use('/profile/*', sameOriginOnly)
app.use('/compat', sameOriginOnly)

/**
 * Resolves a profile URL, custom name or SteamID64 and returns the owned games.
 * Never stored on our side.
 */
app.get('/profile/:query', async (c) => {
  // Failures and private profiles must not be cached: people fix them and retry.
  c.header('Cache-Control', 'no-store')

  const parsed = parseProfileInput(c.req.param('query'))
  if (!parsed) return c.json<ProfileResponse>({ status: 'not_found' })

  const steamid = parsed.kind === 'steamid' ? parsed.value : await resolveVanity(parsed.value)
  if (!steamid) return c.json<ProfileResponse>({ status: 'not_found' })

  const player = await getPlayer(steamid)
  if (!player) return c.json<ProfileResponse>({ status: 'not_found' })
  if (!player.isPublic) return c.json<ProfileResponse>({ status: 'private', profile: player.profile })

  const games = await getOwnedGames(steamid)
  if (games === null) return c.json<ProfileResponse>({ status: 'private', profile: player.profile })

  c.header('Cache-Control', PROFILE_CACHE)
  return c.json<ProfileResponse>({
    status: 'ok',
    profile: player.profile,
    games: games.sort((a, b) => b.minutes - a.minutes),
    playtimeVisible: games.some((g) => g.minutes > 0),
  })
})

const CompatQuery = z.object({
  ids: z
    .string()
    .max(MAX_BATCH * 11)
    .transform((s) => s.split(',').map(Number))
    .pipe(z.array(z.number().int().positive().max(2 ** 32)).min(1).max(MAX_BATCH)),
})

/** ProtonDB tier, native build, Deck rating and anti-cheat for up to 50 apps. */
app.get('/compat', async (c) => {
  const q = CompatQuery.safeParse(c.req.query())
  if (!q.success) {
    c.header('Cache-Control', 'no-store')
    return c.json({ error: 'ids must be 1–50 comma-separated app ids' }, 400)
  }
  const games = await getCompat([...new Set(q.data.ids)])
  c.header('Cache-Control', games.every((g) => g.complete) ? COMPAT_CACHE : 'no-store')
  return c.json<CompatResponse>({ games })
})

app.notFound((c) => c.json({ error: 'not found' }, 404))

app.onError((err, c) => {
  c.header('Cache-Control', 'no-store')
  if (err instanceof UpstreamError) {
    console.warn(err.message)
    return c.json({ error: 'upstream', source: err.source }, 502)
  }
  console.error(err)
  return c.json({ error: 'internal' }, 500)
})

export default app
