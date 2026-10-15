import type { CompatResponse, ProfileResponse } from '../../shared/types'

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.json() as Promise<T>
}

export const fetchProfile = (query: string) => get<ProfileResponse>(`/api/profile/${encodeURIComponent(query)}`)

export const fetchCompat = (appids: number[]) => get<CompatResponse>(`/api/compat?ids=${appids.join(',')}`)
