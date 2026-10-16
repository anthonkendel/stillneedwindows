<script setup lang="ts">
import AppFooter from './components/AppFooter.vue'
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-bg text-ink">
    <a
      href="#main"
      class="sr-only z-50 rounded-lg bg-accent px-4 py-3 font-bold text-on-accent focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
    >
      {{ $t('nav.skip') }}
    </a>
    <AppHeader />
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.matched[0]?.path ?? route.path" />
      </Transition>
    </RouterView>
    <AppFooter />
  </div>
</template>
