<script setup lang="ts">
import { computed } from 'vue'
import type { Tier } from '../../shared/types'
import { TIER_META } from '../lib/tiers'

const props = defineProps<{ tier: Tier; wide?: boolean }>()
const meta = computed(() => TIER_META[props.tier])
</script>

<template>
  <span
    class="inline-block shrink-0 rounded-md px-2.5 py-1 text-center font-mono text-xs font-semibold transition-colors duration-300"
    :class="wide ? 'w-22' : ''"
    :style="{ background: meta.color, color: meta.ink }"
    lang="en"
  >
    {{ meta.label }}
  </span>
</template>
