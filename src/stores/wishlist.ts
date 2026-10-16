import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import type { GameCompat, Profile, Tier, WishlistItem } from '../../shared/types'
import { fetchWishlist } from '../lib/api'
import { checkCompat, incomplete } from '../lib/compat'

export type WishlistPhase = 'idle' | 'profile' | 'checking' | 'done' | 'private' | 'not_found' | 'empty' | 'error'

export interface WishRow extends WishlistItem {
  name: string
  tier: Tier
  compat: GameCompat | undefined
}

/** A profile's wishlist, checked game by game. Lives only in this tab, like the library. */
export const useWishlist = defineStore('wishlist', () => {
  const key = ref('')
  const phase = ref<WishlistPhase>('idle')
  const profile = ref<Profile | null>(null)
  const items = shallowRef<WishlistItem[]>([])
  const compat = shallowRef(new Map<number, GameCompat>())
  const checked = ref(0)
  const failed = ref(0)
  let run = 0

  const rows = computed<WishRow[]>(() =>
    items.value.map((i) => {
      const c = compat.value.get(i.appid)
      return { ...i, compat: c, name: c?.name ?? `App ${i.appid}`, tier: c?.tier ?? 'pending' }
    }),
  )

  async function load(query: string, force = false) {
    if (!force && key.value === query && phase.value !== 'error' && phase.value !== 'idle') return
    const id = ++run
    key.value = query
    phase.value = 'profile'
    profile.value = null
    items.value = []
    compat.value = new Map()
    checked.value = 0
    failed.value = 0

    try {
      const res = await fetchWishlist(query)
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
      items.value = res.items
      if (res.items.length === 0) {
        phase.value = 'empty'
        return
      }

      phase.value = 'checking'
      await checkCompat(
        res.items.map((i) => i.appid),
        (answers, covered) => {
          if (id !== run) return
          const next = new Map(compat.value)
          for (const g of answers) next.set(g.appid, g)
          compat.value = next
          failed.value += incomplete(answers, covered)
          checked.value += covered
        },
      )
      if (id === run) phase.value = 'done'
    } catch {
      if (id === run) phase.value = 'error'
    }
  }

  return { key, phase, profile, items, rows, checked, failed, load }
})
