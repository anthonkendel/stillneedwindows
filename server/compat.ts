import { effectiveTier, type GameCompat, type ProtonTier } from '../shared/types.js'
import { getAntiCheatTable } from './anticheat.js'
import { getCache } from './cache.js'
import { mapLimit } from '../shared/pool.js'
import { getProtonTier } from './protondb.js'
import { getStoreInfo, type StoreInfo } from './steam.js'

const KEY = (appid: number) => `compat:v2:${appid}`
const TTL_KNOWN = 60 * 60 * 24 // tiers move slowly
const TTL_PENDING = 60 * 60 * 6 // look again sooner when there were no reports

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

    const tiers = await mapLimit(missing, 8, async (appid) => {
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
      // Only cache full answers, so a hiccup upstream isn't remembered for a day.
      if (entry.complete) {
        await cache.set(KEY(appid), entry, entry.tier === 'pending' ? TTL_PENDING : TTL_KNOWN)
      }
    }
  }

  return appids.map((appid, i) => cached[i] ?? fresh.get(appid)!)
}
