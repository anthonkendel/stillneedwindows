<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PageMain from '../components/PageMain.vue'
import ProfileRow from '../components/ProfileRow.vue'
import ViewTabs from '../components/ViewTabs.vue'
import { formatNumber } from '../lib/tiers'
import { useUserHeader } from '../lib/userHeader'
import { useLibrary } from '../stores/library'
import { useWishlist } from '../stores/wishlist'

/**
 * Frame for /u/:query (verdict) and /u/:query/wishlist. The profile row and tabs
 * live here, so switching tabs only swaps the content below them.
 */
const { t } = useI18n()
const lib = useLibrary()
const wish = useWishlist()
const { query, profile, tab, hoursHidden, onWishlist, wishReady } = useUserHeader()

const detail = computed(() => {
  if (onWishlist.value && wishReady.value)
    return t('wishlist.count', { n: formatNumber(wish.items.length) }, wish.items.length)
  return t('results.games', { n: formatNumber(lib.rows.length) }, lib.rows.length)
})
</script>

<template>
  <PageMain>
    <template v-if="profile">
      <ProfileRow :profile="profile" :detail="detail">
        <RouterLink to="/" class="flex min-h-11 items-center text-sm">{{ t('results.newCheck') }}</RouterLink>
      </ProfileRow>
      <div class="flex flex-col gap-2">
        <ViewTabs :query="profile.steamid || query" :current="tab" :hours-disabled="hoursHidden" />
        <p v-if="hoursHidden && tab === 'games'" id="hours-hidden" class="m-0 text-[13px] leading-normal text-faint">
          {{ t('results.hoursHidden') }}
        </p>
      </div>
    </template>
    <RouterView v-slot="{ Component }">
      <Transition name="page" mode="out-in">
        <component :is="Component" />
      </Transition>
    </RouterView>
  </PageMain>
</template>
