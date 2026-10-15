<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { SOURCES } from '../../shared/types'
import { LOCALES, setLocale, type LocaleCode } from '../i18n'
import ExtLink from './ExtLink.vue'

const { locale } = useI18n()
const current = computed({
  get: () => locale.value as LocaleCode,
  set: (v: LocaleCode) => setLocale(v),
})
</script>

<template>
  <footer class="mt-auto border-t border-line">
    <div class="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-6 text-[13px] leading-relaxed text-dim sm:flex-row sm:items-end sm:justify-between sm:px-10">
      <div class="flex flex-col gap-1">
        <i18n-t scope="global" keypath="footer.dataFrom" tag="p" class="m-0">
          <template #protondb><ExtLink :href="SOURCES.protondb">ProtonDB</ExtLink></template>
          <template #awacy><ExtLink :href="SOURCES.awacy">Are We Anti-Cheat Yet</ExtLink></template>
          <template #steam><ExtLink :href="SOURCES.steamApi">{{ $t('footer.steamApi') }}</ExtLink></template>
        </i18n-t>
        <p class="m-0">{{ $t('footer.notAffiliated') }}</p>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="lang" class="flex items-center gap-1.5 text-xs font-semibold text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
          </svg>
          {{ $t('footer.language') }}
        </label>
        <select id="lang" v-model="current" class="field min-h-11 w-full cursor-pointer text-sm sm:w-48">
          <option v-for="l in LOCALES" :key="l.code" :value="l.code" :lang="l.htmlLang">{{ l.name }}</option>
        </select>
      </div>
    </div>
  </footer>
</template>
