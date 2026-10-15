<script setup lang="ts">
defineProps<{ kind: 'lock' | 'search' | 'warn' }>()
</script>

<template>
  <div class="flex size-14 items-center justify-center rounded-[14px] bg-raised">
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" class="text-accent" aria-hidden="true">
      <template v-if="kind === 'lock'">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </template>
      <template v-else-if="kind === 'search'">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-4-4M9 9l4 4M13 9l-4 4" />
      </template>
      <template v-else>
        <path d="M12 3l10 18H2z" />
        <path d="M12 10v5M12 18h.01" />
      </template>
    </svg>
  </div>
</template>
