<script setup lang="ts">
import PageMain from '../components/PageMain.vue'
</script>

<template>
  <PageMain>
    <div class="flex flex-col gap-6 pt-8">
      <div class="font-mono text-[13px] text-accent">$ cd /this/page<br />bash: no such file or directory</div>
      <h1 class="m-0 text-[42px] leading-none font-black tracking-tight">Page not found</h1>
      <p class="m-0 leading-normal text-muted">There's nothing at this address. Your Steam library, on the other hand…</p>
      <RouterLink to="/" class="btn btn-primary">Check my library</RouterLink>
    </div>
  </PageMain>
</template>
