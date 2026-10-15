<script setup lang="ts">
import type { Profile } from '../../../shared/types'
import StateIcon from './StateIcon.vue'

defineProps<{ profile: Profile | null }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col gap-6">
    <StateIcon kind="lock" />
    <div class="anim-in flex flex-col gap-2.5" style="--i: 1">
      <h1 class="m-0 text-[34px] leading-tight font-black tracking-tight">{{ $t('private.title') }}</h1>
      <p class="m-0 leading-normal text-muted">
        {{ $t('private.lead', { name: profile?.name ?? $t('private.someone') }) }}
      </p>
    </div>

    <ol class="card anim-in m-0 flex flex-col gap-3 py-[18px] pr-[18px] pl-10 text-[15px] leading-normal text-ink-2" style="--i: 2">
      <i18n-t scope="global" keypath="private.step1" tag="li"><template #term><strong class="text-ink">{{ $t('private.step1Term') }}</strong></template></i18n-t>
      <i18n-t scope="global" keypath="private.step2" tag="li"><template #term><strong class="text-ink">{{ $t('private.step2Term') }}</strong></template></i18n-t>
      <i18n-t scope="global" keypath="private.step3" tag="li">
        <template #a><strong class="text-ink">{{ $t('private.step3A') }}</strong></template>
        <template #b><strong class="text-ink">{{ $t('private.step3B') }}</strong></template>
      </i18n-t>
      <i18n-t scope="global" keypath="private.step4" tag="li"><template #term><strong class="text-ink">{{ $t('private.step4Term') }}</strong></template></i18n-t>
    </ol>
    <p class="m-0 text-sm leading-normal text-faint">{{ $t('private.note') }}</p>

    <div class="flex flex-col gap-2.5">
      <button type="button" class="btn btn-primary" @click="$emit('retry')">{{ $t('private.retry') }}</button>
      <RouterLink to="/" class="btn btn-secondary">{{ $t('common.another') }}</RouterLink>
    </div>
  </div>
</template>
