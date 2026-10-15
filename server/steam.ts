import { z } from 'zod'
import type { DeckStatus, OwnedGame, Profile } from '../shared/types.js'
import { getJson } from './http.js'

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

export async function getPlayer(steamid: string): Promise<{ profile: Profile; isPublic: boolean } | null> {
  const url = `${API}/ISteamUser/GetPlayerSummaries/v2/?key=${apiKey()}&steamids=${steamid}`
  const p = PlayerSummaries.parse(await getJson('steam', url)).response.players[0]
  if (!p) return null
  return {
    profile: {
      steamid: p.steamid,
      name: p.personaname,
      avatar: p.avatarmedium ?? p.avatarfull ?? '',
      profileUrl: p.profileurl,
    },
    isPublic: p.communityvisibilitystate === 3,
  }
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

// ---- Store info: native Linux build + Steam Deck rating -------------------------

const StoreItems = z.object({
  response: z.object({
    store_items: z
      .array(
        z.object({
          appid: z.number().optional(),
          id: z.number().optional(),
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
  linux: boolean
  deck: DeckStatus
}

const DECK: Record<number, DeckStatus> = { 1: 'unsupported', 2: 'playable', 3: 'verified' }

/** Pure parser, exported for tests. */
export function parseStoreItems(json: unknown): Map<number, StoreInfo> {
  const out = new Map<number, StoreInfo>()
  for (const item of StoreItems.parse(json).response.store_items ?? []) {
    const appid = item.appid ?? item.id
    if (appid === undefined) continue
    out.set(appid, {
      linux: item.platforms?.steamos_linux ?? false,
      deck: DECK[item.platforms?.steam_deck_compat_category ?? 0] ?? 'unknown',
    })
  }
  return out
}

/** One request for up to ~100 apps. */
export async function getStoreInfo(appids: number[]): Promise<Map<number, StoreInfo>> {
  const input = {
    ids: appids.map((appid) => ({ appid })),
    context: { language: 'english', country_code: 'US', steam_realm: 1 },
    data_request: { include_platforms: true },
  }
  const url = `${API}/IStoreBrowseService/GetItems/v1/?key=${apiKey()}&input_json=${encodeURIComponent(JSON.stringify(input))}`
  const json = await getJson('steam-store', url)
  return json ? parseStoreItems(json) : new Map()
}
