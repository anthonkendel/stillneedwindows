<script setup lang="ts">
import type { Profile } from '../../shared/types'

defineProps<{ profile: Profile | null; detail: string }>()
</script>

<template>
  <div class="flex items-center gap-3">
    <img
      v-if="profile?.avatar"
      :src="profile.avatar"
      alt=""
      width="40"
      height="40"
      class="anim-pop size-10 shrink-0 rounded-full bg-raised"
    />
    <span v-else class="size-10 shrink-0 animate-pulse rounded-full bg-raised" aria-hidden="true" />
    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
      <span class="truncate text-[15px] font-bold">{{ profile?.name ?? $t('loading.lookingUp') }}</span>
      <span class="font-mono text-xs text-faint">{{ detail }}</span>
    </div>
    <slot />
  </div>
</template>
