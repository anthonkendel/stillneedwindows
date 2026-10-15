// Types shared by the API (server/) and the web app (src/).

export const TIERS = ['native', 'platinum', 'gold', 'silver', 'bronze', 'borked', 'pending'] as const
export type Tier = (typeof TIERS)[number]

/** ProtonDB's own tiers (it has no "native"). */
export type ProtonTier = Exclude<Tier, 'native'>

export type DeckStatus = 'verified' | 'playable' | 'unsupported' | 'unknown'

/** Status values used by Are We Anti-Cheat Yet. */
export type AntiCheatStatus = 'supported' | 'running' | 'planned' | 'broken' | 'denied'

export interface AntiCheatInfo {
  status: AntiCheatStatus
  anticheats: string[]
}

export interface Profile {
  steamid: string
  name: string
  avatar: string
  profileUrl: string
}

export interface OwnedGame {
  appid: number
  name: string
  /** Total playtime in minutes. 0 when the owner hides playtime. */
  minutes: number
}

export type ProfileResponse =
  | { status: 'ok'; profile: Profile; games: OwnedGame[]; playtimeVisible: boolean }
  | { status: 'private'; profile: Profile }
  | { status: 'not_found' }

export interface GameCompat {
  appid: number
  /** The tier we count the game as. See effectiveTier(). */
  tier: Tier
  /** ProtonDB's tier, or null when ProtonDB has no reports. */
  protonTier: ProtonTier | null
  native: boolean
  deck: DeckStatus
  antiCheat: AntiCheatInfo | null
  /** False when an upstream lookup failed and this entry is a best guess. */
  complete: boolean
}

export interface CompatResponse {
  games: GameCompat[]
}

/** Anti-cheat statuses that mean the game won't run online on Linux. */
export const BLOCKING_ANTICHEAT: AntiCheatStatus[] = ['broken', 'denied']

/**
 * Native Linux builds win. A game whose anti-cheat blocks Linux counts as
 * borked even if ProtonDB reports (often single-player only) say otherwise.
 * No ProtonDB reports means pending.
 */
export function effectiveTier(input: {
  native: boolean
  protonTier: ProtonTier | null
  antiCheat: AntiCheatInfo | null
}): Tier {
  if (input.native) return 'native'
  if (input.antiCheat && BLOCKING_ANTICHEAT.includes(input.antiCheat.status)) return 'borked'
  return input.protonTier ?? 'pending'
}
