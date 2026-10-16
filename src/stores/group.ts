import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { GameCompat, OwnedGame, Profile, Tier } from '../../shared/types'
import { fetchProfile } from '../lib/api'
import { checkCompat, incomplete } from '../lib/compat'
import { overlap, type GroupGame } from '../lib/group'
import { useLibrary } from './library'

export type GroupPhase = 'idle' | 'profiles' | 'checking' | 'done' | 'blocked' | 'error'
export type MemberStatus = 'loading' | 'ok' | 'private' | 'not_found' | 'error'

export interface Member {
  /** What was asked for: a SteamID64 or custom name. */
  query: string
  status: MemberStatus
  profile: Profile | null
  games: OwnedGame[]
}

export interface GroupRow extends GroupGame {
  tier: Tier
  compat: GameCompat | undefined
}

/**
 * Compares up to four libraries. Every library is read fresh from Steam (or reused
 * from the library check in this tab); nothing about the group is stored anywhere.
 */
export const useGroup = defineStore('group', () => {
  const key = ref('')
  const phase = ref<GroupPhase>('idle')
  const members = ref<Member[]>([])
  const shared = shallowRef<GroupGame[]>([])
  const nearMiss = shallowRef<GroupGame[]>([])
  const compat = shallowRef(new Map<number, GameCompat>())
  const checked = ref(0)
  const total = ref(0)
  const failed = ref(0)
  let run = 0

  const withCompat = (g: GroupGame): GroupRow => {
    const c = compat.value.get(g.appid)
    return { ...g, compat: c, tier: c?.tier ?? 'pending' }
  }
  const sharedRows = computed(() => shared.value.map(withCompat))
  const nearMissRows = computed(() => nearMiss.value.map(withCompat))

  /** The library check in this tab already has this member's games: don't ask Steam again. */
  function fromLibrary(query: string): Member | null {
    const lib = useLibrary()
    const same = lib.key === query || lib.profile?.steamid === query
    if (!same || !lib.profile || !['checking', 'done', 'empty'].includes(lib.phase)) return null
    return { query, status: 'ok', profile: lib.profile, games: lib.games }
  }

  async function fetchMember(query: string): Promise<Member> {
    try {
      const res = await fetchProfile(query)
      if (res.status === 'not_found') return { query, status: 'not_found', profile: null, games: [] }
      if (res.status === 'private') return { query, status: 'private', profile: res.profile, games: [] }
      return { query, status: 'ok', profile: res.profile, games: res.games }
    } catch {
      return { query, status: 'error', profile: null, games: [] }
    }
  }

  async function load(queries: string[], force = false) {
    const k = queries.join(',')
    if (!force && key.value === k && phase.value !== 'error' && phase.value !== 'idle') return
    const id = ++run
    key.value = k
    phase.value = 'profiles'
    members.value = queries.map((query) => ({ query, status: 'loading', profile: null, games: [] }))
    shared.value = []
    nearMiss.value = []
    compat.value = new Map()
    checked.value = 0
    total.value = 0
    failed.value = 0

    const loaded = await Promise.all(queries.map((q) => fromLibrary(q) ?? fetchMember(q)))
    if (id !== run) return
    // The same person added twice (by custom name and by id) counts once.
    const seen = new Set<string>()
    members.value = loaded.filter((m) => {
      const steamid = m.profile?.steamid
      if (!steamid) return true
      if (seen.has(steamid)) return false
      seen.add(steamid)
      return true
    })

    if (members.value.some((m) => m.status === 'error')) {
      phase.value = 'error'
      return
    }
    if (members.value.some((m) => m.status !== 'ok')) {
      phase.value = 'blocked'
      return
    }

    const result = overlap(members.value.map((m) => ({ steamid: m.profile!.steamid, games: m.games })))
    shared.value = result.shared
    nearMiss.value = result.nearMiss
    const ids = [...result.shared, ...result.nearMiss].map((g) => g.appid)
    total.value = ids.length
    phase.value = 'checking'
    await checkCompat(ids, (answers, covered) => {
      if (id !== run) return
      const next = new Map(compat.value)
      for (const g of answers) next.set(g.appid, g)
      compat.value = next
      failed.value += incomplete(answers, covered)
      checked.value += covered
    })
    if (id === run) phase.value = 'done'
  }

  return { key, phase, members, sharedRows, nearMissRows, checked, total, failed, load }
})
