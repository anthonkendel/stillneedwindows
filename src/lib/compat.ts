import type { GameCompat } from '../../shared/types'
import { chunk, mapLimit } from '../../shared/pool'
import { fetchCompat } from './api'

const BATCH = 50
const PARALLEL = 3

/**
 * Complete answers already fetched in this tab. Compatibility is the same for
 * everyone, so a wishlist or group check after a library check only asks the
 * API for games it hasn't seen yet. Gone when the tab closes.
 */
const known = new Map<number, GameCompat>()

/** For tests. */
export function forgetCompat() {
  known.clear()
}

async function fetchWithRetry(ids: number[]): Promise<GameCompat[] | null> {
  try {
    return (await fetchCompat(ids)).games
  } catch {
    try {
      return (await fetchCompat(ids)).games // one retry
    } catch {
      return null
    }
  }
}

/**
 * Looks up every app id, in the order given (put the ones that matter most first).
 * onBatch gets each batch's answers and how many ids it covered; ids it covered
 * without a complete answer couldn't be checked. Entries that came back
 * incomplete aren't remembered, so "check again" asks for them again.
 */
export async function checkCompat(
  appids: number[],
  onBatch: (games: GameCompat[], covered: number) => void,
): Promise<void> {
  const hits = appids.filter((id) => known.has(id))
  if (hits.length)
    onBatch(
      hits.map((id) => known.get(id)!),
      hits.length,
    )

  // Ids are sorted inside each batch so the same list always asks for the same
  // URLs, which lets the browser and CDN caches answer repeat checks.
  const batches = chunk(
    appids.filter((id) => !known.has(id)),
    BATCH,
  ).map((ids) => ids.sort((a, b) => a - b))

  await mapLimit(batches, PARALLEL, async (ids) => {
    const games = (await fetchWithRetry(ids)) ?? []
    for (const g of games) if (g.complete) known.set(g.appid, g)
    onBatch(games, ids.length)
  })
}

/** How many of a batch's ids got no complete answer. */
export const incomplete = (games: GameCompat[], covered: number) => covered - games.filter((g) => g.complete).length
