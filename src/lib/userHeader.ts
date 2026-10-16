import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useLibrary } from '../stores/library'
import { useWishlist } from '../stores/wishlist'

/**
 * The profile row and tabs shared by the verdict and wishlist pages (UserLayout).
 * They show as soon as either check knows whose profile this is, and stay put
 * while switching tabs; the loading screens below then skip their own profile row.
 */
export function useUserHeader() {
  const route = useRoute()
  const lib = useLibrary()
  const wish = useWishlist()
  const query = computed(() => String(route.params.query ?? ''))
  const onWishlist = computed(() => route.name === 'wishlist')
  const isThis = (key: string, steamid: string | undefined) => key === query.value || steamid === query.value

  const libReady = computed(() => lib.phase === 'done' && isThis(lib.key, lib.profile?.steamid))
  const wishReady = computed(
    () => ['checking', 'done', 'empty', 'private'].includes(wish.phase) && isThis(wish.key, wish.profile?.steamid),
  )

  const profile = computed(() =>
    libReady.value ? lib.profile : onWishlist.value && wishReady.value ? wish.profile : null,
  )
  const tab = computed(() =>
    onWishlist.value ? 'wishlist' : route.query.by === 'hours' && lib.playtimeVisible ? 'hours' : 'games',
  )
  const hoursHidden = computed(() => libReady.value && !lib.playtimeVisible)

  return { query, profile, tab, hoursHidden, onWishlist, libReady, wishReady }
}
