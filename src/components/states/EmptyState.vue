<script setup lang="ts">
import type { Profile } from '../../../shared/types'
import ProfileRow from '../ProfileRow.vue'

defineProps<{ profile: Profile | null }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col gap-6">
    <ProfileRow :profile="profile" detail="0 games" />
    <div class="text-[128px] leading-[0.85] font-black tracking-[-0.05em] text-line-strong" aria-hidden="true">0</div>
    <div class="flex flex-col gap-2.5">
      <h1 class="m-0 text-[34px] leading-tight font-black tracking-tight">Nothing to check</h1>
      <p class="m-0 leading-normal text-muted">
        This profile is public, but it doesn't own any games we can see. Technically, that means you don't need
        Windows.
      </p>
    </div>

    <div class="card flex flex-col gap-2.5 p-[18px]">
      <span class="text-[15px] font-bold">Expected some games?</span>
      <ul class="m-0 flex flex-col gap-2 pl-5 text-[15px] leading-normal text-ink-2">
        <li>Check that <strong class="text-ink">Game details</strong> is public, not only the profile.</li>
        <li>Games borrowed through Steam Families aren't counted.</li>
        <li>Maybe this is a second account.</li>
      </ul>
    </div>

    <div class="flex flex-col gap-2.5">
      <button type="button" class="btn btn-primary border-0" @click="$emit('retry')">Try again</button>
      <RouterLink to="/" class="btn btn-secondary">Check another profile</RouterLink>
    </div>
  </div>
</template>
