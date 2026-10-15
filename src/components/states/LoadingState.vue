<script setup lang="ts">
import { computed } from 'vue'
import { useLibrary } from '../../stores/library'
import ProfileRow from '../ProfileRow.vue'

const lib = useLibrary()
const total = computed(() => lib.games.length)
const pct = computed(() => (total.value ? Math.round((lib.checked / total.value) * 100) : 0))

type Step = { label: string; state: 'done' | 'now' | 'wait' }
const steps = computed<Step[]>(() => {
  const gotGames = lib.phase === 'checking'
  return [
    { label: gotGames ? `Read ${total.value} games from Steam` : 'Reading your games from Steam', state: gotGames ? 'done' : 'now' },
    { label: 'Matching ProtonDB tiers and anti-cheat data', state: gotGames ? 'now' : 'wait' },
    { label: 'Working out your verdict', state: 'wait' },
  ]
})
const tag = { done: 'done', now: '....', wait: 'wait' }
const tagColor = { done: 'text-[#6FE3A6]', now: 'text-accent', wait: 'text-[#4A5361]' }
const textColor = { done: 'text-ink-2', now: 'text-ink', wait: 'text-dim' }
</script>

<template>
  <div class="flex flex-col gap-7" aria-busy="true">
    <ProfileRow :profile="lib.profile" :detail="lib.profile ? 'Profile found' : 'Finding profile'" />

    <div class="flex flex-col gap-3.5">
      <h1 class="m-0 text-[34px] leading-tight font-black tracking-tight">Checking your library…</h1>
      <div
        class="h-2.5 overflow-hidden rounded-full bg-raised"
        role="progressbar"
        aria-label="Games checked"
        aria-valuemin="0"
        :aria-valuemax="total"
        :aria-valuenow="lib.checked"
      >
        <div class="h-full rounded-full bg-accent transition-[width] duration-300" :style="{ width: `${pct}%` }" />
      </div>
      <div class="flex justify-between font-mono text-[13px] text-muted">
        <span>{{ total ? `${lib.checked} of ${total} games` : 'Waiting for Steam' }}</span>
        <span>{{ pct }}%</span>
      </div>
    </div>

    <div class="card flex flex-col gap-2.5 p-[18px] font-mono text-[13px] leading-snug">
      <div v-for="s in steps" :key="s.label" class="flex gap-2.5">
        <span :class="tagColor[s.state]">{{ tag[s.state] }}</span>
        <span :class="textColor[s.state]">{{ s.label }}</span>
      </div>
    </div>

    <div class="flex flex-col gap-2.5" aria-hidden="true">
      <div class="h-10 animate-pulse rounded-lg bg-field" />
      <div class="h-11 animate-pulse rounded-lg bg-surface" />
      <div class="h-11 animate-pulse rounded-lg bg-surface" />
    </div>

    <p class="m-0 text-sm leading-normal text-faint">
      Big libraries take up to a minute the first time. Games someone has checked before are instant.
    </p>
  </div>
</template>
