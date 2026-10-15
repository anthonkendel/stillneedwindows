<script setup lang="ts">
import { REPO_URL, SOURCES } from '../../shared/types'
import ExtLink from './ExtLink.vue'
</script>

<template>
  <footer class="mt-auto border-t border-line">
    <div class="mx-auto flex max-w-5xl flex-col gap-3 px-5 py-6 text-[13px] leading-relaxed text-dim sm:flex-row sm:items-start sm:justify-between sm:gap-8 sm:px-10">
      <div class="flex flex-col gap-1">
        <p class="m-0">{{ $t('footer.disclaimer') }}</p>
        <i18n-t scope="global" keypath="footer.dataFrom" tag="p" class="m-0">
          <template #protondb><ExtLink :href="SOURCES.protondb">ProtonDB</ExtLink></template>
          <template #awacy><ExtLink :href="SOURCES.awacy">Are We Anti-Cheat Yet</ExtLink></template>
          <template #steam><ExtLink :href="SOURCES.steamApi">{{ $t('footer.steamApi') }}</ExtLink></template>
        </i18n-t>
        <p class="m-0">{{ $t('footer.notAffiliated') }}</p>
      </div>
      <div class="flex shrink-0 gap-5 sm:flex-col sm:gap-1">
        <RouterLink to="/privacy" class="flex min-h-11 items-center font-semibold sm:min-h-0">{{ $t('footer.privacy') }}</RouterLink>
        <ExtLink :href="REPO_URL" class="flex min-h-11 items-center font-semibold sm:min-h-0">{{ $t('footer.source') }}</ExtLink>
      </div>
    </div>
  </footer>
</template>
