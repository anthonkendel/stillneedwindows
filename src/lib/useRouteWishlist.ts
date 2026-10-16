import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWishlist } from '../stores/wishlist'

/**
 * Loads the wishlist named in the route (/u/:query/wishlist…) and, once a custom
 * name resolves, swaps the URL to the SteamID64 so shared links stay stable.
 */
export function useRouteWishlist() {
  const route = useRoute()
  const router = useRouter()
  const wish = useWishlist()
  const query = computed(() => String(route.params.query ?? ''))

  watch(query, (q) => q && wish.load(q), { immediate: true })
  watch(
    () => wish.profile?.steamid,
    (steamid) => {
      if (!steamid || steamid === query.value) return
      wish.key = steamid
      router.replace({ name: route.name!, params: { query: steamid }, query: route.query })
    },
  )

  return { wish, query, retry: () => wish.load(query.value, true) }
}
