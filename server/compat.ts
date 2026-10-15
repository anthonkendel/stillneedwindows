import { effectiveTier, type GameCompat, type ProtonTier } from '../shared/types.js'
import { mapLimit } from '../shared/pool.js'
import { getAntiCheatTable } from './anticheat.js'
import { getCache } from './cache.js'
import { getProtonTier } from './protondb.js'
import { getStoreInfo, type StoreInfo } from './steam.js'

const KEY = (appid: number) => `compat:v3:${appid}`
export const TTL_KNOWN = 60 * 60 * 24 // tiers move slowly
export const TTL_PENDING = 60 * 60 * 6 // look again sooner when there were no reports

/** Requests in flight to ProtonDB per batch. Polite enough for a community site. */
const PROTONDB_PARALLEL = 6

/** Compatibility for a batch of apps, served from cache where possible. */
export async function getCompat(appids: number[]): Promise<GameCompat[]> {
  const cache = getCache()
  const cached = await cache.mget<GameCompat>(appids.map(KEY))
  const missing = appids.filter((_, i) => !cached[i])

  const fresh = new Map<number, GameCompat>()
  if (missing.length > 0) {
    const [store, antiCheat] = await Promise.all([
      getStoreInfo(missing).catch((err): Map<number, StoreInfo> | null => {
        console.warn('store lookup failed', err)
        return null
      }),
      getAntiCheatTable(),
    ])

    const tiers = await mapLimit(missing, PROTONDB_PARALLEL, async (appid) => {
      try {
        return { appid, tier: await getProtonTier(appid), ok: true }
      } catch {
        return { appid, tier: null as ProtonTier | null, ok: false }
      }
    })

    for (const { appid, tier, ok } of tiers) {
      const info = store?.get(appid)
      const entry: GameCompat = {
        appid,
        native: info?.linux ?? false,
        deck: info?.deck ?? 'unknown',
        protonTier: tier,
        antiCheat: antiCheat[String(appid)] ?? null,
        tier: 'pending',
        complete: ok && store !== null,
      }
      entry.tier = effectiveTier(entry)
      fresh.set(appid, entry)
    }

    // One write for the whole batch. Only full answers are cached, so a hiccup
    // upstream isn't remembered for a day.
    await cache.mset(
      [...fresh.values()]
        .filter((e) => e.complete)
        .map((e) => ({ key: KEY(e.appid), value: e, ttlSeconds: e.tier === 'pending' ? TTL_PENDING : TTL_KNOWN })),
    )
  }

  return appids.map((appid, i) => cached[i] ?? fresh.get(appid)!)
}
