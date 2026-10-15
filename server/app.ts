import { Hono } from 'hono'
import { z } from 'zod'
import type { CompatResponse, ProfileResponse } from '../shared/types.js'
import { parseProfileInput } from '../shared/profileInput.js'
import { getCompat } from './compat.js'
import { UpstreamError } from './http.js'
import { getOwnedGames, getPlayer, resolveVanity } from './steam.js'

export const MAX_BATCH = 50

const app = new Hono().basePath('/api')

app.get('/health', (c) => c.json({ ok: true }))

/**
 * Resolves a profile URL, custom name or SteamID64 and returns the owned games.
 * Not cached: we don't keep profiles or game lists.
 */
app.get('/profile/:query', async (c) => {
  const parsed = parseProfileInput(c.req.param('query'))
  if (!parsed) return c.json<ProfileResponse>({ status: 'not_found' })

  const steamid = parsed.kind === 'steamid' ? parsed.value : await resolveVanity(parsed.value)
  if (!steamid) return c.json<ProfileResponse>({ status: 'not_found' })

  const player = await getPlayer(steamid)
  if (!player) return c.json<ProfileResponse>({ status: 'not_found' })
  if (!player.isPublic) return c.json<ProfileResponse>({ status: 'private', profile: player.profile })

  const games = await getOwnedGames(steamid)
  if (games === null) return c.json<ProfileResponse>({ status: 'private', profile: player.profile })

  c.header('Cache-Control', 'no-store')
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
    .transform((s) => s.split(',').map(Number))
    .pipe(z.array(z.number().int().positive()).min(1).max(MAX_BATCH)),
})

/** ProtonDB tier, native build, Deck rating and anti-cheat for up to 50 apps. */
app.get('/compat', async (c) => {
  const q = CompatQuery.safeParse(c.req.query())
  if (!q.success) return c.json({ error: 'ids must be 1–50 comma-separated app ids' }, 400)
  const games = await getCompat([...new Set(q.data.ids)])
  // Same ids, same answer: let the CDN serve repeat lookups for an hour.
  if (games.every((g) => g.complete)) c.header('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  return c.json<CompatResponse>({ games })
})

app.notFound((c) => c.json({ error: 'not found' }, 404))

app.onError((err, c) => {
  if (err instanceof UpstreamError) {
    console.warn(err.message)
    return c.json({ error: 'upstream', source: err.source }, 502)
  }
  console.error(err)
  return c.json({ error: 'internal' }, 500)
})

export default app
