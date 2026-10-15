<script setup lang="ts">
import StateIcon from './StateIcon.vue'

defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col gap-6">
    <StateIcon kind="warn" />
    <div class="flex flex-col gap-2.5">
      <h1 class="m-0 text-[34px] leading-tight font-black tracking-tight">Steam isn't answering</h1>
      <p class="m-0 leading-normal text-muted">
        We couldn't reach Steam right now. It's usually back within a few minutes.
      </p>
    </div>
    <div class="flex flex-col gap-2.5">
      <button type="button" class="btn btn-primary border-0" @click="$emit('retry')">Try again</button>
      <RouterLink to="/" class="btn btn-secondary">Back to start</RouterLink>
    </div>
  </div>
</template>
