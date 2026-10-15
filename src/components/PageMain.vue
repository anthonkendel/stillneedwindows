<template>
  <!-- tabindex lets the router move focus here after navigation; it's never in the tab order. -->
  <main id="main" tabindex="-1" class="mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-7 px-5 pt-8 pb-12 outline-none">
    <slot />
  </main>
</template>
