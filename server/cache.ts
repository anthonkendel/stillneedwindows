import { Redis } from '@upstash/redis'

/**
 * Two-level cache:
 * - L1: memory in this function instance (Vercel reuses instances), so repeat
 *   lookups within a few minutes cost no Redis commands at all.
 * - L2: Upstash Redis, shared by every instance.
 *
 * Writes go to Redis as one MSET per batch, which Upstash bills as a single
 * command (a library of 600 games = ~12 writes instead of 600). MSET can't set
 * per-key TTLs, so each value carries its own expiry and stale entries are
 * ignored on read. Keys are bounded by the number of Steam apps (~250 bytes
 * each), so they don't need to expire out of Redis.
 */

interface Entry<T> {
  v: T
  /** Expiry, epoch ms */
  e: number
}

export interface Cache {
  mget<T>(keys: string[]): Promise<(T | null)[]>
  mset(entries: { key: string; value: unknown; ttlSeconds: number }[]): Promise<void>
}

const L1_MAX_AGE = 10 * 60 * 1000
const L1_MAX_KEYS = 20_000

const fresh = <T>(entry: Entry<T> | null | undefined): T | null =>
  entry && typeof entry === 'object' && 'e' in entry && entry.e > Date.now() ? entry.v : null

class TieredCache implements Cache {
  private l1 = new Map<string, { entry: Entry<unknown>; until: number }>()

  constructor(private redis: Redis | null) {}

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const now = Date.now()
    const out: (T | null)[] = keys.map((k) => {
      const hit = this.l1.get(k)
      return hit && hit.until > now ? fresh(hit.entry as Entry<T>) : null
    })
    const missing = keys.filter((_, i) => out[i] === null)
    if (!this.redis || missing.length === 0) return out

    try {
      const remote = await this.redis.mget<(Entry<T> | null)[]>(...missing)
      missing.forEach((key, j) => {
        const entry = remote[j]
        const value = fresh(entry)
        if (value === null || !entry) return
        this.remember(key, entry)
        out[keys.indexOf(key)] = value
      })
    } catch (err) {
      console.warn('cache read failed', err)
    }
    return out
  }

  async mset(entries: { key: string; value: unknown; ttlSeconds: number }[]): Promise<void> {
    if (entries.length === 0) return
    const now = Date.now()
    const record: Record<string, Entry<unknown>> = {}
    for (const { key, value, ttlSeconds } of entries) {
      const entry = { v: value, e: now + ttlSeconds * 1000 }
      record[key] = entry
      this.remember(key, entry)
    }
    if (!this.redis) return
    try {
      await this.redis.mset(record)
    } catch (err) {
      console.warn('cache write failed', err)
    }
  }

  private remember(key: string, entry: Entry<unknown>) {
    if (this.l1.size >= L1_MAX_KEYS) this.l1.delete(this.l1.keys().next().value!) // drop oldest
    this.l1.set(key, { entry, until: Math.min(entry.e, Date.now() + L1_MAX_AGE) })
  }
}

let instance: Cache | undefined

/** Upstash Redis behind a memory layer when configured, otherwise memory only. */
export function getCache(): Cache {
  if (instance) return instance
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  instance = new TieredCache(url && token ? new Redis({ url, token }) : null)
  return instance
}

/** For tests. */
export function createCache(redis: Redis | null): Cache {
  return new TieredCache(redis)
}
