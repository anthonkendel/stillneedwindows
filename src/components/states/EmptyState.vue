<script setup lang="ts">
import type { Profile } from '../../../shared/types'
import ProfileRow from '../ProfileRow.vue'

defineProps<{ profile: Profile | null }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col gap-6">
    <ProfileRow :profile="profile" :detail="$t('empty.games')" />
    <div class="anim-pop text-[128px] leading-[0.85] font-black tracking-[-0.05em] text-control" aria-hidden="true">0</div>
    <div class="anim-in flex flex-col gap-2.5" style="--i: 2">
      <h1 class="m-0 text-[34px] leading-tight font-black tracking-tight">{{ $t('empty.title') }}</h1>
      <p class="m-0 leading-normal text-muted">{{ $t('empty.lead') }}</p>
    </div>

    <div class="card flex flex-col gap-2.5 p-[18px]">
      <h2 class="m-0 text-[15px] font-bold">{{ $t('empty.expected') }}</h2>
      <ul class="m-0 flex flex-col gap-2 pl-5 text-[15px] leading-normal text-ink-2">
        <i18n-t scope="global" keypath="empty.reason1" tag="li"><template #term><strong class="text-ink">{{ $t('private.step3B') }}</strong></template></i18n-t>
        <li>{{ $t('empty.reason2') }}</li>
        <li>{{ $t('empty.reason3') }}</li>
      </ul>
    </div>

    <div class="flex flex-col gap-2.5">
      <button type="button" class="btn btn-primary" @click="$emit('retry')">{{ $t('common.retry') }}</button>
      <RouterLink to="/" class="btn btn-secondary">{{ $t('common.another') }}</RouterLink>
    </div>
  </div>
</template>
