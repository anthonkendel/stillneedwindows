import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { parseAntiCheatList } from './anticheat.js'
import { parseProtonSummary } from './protondb.js'
import { parseOwnedGames, parseStoreItems } from './steam.js'

describe('parsers', () => {
  it('tells a hidden game list from an empty one', () => {
    expect(parseOwnedGames({ response: {} })).toBeNull()
    expect(parseOwnedGames({ response: { game_count: 0 } })).toEqual([])
    expect(
      parseOwnedGames({ response: { game_count: 1, games: [{ appid: 10, name: 'X', playtime_forever: 5 }] } }),
    ).toEqual([{ appid: 10, name: 'X', minutes: 5 }])
  })

  it('reads native and Deck status from store items', () => {
    const m = parseStoreItems({
      response: {
        store_items: [
          { appid: 1, platforms: { steamos_linux: true, steam_deck_compat_category: 3 } },
          { appid: 2, platforms: {} },
        ],
      },
    })
    expect(m.get(1)).toEqual({ linux: true, deck: 'verified' })
    expect(m.get(2)).toEqual({ linux: false, deck: 'unknown' })
  })

  it('prefers the trending ProtonDB tier', () => {
    expect(parseProtonSummary({ tier: 'gold', trendingTier: 'platinum' })).toBe('platinum')
    expect(parseProtonSummary({ tier: 'silver' })).toBe('silver')
    expect(parseProtonSummary(null)).toBeNull()
  })

  it('keys anti-cheat entries by Steam appid and skips junk', () => {
    const t = parseAntiCheatList([
      { name: 'A', slug: 'a-game', status: 'Denied', anticheats: ['BattlEye'], storeIds: { steam: '123' } },
      { name: 'B', status: 'Supported', storeIds: {} },
      { name: 'C', status: 'Weird', storeIds: { steam: 9 } },
      'junk',
    ])
    expect(t).toEqual({ '123': { status: 'denied', anticheats: ['BattlEye'], slug: 'a-game' } })
  })
})

describe('cache', () => {
  function fakeRedis() {
    const store = new Map<string, unknown>()
    const calls = { mget: 0, mset: 0 }
    const redis = {
      async mget(...keys: string[]) {
        calls.mget++
        return keys.map((k) => store.get(k) ?? null)
      },
      async mset(record: Record<string, unknown>) {
        calls.mset++
        for (const [k, v] of Object.entries(record)) store.set(k, v)
        return 'OK'
      },
    }
    return { redis, store, calls }
  }

  it('writes a whole batch in one command and serves repeats from memory', async () => {
    const { createCache } = await import('./cache.js')
    const { redis, calls } = fakeRedis()
    const cache = createCache(redis as never)
    await cache.mset(Array.from({ length: 50 }, (_, i) => ({ key: `k${i}`, value: i, ttlSeconds: 60 })))
    expect(calls.mset).toBe(1)
    expect(await cache.mget(['k0', 'k49'])).toEqual([0, 49])
    expect(calls.mget).toBe(0) // answered by the memory layer
  })

  it('reads through to Redis and ignores expired entries', async () => {
    const { createCache } = await import('./cache.js')
    const { redis, store, calls } = fakeRedis()
    store.set('live', { v: 'yes', e: Date.now() + 60_000 })
    store.set('stale', { v: 'old', e: Date.now() - 1 })
    store.set('legacy', { tier: 'gold' }) // old format without expiry
    const cache = createCache(redis as never)
    expect(await cache.mget(['live', 'stale', 'legacy', 'none'])).toEqual(['yes', null, null, null])
    expect(calls.mget).toBe(1)
    expect(await cache.mget(['live'])).toEqual(['yes'])
    expect(calls.mget).toBe(1) // now in memory
  })
})

describe('API', () => {
  const routes: Record<string, unknown> = {}
  beforeEach(() => {
    process.env.STEAM_API_KEY = 'test'
    vi.stubGlobal('fetch', async (input: string | URL) => {
      const url = String(input)
      const hit = Object.entries(routes).find(([k]) => url.includes(k))
      if (!hit) return new Response('', { status: 404 })
      return Response.json(hit[1])
    })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    for (const k of Object.keys(routes)) delete routes[k]
  })

  const player = (vis: number) => ({
    response: {
      players: [{ steamid: '76561197960287930', personaname: 'P', profileurl: 'u', communityvisibilitystate: vis }],
    },
  })

  it('resolves a profile and sorts games by playtime', async () => {
    const { default: app } = await import('./app.js')
    routes['ResolveVanityURL'] = { response: { success: 1, steamid: '76561197960287930' } }
    routes['GetPlayerSummaries'] = player(3)
    routes['GetOwnedGames'] = {
      response: {
        game_count: 2,
        games: [
          { appid: 1, name: 'A', playtime_forever: 1 },
          { appid: 2, name: 'B', playtime_forever: 9 },
        ],
      },
    }
    const body = await (await app.request('/api/profile/someone')).json()
    expect(body.status).toBe('ok')
    expect(body.games.map((g: { appid: number }) => g.appid)).toEqual([2, 1])
  })

  it('only answers this site, not other websites', async () => {
    const { default: app } = await import('./app.js')
    routes['ResolveVanityURL'] = { response: { success: 42 } }
    const req = (headers: Record<string, string>) => app.request('http://snw.test/api/profile/x', { headers })

    expect((await req({ 'sec-fetch-site': 'cross-site' })).status).toBe(403)
    expect((await req({ 'sec-fetch-site': 'same-site' })).status).toBe(403)
    expect((await req({ origin: 'https://evil.example' })).status).toBe(403)
    expect((await req({ 'sec-fetch-site': 'same-origin', origin: 'http://snw.test' })).status).toBe(200)
    expect((await req({ 'sec-fetch-site': 'none' })).status).toBe(200)

    const res = await req({ 'sec-fetch-site': 'same-origin' })
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect((await app.request('/api/health', { headers: { 'sec-fetch-site': 'cross-site' } })).status).toBe(200)
  })

  it('caches profiles only privately, and never failures', async () => {
    const { default: app } = await import('./app.js')
    routes['ResolveVanityURL'] = { response: { success: 1, steamid: '76561197960287930' } }
    routes['GetPlayerSummaries'] = player(3)
    routes['GetOwnedGames'] = { response: { game_count: 0 } }
    expect((await app.request('/api/profile/someone')).headers.get('cache-control')).toBe('private, max-age=300')
    routes['GetPlayerSummaries'] = player(1)
    expect((await app.request('/api/profile/someone')).headers.get('cache-control')).toBe('no-store')
  })

  it('reports private and missing profiles', async () => {
    const { default: app } = await import('./app.js')
    routes['ResolveVanityURL'] = { response: { success: 42 } }
    expect((await (await app.request('/api/profile/nobody')).json()).status).toBe('not_found')
    routes['GetPlayerSummaries'] = player(1)
    expect((await (await app.request('/api/profile/76561197960287930')).json()).status).toBe('private')
  })

  it('combines store, ProtonDB and anti-cheat data', async () => {
    const { default: app } = await import('./app.js')
    routes['IStoreBrowseService'] = {
      response: {
        store_items: [
          { appid: 10, platforms: { steamos_linux: true } },
          { appid: 20, platforms: {} },
          { appid: 30, platforms: {} },
        ],
      },
    }
    routes['summaries/20'] = { tier: 'platinum' }
    routes['summaries/30'] = { tier: 'gold' }
    routes['games.json'] = [{ status: 'Denied', anticheats: ['EAC'], storeIds: { steam: '30' } }]
    const res = await app.request('/api/compat?ids=10,20,30,40')
    const { games } = await res.json()
    expect(games.map((g: { tier: string }) => g.tier)).toEqual(['native', 'platinum', 'borked', 'pending'])
    expect(res.headers.get('cache-control')).toContain('s-maxage=86400')
    expect((await app.request('/api/compat?ids=abc')).status).toBe(400)
  })
})
