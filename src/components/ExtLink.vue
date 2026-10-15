<script setup lang="ts">
/** External link: opens in a new tab and says so to screen readers. */
defineProps<{ href: string; icon?: boolean }>()
</script>

<template>
  <a :href="href" target="_blank" rel="noopener noreferrer">
    <slot />
    <svg v-if="icon !== false" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="ml-0.5 inline-block align-baseline" aria-hidden="true">
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
    <span class="sr-only"> {{ $t('common.newTab') }}</span>
  </a>
</template>
