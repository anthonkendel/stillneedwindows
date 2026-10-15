<script setup lang="ts">
import { SOURCES } from '../../shared/types'
import ExtLink from './ExtLink.vue'
</script>

<template>
  <footer class="mt-auto border-t border-line">
    <div class="mx-auto flex max-w-5xl flex-col gap-1 px-5 py-6 text-[13px] leading-relaxed text-dim sm:px-10">
      <i18n-t scope="global" keypath="footer.dataFrom" tag="p" class="m-0">
        <template #protondb><ExtLink :href="SOURCES.protondb">ProtonDB</ExtLink></template>
        <template #awacy><ExtLink :href="SOURCES.awacy">Are We Anti-Cheat Yet</ExtLink></template>
        <template #steam><ExtLink :href="SOURCES.steamApi">{{ $t('footer.steamApi') }}</ExtLink></template>
      </i18n-t>
      <p class="m-0">{{ $t('footer.notAffiliated') }}</p>
    </div>
  </footer>
</template>
