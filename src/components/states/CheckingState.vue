<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Profile } from '../../../shared/types'
import ProfileRow from '../ProfileRow.vue'

/** Progress while a wishlist or group is checked. The library has its own, richer LoadingState. */
const props = defineProps<{ profile: Profile | null; title: string; done: number; total: number }>()
const { t } = useI18n()
const pct = computed(() => (props.total ? Math.round((props.done / props.total) * 100) : 0))
</script>

<template>
  <div class="flex flex-col gap-7" aria-busy="true">
    <ProfileRow :profile="profile" :detail="profile ? t('loading.profileFound') : t('loading.findingProfile')" />
    <div class="flex flex-col gap-3.5">
      <h1 class="m-0 text-[34px] leading-tight font-black tracking-tight">{{ title }}</h1>
      <div
        class="h-2.5 overflow-hidden rounded-full bg-raised"
        role="progressbar"
        :aria-label="t('loading.progressLabel')"
        aria-valuemin="0"
        :aria-valuemax="total || undefined"
        :aria-valuenow="total ? done : undefined"
      >
        <div
          class="h-full rounded-full bg-accent transition-[width] duration-500 ease-out"
          :style="{ width: `${Math.max(pct, 3)}%` }"
        />
      </div>
      <div class="flex justify-between font-mono text-[13px] text-muted" aria-live="polite">
        <span>{{ total ? t('loading.progress', { done, total }) : t('loading.waiting') }}</span>
        <span aria-hidden="true">{{ pct }}%</span>
      </div>
    </div>
    <div class="flex flex-col gap-2.5" aria-hidden="true">
      <div class="h-11 animate-pulse rounded-lg bg-surface" />
      <div class="h-11 animate-pulse rounded-lg bg-surface [animation-delay:150ms]" />
      <div class="h-11 animate-pulse rounded-lg bg-surface [animation-delay:300ms]" />
    </div>
  </div>
</template>
