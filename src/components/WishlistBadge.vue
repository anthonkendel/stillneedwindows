<script setup lang="ts">
import type { GameCompat, Tier } from '../../shared/types'
import TierBadge from './TierBadge.vue'

/** A wishlist game's tier, or "Not out yet" for unreleased games without reports. */
defineProps<{ row: { tier: Tier; compat?: GameCompat }; wide?: boolean }>()
</script>

<template>
  <span
    v-if="row.compat?.comingSoon && row.tier === 'pending'"
    class="inline-block shrink-0 rounded-md border border-control px-2.5 py-1 text-center font-mono text-xs font-semibold text-muted"
    :class="wide ? 'w-22' : ''"
    >{{ $t('wishlist.notOut') }}</span
  >
  <TierBadge v-else :tier="row.tier" :wide="wide" />
</template>
