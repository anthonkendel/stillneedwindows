import { Redis } from '@upstash/redis'

export interface Cache {
  mget<T>(keys: string[]): Promise<(T | null)[]>
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>
}

class MemoryCache implements Cache {
  private store = new Map<string, { value: unknown; expires: number }>()

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const now = Date.now()
    return keys.map((k) => {
      const hit = this.store.get(k)
      if (!hit || hit.expires < now) return null
      return hit.value as T
    })
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expires: Date.now() + ttlSeconds * 1000 })
  }
}

class RedisCache implements Cache {
  constructor(private redis: Redis) {}

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return []
    try {
      return await this.redis.mget<(T | null)[]>(...keys)
    } catch (err) {
      console.warn('cache read failed', err)
      return keys.map(() => null)
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      await this.redis.set(key, value, { ex: ttlSeconds })
    } catch (err) {
      console.warn('cache write failed', err)
    }
  }
}

let instance: Cache | undefined

/** Upstash Redis when configured, otherwise a per-instance memory cache. */
export function getCache(): Cache {
  if (instance) return instance
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  instance = url && token ? new RedisCache(new Redis({ url, token })) : new MemoryCache()
  return instance
}
