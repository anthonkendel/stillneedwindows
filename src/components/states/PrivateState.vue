<script setup lang="ts">
import type { Profile } from '../../../shared/types'
import StateIcon from './StateIcon.vue'

defineProps<{ profile: Profile | null }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col gap-6">
    <StateIcon kind="lock" />
    <div class="flex flex-col gap-2.5">
      <h1 class="m-0 text-[34px] leading-tight font-black tracking-tight">Your game list is private</h1>
      <p class="m-0 leading-normal text-muted">
        We found {{ profile?.name ?? 'the profile' }}, but Steam won't share the games. Make them public for a
        minute, then try again.
      </p>
    </div>

    <ol class="card m-0 flex flex-col gap-3 py-[18px] pr-[18px] pl-10 text-[15px] leading-normal text-ink-2">
      <li>On Steam, open your profile and choose <strong class="text-ink">Edit Profile</strong>.</li>
      <li>Go to <strong class="text-ink">Privacy Settings</strong>.</li>
      <li>Set <strong class="text-ink">My profile</strong> and <strong class="text-ink">Game details</strong> to Public.</li>
      <li>For the hours view, untick <strong class="text-ink">Always keep my total playtime private</strong>.</li>
    </ol>
    <p class="m-0 text-sm leading-normal text-faint">
      You can set it back to private right after the check. Steam can take a minute to apply the change.
    </p>

    <div class="flex flex-col gap-2.5">
      <button type="button" class="btn btn-primary border-0" @click="$emit('retry')">I've made it public, try again</button>
      <RouterLink to="/" class="btn btn-secondary">Check another profile</RouterLink>
    </div>
  </div>
</template>
