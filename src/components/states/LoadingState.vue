<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLibrary } from '../../stores/library'
import ProfileRow from '../ProfileRow.vue'

const { t } = useI18n()
const lib = useLibrary()
const total = computed(() => lib.games.length)
const pct = computed(() => (total.value ? Math.round((lib.checked / total.value) * 100) : 0))

type State = 'done' | 'now' | 'wait'
const steps = computed<{ label: string; state: State }[]>(() => {
  const gotGames = lib.phase === 'checking'
  return [
    {
      label: gotGames ? t('loading.stepRead', { n: total.value }) : t('loading.stepReading'),
      state: gotGames ? 'done' : 'now',
    },
    { label: t('loading.stepMatch'), state: gotGames ? 'now' : 'wait' },
    { label: t('loading.stepVerdict'), state: 'wait' },
  ]
})
</script>

<template>
  <div class="flex flex-col gap-7" aria-busy="true">
    <ProfileRow
      :profile="lib.profile"
      :detail="lib.profile ? t('loading.profileFound') : t('loading.findingProfile')"
    />

    <div class="flex flex-col gap-3.5">
      <h1 class="m-0 text-[34px] leading-tight font-black tracking-tight">{{ t('loading.title') }}</h1>
      <div
        class="h-2.5 overflow-hidden rounded-full bg-raised"
        role="progressbar"
        :aria-label="t('loading.progressLabel')"
        aria-valuemin="0"
        :aria-valuemax="total || undefined"
        :aria-valuenow="total ? lib.checked : undefined"
      >
        <div
          class="relative h-full overflow-hidden rounded-full bg-accent transition-[width] duration-500 ease-out"
          :style="{ width: `${Math.max(pct, 3)}%` }"
        >
          <span class="shimmer absolute inset-0" aria-hidden="true" />
        </div>
      </div>
      <!-- Announced politely as batches finish, not on every frame -->
      <div class="flex justify-between font-mono text-[13px] text-muted" aria-live="polite">
        <span>{{ total ? t('loading.progress', { done: lib.checked, total }) : t('loading.waiting') }}</span>
        <span aria-hidden="true">{{ pct }}%</span>
      </div>
    </div>

    <ol class="card m-0 flex list-none flex-col gap-2.5 p-[18px] font-mono text-[13px] leading-snug">
      <li v-for="s in steps" :key="s.state + s.label" class="flex items-center gap-2.5">
        <span class="flex size-4 shrink-0 items-center justify-center" aria-hidden="true">
          <svg
            v-if="s.state === 'done'"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6FE3A6"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="anim-pop"
          >
            <path d="M5 12l5 5L19 7" />
          </svg>
          <span
            v-else-if="s.state === 'now'"
            class="size-3 animate-spin rounded-full border-2 border-accent border-t-transparent"
          />
          <span v-else class="size-1.5 rounded-full bg-dim" />
        </span>
        <span :class="{ done: 'text-ink-2', now: 'text-ink', wait: 'text-dim' }[s.state]">{{ s.label }}</span>
      </li>
    </ol>

    <div class="flex flex-col gap-2.5" aria-hidden="true">
      <div class="h-10 animate-pulse rounded-lg bg-field" />
      <div class="h-11 animate-pulse rounded-lg bg-surface [animation-delay:150ms]" />
      <div class="h-11 animate-pulse rounded-lg bg-surface [animation-delay:300ms]" />
    </div>

    <p class="m-0 text-sm leading-normal text-faint">{{ t('loading.note') }}</p>
  </div>
</template>

<style scoped>
.shimmer {
  background: linear-gradient(90deg, transparent, rgb(255 255 255 / 0.35), transparent);
  /* A few sweeps, then still (WCAG 2.2.2: no motion beyond 5 s without a pause control). */
  animation: shimmer 1.4s 3;
  transform: translateX(100%);
}
@keyframes shimmer {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(100%);
  }
}
</style>
