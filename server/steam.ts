import { z } from 'zod'
import { chunk, mapLimit } from '../shared/pool.js'
import type { DeckStatus, OwnedGame, Profile, WishlistItem } from '../shared/types.js'
import { getJson, UpstreamError } from './http.js'

const API = 'https://api.steampowered.com'

function apiKey(): string {
  const key = process.env.STEAM_API_KEY
  if (!key) throw new Error('STEAM_API_KEY is not set')
  return key
}

// ---- Vanity URL -> SteamID64 ------------------------------------------------

const ResolveVanity = z.object({
  response: z.object({ success: z.number(), steamid: z.string().optional() }),
})

export async function resolveVanity(name: string): Promise<string | null> {
  const url = `${API}/ISteamUser/ResolveVanityURL/v1/?key=${apiKey()}&vanityurl=${encodeURIComponent(name)}`
  const data = ResolveVanity.parse(await getJson('steam', url))
  return data.response.success === 1 && data.response.steamid ? data.response.steamid : null
}

// ---- Player summary -----------------------------------------------------------

const PlayerSummaries = z.object({
  response: z.object({
    players: z.array(
      z.object({
        steamid: z.string(),
        personaname: z.string(),
        avatarfull: z.string().optional(),
        avatarmedium: z.string().optional(),
        profileurl: z.string(),
        /** 3 = public; anything else hides the game list. */
        communityvisibilitystate: z.number(),
      }),
    ),
  }),
})

export interface Player {
  profile: Profile
  isPublic: boolean
}

type RawPlayer = z.infer<typeof PlayerSummaries>['response']['players'][number]

const toPlayer = (p: RawPlayer): Player => ({
  profile: {
    steamid: p.steamid,
    name: p.personaname,
    avatar: p.avatarmedium ?? p.avatarfull ?? '',
    profileUrl: p.profileurl,
  },
  isPublic: p.communityvisibilitystate === 3,
})

/** Steam takes up to 100 ids per call. */
const SUMMARIES_PER_CALL = 100

/** Summaries for many players, keyed by SteamID64. Unknown ids are left out. */
export async function getPlayers(steamids: string[]): Promise<Map<string, Player>> {
  const out = new Map<string, Player>()
  await mapLimit(chunk(steamids, SUMMARIES_PER_CALL), 4, async (ids) => {
    const url = `${API}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey()}&steamids=${ids.join(',')}`
    for (const p of PlayerSummaries.parse(await getJson('steam', url)).response.players) out.set(p.steamid, toPlayer(p))
  })
  return out
}

export async function getPlayer(steamid: string): Promise<Player | null> {
  return (await getPlayers([steamid])).get(steamid) ?? null
}

// ---- Owned games ----------------------------------------------------------------

const OwnedGames = z.object({
  response: z.object({
    game_count: z.number().optional(),
    games: z
      .array(z.object({ appid: z.number(), name: z.string().optional(), playtime_forever: z.number().optional() }))
      .optional(),
  }),
})

/** Pure parser, exported for tests. null = the game list is hidden. */
export function parseOwnedGames(json: unknown): OwnedGame[] | null {
  const r = OwnedGames.parse(json).response
  // A hidden game list comes back as an empty object, an empty library as game_count 0.
  if (r.game_count === undefined) return null
  return (r.games ?? []).map((g) => ({
    appid: g.appid,
    name: g.name ?? `App ${g.appid}`,
    minutes: g.playtime_forever ?? 0,
  }))
}

export async function getOwnedGames(steamid: string): Promise<OwnedGame[] | null> {
  const url =
    `${API}/IPlayerService/GetOwnedGames/v1/?key=${apiKey()}&steamid=${steamid}` +
    `&include_appinfo=1&include_played_free_games=1&format=json`
  return parseOwnedGames(await getJson('steam', url))
}

// ---- Friends list ---------------------------------------------------------------

const FriendList = z.object({
  friendslist: z
    .object({
      friends: z
        .array(
          z.object({ steamid: z.string(), relationship: z.string().optional(), friend_since: z.number().optional() }),
        )
        .optional(),
    })
    .optional(),
})

/** Pure parser, exported for tests. */
export function parseFriendList(json: unknown): { steamid: string; since: number }[] {
  return (FriendList.parse(json).friendslist?.friends ?? [])
    .filter((f) => !f.relationship || f.relationship === 'friend')
    .map((f) => ({ steamid: f.steamid, since: f.friend_since ?? 0 }))
}

/** null = the friends list is private (Steam answers 401). */
export async function getFriendList(steamid: string): Promise<{ steamid: string; since: number }[] | null> {
  const url = `${API}/ISteamUser/GetFriendList/v1/?key=${apiKey()}&steamid=${steamid}&relationship=friend`
  try {
    const json = await getJson('steam', url)
    return json === null ? null : parseFriendList(json)
  } catch (err) {
    if (err instanceof UpstreamError && (err.status === 401 || err.status === 403)) return null
    throw err
  }
}

// ---- Wishlist ---------------------------------------------------------------------

const Wishlist = z.object({
  response: z
    .object({
      items: z.array(z.object({ appid: z.number(), date_added: z.number().optional() })).optional(),
    })
    .optional(),
})

/** Pure parser, exported for tests. Newest first. A hidden wishlist comes back empty. */
export function parseWishlist(json: unknown): WishlistItem[] {
  return (Wishlist.parse(json).response?.items ?? [])
    .map((i) => ({ appid: i.appid, added: i.date_added ?? 0 }))
    .sort((a, b) => b.added - a.added)
}

export async function getWishlist(steamid: string): Promise<WishlistItem[]> {
  const url = `${API}/IWishlistService/GetWishlist/v1/?key=${apiKey()}&steamid=${steamid}`
  const json = await getJson('steam', url)
  return json === null ? [] : parseWishlist(json)
}

// ---- Store info: native Linux build + Steam Deck rating -------------------------

const StoreItems = z.object({
  response: z.object({
    store_items: z
      .array(
        z.object({
          appid: z.number().optional(),
          id: z.number().optional(),
          name: z.string().optional(),
          release: z.object({ is_coming_soon: z.boolean().optional() }).optional(),
          categories: z
            .object({
              supported_player_categoryids: z.array(z.number()).optional(),
              feature_categoryids: z.array(z.number()).optional(),
            })
            .optional(),
          platforms: z
            .object({
              steamos_linux: z.boolean().optional(),
              steam_deck_compat_category: z.number().optional(),
            })
            .optional(),
        }),
      )
      .optional(),
  }),
})

export interface StoreInfo {
  name: string | null
  linux: boolean
  deck: DeckStatus
  comingSoon: boolean
  multiplayer: boolean | null
}

/**
 * Steam store categories that mean people can play together: Multi-player, Co-op,
 * Shared/Split Screen, Cross-Platform Multiplayer, Online PvP, Split Screen PvP,
 * Online Co-op, Split Screen Co-op, LAN PvP, LAN Co-op and PvP.
 */
export const MULTIPLAYER_CATEGORIES = new Set([1, 9, 24, 27, 36, 37, 38, 39, 47, 48, 49])

const DECK: Record<number, DeckStatus> = { 1: 'unsupported', 2: 'playable', 3: 'verified' }

/** Pure parser, exported for tests. */
export function parseStoreItems(json: unknown): Map<number, StoreInfo> {
  const out = new Map<number, StoreInfo>()
  for (const item of StoreItems.parse(json).response.store_items ?? []) {
    const appid = item.appid ?? item.id
    if (appid === undefined) continue
    const cats = item.categories
    out.set(appid, {
      name: item.name || null,
      linux: item.platforms?.steamos_linux ?? false,
      deck: DECK[item.platforms?.steam_deck_compat_category ?? 0] ?? 'unknown',
      comingSoon: item.release?.is_coming_soon ?? false,
      multiplayer: cats
        ? [...(cats.supported_player_categoryids ?? []), ...(cats.feature_categoryids ?? [])].some((c) =>
            MULTIPLAYER_CATEGORIES.has(c),
          )
        : null,
    })
  }
  return out
}

/** One request for up to ~100 apps. */
export async function getStoreInfo(appids: number[]): Promise<Map<number, StoreInfo>> {
  const input = {
    ids: appids.map((appid) => ({ appid })),
    context: { language: 'english', country_code: 'US', steam_realm: 1 },
    data_request: { include_platforms: true, include_release: true, include_categories: true },
  }
  const url = `${API}/IStoreBrowseService/GetItems/v1/?key=${apiKey()}&input_json=${encodeURIComponent(JSON.stringify(input))}`
  const json = await getJson('steam-store', url)
  return json ? parseStoreItems(json) : new Map()
}
