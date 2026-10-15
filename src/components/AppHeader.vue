<template>
  <header class="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-10">
    <RouterLink to="/" class="flex min-h-11 items-center gap-2 text-ink no-underline">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
        stroke-linecap="round" stroke-linejoin="round" class="text-accent" aria-hidden="true">
        <path d="M4 17l6-6-6-6" />
        <path d="M12 19h8" />
      </svg>
      <span class="text-base font-extrabold tracking-tight">
        stillneedwindows<span class="font-mono text-accent">?</span>
      </span>
    </RouterLink>
    <RouterLink
      to="/how-it-works"
      class="flex min-h-11 items-center border-b-2 border-transparent text-sm text-muted no-underline"
      active-class="!border-accent font-semibold !text-ink"
    >
      How it works
    </RouterLink>
  </header>
</template>
