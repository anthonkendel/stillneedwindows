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
  /** Are We Anti-Cheat Yet page slug, for linking to the source. */
  slug?: string
}

export const REPO_URL = 'https://github.com/anthonkendel/stillneedwindows'

export const SOURCES = {
  protondb: 'https://www.protondb.com',
  awacy: 'https://areweanticheatyet.com',
  steamApi: 'https://steamcommunity.com/dev',
  steamStore: 'https://store.steampowered.com',
} as const

export const sourceLinks = {
  protondb: (appid: number) => `${SOURCES.protondb}/app/${appid}`,
  steamStore: (appid: number) => `${SOURCES.steamStore}/app/${appid}`,
  awacy: (slug?: string) => (slug ? `${SOURCES.awacy}/game/${slug}` : SOURCES.awacy),
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
  /** Store name. Wishlists don't include names, so they come from here. null if the store didn't say. */
  name: string | null
  /** Not released yet: no ProtonDB reports are expected. */
  comingSoon: boolean
  /** Has a multiplayer mode (online, LAN or split screen). null when the store didn't send categories. */
  multiplayer: boolean | null
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

export interface WishlistItem {
  appid: number
  /** When it was added, epoch seconds. 0 if unknown. */
  added: number
}

/** Wishlists follow the Game details privacy setting, so a hidden one looks empty. */
export type WishlistResponse =
  | { status: 'ok'; profile: Profile; items: WishlistItem[] }
  | { status: 'private'; profile: Profile }
  | { status: 'not_found' }

export interface Friend extends Profile {
  /** Became friends, epoch seconds. 0 if unknown. */
  since: number
  /** False when the friend's profile is private, so their games can't be read. */
  isPublic: boolean
}

export type FriendsResponse =
  | { status: 'ok'; profile: Profile; friends: Friend[] }
  /** The friends list is private (the profile itself may be public). */
  | { status: 'private'; profile: Profile }
  | { status: 'not_found' }

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
