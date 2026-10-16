<script setup lang="ts">
/**
 * By games / By hours played / Wishlist. Each is its own address, so a view can be
 * shared and the back button works: ?by=hours on the verdict page, /wishlist for the wishlist.
 */
defineProps<{ query: string; current: 'games' | 'hours' | 'wishlist'; hoursDisabled?: boolean }>()
</script>

<template>
  <nav :aria-label="$t('results.countBy')" class="grid grid-cols-3 rounded-xl border border-control bg-field p-1">
    <RouterLink
      :to="{ name: 'results', params: { query } }"
      class="segment"
      :aria-current="current === 'games' ? 'page' : undefined"
      replace
      >{{ $t('results.byGames') }}</RouterLink
    >
    <span
      v-if="hoursDisabled"
      class="segment"
      aria-disabled="true"
      :aria-describedby="current === 'games' ? 'hours-hidden' : undefined"
      >{{ $t('results.byHours') }}</span
    >
    <RouterLink
      v-else
      :to="{ name: 'results', params: { query }, query: { by: 'hours' } }"
      class="segment"
      :aria-current="current === 'hours' ? 'page' : undefined"
      replace
      >{{ $t('results.byHours') }}</RouterLink
    >
    <RouterLink
      :to="{ name: 'wishlist', params: { query } }"
      class="segment"
      :aria-current="current === 'wishlist' ? 'page' : undefined"
      replace
      >{{ $t('results.byWishlist') }}</RouterLink
    >
  </nav>
</template>
