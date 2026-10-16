<script setup lang="ts">
import type { Summary } from '../../shared/verdict'
import { TIER_META } from '../lib/tiers'

/** The tier bar and the table under it, shared by the verdict and wishlist tabs. */
defineProps<{
  summary: Summary
  /** Accessible description of the bar. */
  label: string
  /** How a slice's value is shown: a game count or hours. */
  format: (value: number) => string
}>()
</script>

<template>
  <section class="flex flex-col gap-3.5">
    <div class="anim-grow flex h-10 gap-0.5 overflow-hidden rounded-lg" role="img" :aria-label="label">
      <div
        v-for="s in summary.slices.filter((x) => x.value > 0)"
        :key="s.tier"
        class="transition-[flex-grow] duration-500 ease-out"
        :style="{ flex: `${s.value} 1 0`, background: TIER_META[s.tier].color }"
      />
    </div>
    <ul class="m-0 flex list-none flex-col p-0">
      <li
        v-for="(s, i) in summary.slices"
        :key="s.tier"
        class="anim-in flex items-center gap-3 border-b border-line py-3"
        :style="{ '--i': i }"
      >
        <span
          class="size-3 shrink-0 rounded-[3px]"
          :style="{ background: TIER_META[s.tier].color }"
          aria-hidden="true"
        />
        <span class="flex-1 font-semibold" lang="en">{{ TIER_META[s.tier].label }}</span>
        <span class="font-mono text-[13px] text-faint">{{ format(s.value) }}</span>
        <span class="w-12 text-right text-lg font-extrabold tabular-nums">{{ s.pct }}%</span>
      </li>
    </ul>
    <slot />
  </section>
</template>
