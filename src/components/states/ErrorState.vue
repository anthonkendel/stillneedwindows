<script setup lang="ts">
import StateIcon from './StateIcon.vue'

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col gap-6" role="alert">
    <StateIcon kind="warn" />
    <div class="anim-in flex flex-col gap-2.5" style="--i: 1">
      <h1 class="m-0 text-[34px] leading-tight font-black tracking-tight">{{ $t('error.title') }}</h1>
      <p class="m-0 leading-normal text-muted">{{ $t('error.lead') }}</p>
    </div>
    <div class="flex flex-col gap-2.5">
      <button type="button" class="btn btn-primary" @click="$emit('retry')">{{ $t('common.retry') }}</button>
      <RouterLink to="/" class="btn btn-secondary">{{ $t('error.back') }}</RouterLink>
    </div>
  </div>
</template>
