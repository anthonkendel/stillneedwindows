import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { GameCompat, OwnedGame, Profile, Tier } from '../../shared/types'
import { fetchProfile } from '../lib/api'
import { checkCompat, incomplete } from '../lib/compat'

export type Phase = 'idle' | 'profile' | 'checking' | 'done' | 'private' | 'not_found' | 'empty' | 'error'

export interface Row extends OwnedGame {
  tier: Tier
  compat: GameCompat | undefined
}

export const useLibrary = defineStore('library', () => {
  const key = ref('')
  const phase = ref<Phase>('idle')
  const profile = ref<Profile | null>(null)
  const games = shallowRef<OwnedGame[]>([])
  const compat = shallowRef(new Map<number, GameCompat>())
  const playtimeVisible = ref(false)
  const checked = ref(0)
  const failed = ref(0)
  let run = 0

  const rows = computed<Row[]>(() =>
    games.value.map((g) => {
      const c = compat.value.get(g.appid)
      return { ...g, compat: c, tier: c?.tier ?? 'pending' }
    }),
  )

  function addBatch(answers: GameCompat[], covered: number) {
    const next = new Map(compat.value)
    for (const g of answers) next.set(g.appid, g)
    compat.value = next
    failed.value += incomplete(answers, covered)
    checked.value += covered
  }

  /** Loads a profile and checks every game. Skips work already done for this query. */
  async function load(query: string, force = false) {
    if (!force && key.value === query && phase.value !== 'error' && phase.value !== 'idle') return
    const id = ++run
    key.value = query
    phase.value = 'profile'
    profile.value = null
    games.value = []
    compat.value = new Map()
    checked.value = 0
    failed.value = 0

    try {
      const res = await fetchProfile(query)
      if (id !== run) return
      if (res.status === 'not_found') {
        phase.value = 'not_found'
        return
      }
      profile.value = res.profile
      if (res.status === 'private') {
        phase.value = 'private'
        return
      }
      games.value = res.games
      playtimeVisible.value = res.playtimeVisible
      if (res.games.length === 0) {
        phase.value = 'empty'
        return
      }

      phase.value = 'checking'
      // Games arrive sorted by playtime, so the ones that matter most come back first.
      await checkCompat(
        res.games.map((g) => g.appid),
        (answers, covered) => id === run && addBatch(answers, covered),
      )
      if (id === run) phase.value = 'done'
    } catch {
      if (id === run) phase.value = 'error'
    }
  }

  /** After a custom name resolves, the SteamID64 becomes the canonical key. */
  function alias(query: string) {
    key.value = query
  }

  return { key, phase, profile, games, rows, playtimeVisible, checked, failed, load, alias }
})
