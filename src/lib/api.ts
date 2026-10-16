import type { CompatResponse, FriendsResponse, ProfileResponse, WishlistResponse } from '../../shared/types'

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.json() as Promise<T>
}

export const fetchProfile = (query: string) => get<ProfileResponse>(`/api/profile/${encodeURIComponent(query)}`)

export const fetchWishlist = (query: string) => get<WishlistResponse>(`/api/wishlist/${encodeURIComponent(query)}`)

export const fetchFriends = (query: string) => get<FriendsResponse>(`/api/friends/${encodeURIComponent(query)}`)

export const fetchCompat = (appids: number[]) => get<CompatResponse>(`/api/compat?ids=${appids.join(',')}`)
