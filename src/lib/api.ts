import type { CompatResponse, FriendsResponse, Profile, ProfileResponse, WishlistResponse } from '../../shared/types'

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.json() as Promise<T>
}

type OkProfile = Extract<ProfileResponse, { status: 'ok' }>

/**
 * Public profiles already read in this tab, by what was asked for and by SteamID64,
 * for five minutes (the same as the browser cache). Adding a friend by link, the
 * group check and "Edit group" then share one read and can show names, not ids.
 * Private and missing profiles aren't kept, so "try again" really asks again.
 */
const PROFILE_TTL = 5 * 60 * 1000
const profiles = new Map<string, { res: OkProfile; at: number }>()

export async function fetchProfile(query: string): Promise<ProfileResponse> {
  const hit = profiles.get(query)
  if (hit && Date.now() - hit.at < PROFILE_TTL) return hit.res
  const res = await get<ProfileResponse>(`/api/profile/${encodeURIComponent(query)}`)
  if (res.status === 'ok') {
    const entry = { res, at: Date.now() }
    profiles.set(query, entry)
    profiles.set(res.profile.steamid, entry)
  }
  return res
}

/** A profile read earlier in this tab, if any. Never fetches. */
export const knownProfile = (query: string): Profile | undefined => profiles.get(query)?.res.profile

export const fetchWishlist = (query: string) => get<WishlistResponse>(`/api/wishlist/${encodeURIComponent(query)}`)

export const fetchFriends = (query: string) => get<FriendsResponse>(`/api/friends/${encodeURIComponent(query)}`)

export const fetchCompat = (appids: number[]) => get<CompatResponse>(`/api/compat?ids=${appids.join(',')}`)
