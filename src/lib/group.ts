import type { OwnedGame } from '../../shared/types'

export interface MemberLibrary {
  steamid: string
  games: OwnedGame[]
}

export interface GroupGame {
  appid: number
  name: string
  /** Everyone's playtime added up, so the games the group actually plays come first. */
  minutes: number
  /** SteamID64s of the members who don't own it. Empty for games everyone owns. */
  missing: string[]
}

/** Near misses are only worth a lookup for the games the group plays most. */
export const NEAR_MISS_LIMIT = 40

/**
 * Games every member owns, and games all but one member own ("one purchase away").
 * Both sorted by combined playtime, then name.
 */
export function overlap(members: MemberLibrary[]): { shared: GroupGame[]; nearMiss: GroupGame[] } {
  const byApp = new Map<number, { name: string; minutes: number; owners: Set<string> }>()
  for (const m of members) {
    for (const g of m.games) {
      const e = byApp.get(g.appid) ?? { name: g.name, minutes: 0, owners: new Set<string>() }
      e.minutes += g.minutes
      e.owners.add(m.steamid)
      byApp.set(g.appid, e)
    }
  }

  const n = members.length
  const shared: GroupGame[] = []
  const nearMiss: GroupGame[] = []
  for (const [appid, e] of byApp) {
    if (e.owners.size === n) shared.push({ appid, name: e.name, minutes: e.minutes, missing: [] })
    else if (n >= 2 && e.owners.size === n - 1) {
      const missing = members.filter((m) => !e.owners.has(m.steamid)).map((m) => m.steamid)
      nearMiss.push({ appid, name: e.name, minutes: e.minutes, missing })
    }
  }
  const order = (a: GroupGame, b: GroupGame) => b.minutes - a.minutes || a.name.localeCompare(b.name)
  return { shared: shared.sort(order), nearMiss: nearMiss.sort(order).slice(0, NEAR_MISS_LIMIT) }
}

/** Most friends a group check takes, besides you. */
export const MAX_FRIENDS_PICKED = 3
