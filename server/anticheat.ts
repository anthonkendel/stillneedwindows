import { z } from 'zod'
import type { AntiCheatInfo, AntiCheatStatus } from '../shared/types.js'
import { getCache } from './cache.js'
import { getJson } from './http.js'

// Are We Anti-Cheat Yet publishes its data set as JSON on GitHub.
const SOURCE = 'https://raw.githubusercontent.com/AreWeAntiCheatYet/AreWeAntiCheatYet/master/games.json'
const CACHE_KEY = 'awacy:v2'
const TTL = 60 * 60 * 24

const Entry = z.looseObject({
  status: z.string(),
  slug: z.string().optional(),
  anticheats: z.array(z.string()).optional(),
  storeIds: z.looseObject({ steam: z.union([z.string(), z.number()]).optional() }).optional(),
})

const STATUSES: readonly AntiCheatStatus[] = ['supported', 'running', 'planned', 'broken', 'denied']

type Table = Record<string, AntiCheatInfo>

/** Pure parser, exported for tests. Unknown or malformed entries are skipped. */
export function parseAntiCheatList(json: unknown): Table {
  const table: Table = {}
  if (!Array.isArray(json)) return table
  for (const raw of json) {
    const e = Entry.safeParse(raw)
    if (!e.success) continue
    const steam = e.data.storeIds?.steam
    const status = e.data.status.toLowerCase() as AntiCheatStatus
    if (steam === undefined || !STATUSES.includes(status)) continue
    table[String(steam)] = {
      status,
      anticheats: e.data.anticheats ?? [],
      ...(e.data.slug ? { slug: e.data.slug } : {}),
    }
  }
  return table
}

let memo: { table: Table; at: number } | undefined

/** The full table, keyed by Steam appid. Empty (not an error) if the source is down. */
export async function getAntiCheatTable(): Promise<Table> {
  if (memo && Date.now() - memo.at < TTL * 1000) return memo.table
  const cache = getCache()
  let [table] = await cache.mget<Table>([CACHE_KEY])
  if (!table) {
    try {
      table = parseAntiCheatList(await getJson('awacy', SOURCE, 15_000))
      if (Object.keys(table).length > 0) await cache.set(CACHE_KEY, table, TTL)
    } catch (err) {
      console.warn('anti-cheat list unavailable', err)
      return memo?.table ?? {}
    }
  }
  memo = { table, at: Date.now() }
  return table
}
