<script setup lang="ts">
import { homeRoute } from '../lib/lastUser'
</script>

<template>
  <header class="border-b border-line">
    <nav class="mx-auto flex max-w-5xl items-center justify-between gap-3 px-5 py-3 sm:px-10">
      <RouterLink
        :to="homeRoute"
        class="group flex min-h-11 items-center gap-2 text-ink no-underline hover:text-ink"
        :aria-label="$t('nav.home')"
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.4"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-accent transition-transform duration-200 group-hover:translate-x-0.5"
          aria-hidden="true"
        >
          <path d="M4 17l6-6-6-6" />
          <path d="M12 19h8" />
        </svg>
        <span class="text-base font-extrabold tracking-tight" aria-hidden="true">
          stillneedwindows<span class="font-mono text-accent">?</span>
        </span>
      </RouterLink>
      <RouterLink
        to="/how-it-works"
        class="ui-link relative flex min-h-11 items-center px-1 text-sm after:absolute after:inset-x-1 after:bottom-1.5 after:h-0.5 after:scale-x-0 after:bg-accent after:transition-transform after:duration-200 hover:after:scale-x-100"
        active-class="!text-ink font-semibold after:!scale-x-100"
      >
        {{ $t('nav.how') }}
      </RouterLink>
    </nav>
  </header>
</template>
