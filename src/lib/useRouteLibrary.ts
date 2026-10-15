import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibrary } from '../stores/library'

/**
 * Loads the library named in the route (/u/:query) and, once a custom name
 * resolves, swaps the URL to the SteamID64 so shared links stay stable.
 */
export function useRouteLibrary() {
  const route = useRoute()
  const router = useRouter()
  const lib = useLibrary()
  const query = computed(() => String(route.params.query ?? ''))

  watch(query, (q) => q && lib.load(q), { immediate: true })

  watch(
    () => lib.profile?.steamid,
    (steamid) => {
      if (!steamid || steamid === query.value || lib.phase === 'not_found') return
      lib.alias(steamid)
      router.replace({ name: route.name!, params: { query: steamid }, hash: route.hash })
    },
  )

  return { lib, query, retry: () => lib.load(query.value, true) }
}
