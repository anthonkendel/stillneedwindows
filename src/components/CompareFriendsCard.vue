<script setup lang="ts">
/** The way into the friend group check, from the verdict and wishlist pages. */
defineProps<{ query: string }>()
</script>

<template>
  <section
    class="anim-in flex flex-col gap-4 rounded-[14px] border border-accent bg-surface p-5"
    aria-labelledby="compare-heading"
  >
    <div class="flex items-center gap-4">
      <span class="flex shrink-0 -space-x-3" aria-hidden="true">
        <span class="size-10 rounded-full border-2 border-surface bg-accent" />
        <span class="size-10 rounded-full border-2 border-surface bg-[#6FE3A6]" />
        <span class="size-10 rounded-full border-2 border-surface bg-[#E9B949]" />
      </span>
      <div class="flex min-w-0 flex-col gap-0.5">
        <span class="kicker text-accent uppercase">{{ $t('compare.kicker') }}</span>
        <h2 id="compare-heading" class="m-0 text-[22px] leading-tight font-extrabold">{{ $t('compare.title') }}</h2>
      </div>
    </div>
    <p class="m-0 text-[15px] leading-normal text-muted">{{ $t('compare.text') }}</p>
    <RouterLink :to="{ name: 'friends', params: { query } }" class="btn btn-primary">
      {{ $t('compare.cta') }}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.6"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </RouterLink>
  </section>
</template>
