<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { SOURCES, TIERS } from '../../shared/types'
import ExtLink from '../components/ExtLink.vue'
import PageMain from '../components/PageMain.vue'
import TierBadge from '../components/TierBadge.vue'

const { t, tm, rt } = useI18n()

const RULES = ['optional', 'mostly', 'dualboot', 'needed'] as const
const FAQ = ['public', 'login', 'anticheat', 'pending', 'stores', 'data', 'hardware'] as const
const SOURCE_LIST = [
  { key: 'protondb', name: 'ProtonDB', href: SOURCES.protondb },
  { key: 'steamApi', name: 'Steam Web API', href: SOURCES.steamApi },
  { key: 'steamStore', name: 'Steam Store', href: SOURCES.steamStore },
  { key: 'awacy', name: 'Are We Anti-Cheat Yet', href: SOURCES.awacy },
] as const
</script>

<template>
  <PageMain>
    <div class="anim-in flex flex-col gap-3">
      <h1 class="m-0 text-[38px] leading-none font-black tracking-tight">{{ t('how.title') }}</h1>
      <p class="m-0 text-[17px] leading-normal text-muted">{{ t('how.lead') }}</p>
    </div>

    <section class="flex flex-col gap-3" aria-labelledby="steps-h">
      <h2 id="steps-h" class="m-0 mb-1 text-[22px] font-extrabold">{{ t('how.stepsTitle') }}</h2>
      <ol class="m-0 flex list-none flex-col gap-3 p-0">
        <li
          v-for="(s, i) in tm('how.steps') as { title: string; text: string }[]"
          :key="i"
          class="card anim-in flex gap-4 p-[18px]"
          :style="{ '--i': i + 1 }"
        >
          <span class="font-mono text-[13px] text-accent" aria-hidden="true">0{{ i + 1 }}</span>
          <div class="flex flex-col gap-1">
            <h3 class="m-0 text-base font-bold">{{ rt(s.title) }}</h3>
            <p class="m-0 text-sm leading-normal text-muted">{{ rt(s.text) }}</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="flex flex-col" aria-labelledby="tiers-h">
      <h2 id="tiers-h" class="m-0 mb-2 text-[22px] font-extrabold">{{ t('how.tiersTitle') }}</h2>
      <dl class="m-0">
        <div v-for="tier in TIERS" :key="tier" class="flex gap-3.5 border-b border-line py-3.5">
          <dt class="shrink-0"><TierBadge :tier="tier" wide /></dt>
          <dd class="m-0 text-[15px] leading-normal text-ink-2">{{ t(`tiers.${tier}`) }}</dd>
        </div>
      </dl>
      <p class="m-0 mt-3 text-sm leading-normal text-faint">{{ t('how.runsWell') }}</p>
    </section>

    <section class="flex flex-col gap-2" aria-labelledby="verdicts-h">
      <h2 id="verdicts-h" class="m-0 mb-2 text-[22px] font-extrabold">{{ t('how.verdictsTitle') }}</h2>
      <div v-for="v in RULES" :key="v" class="card flex flex-col gap-1 px-4 py-3.5">
        <h3 class="m-0 text-[17px] font-extrabold">{{ t(`verdicts.${v}.headline`) }}</h3>
        <p class="m-0 text-sm leading-normal text-muted">{{ t(`how.rules.${v}`) }}</p>
      </div>
    </section>

    <section class="flex flex-col gap-2" aria-labelledby="sources-h">
      <h2 id="sources-h" class="m-0 mb-2 text-[22px] font-extrabold">{{ t('how.sourcesTitle') }}</h2>
      <ul class="m-0 flex list-none flex-col p-0">
        <li v-for="s in SOURCE_LIST" :key="s.key" class="flex flex-col gap-0.5 border-b border-line py-3">
          <ExtLink :href="s.href" class="ext-link min-h-8 w-fit text-base" lang="en">{{ s.name }}</ExtLink>
          <span class="text-sm leading-normal text-muted">{{ t(`how.sources.${s.key}`) }}</span>
        </li>
      </ul>
    </section>

    <section class="flex flex-col" aria-labelledby="faq-h">
      <h2 id="faq-h" class="m-0 mb-2 text-[22px] font-extrabold">{{ t('how.faqTitle') }}</h2>
      <details v-for="f in FAQ" :id="f" :key="f" class="border-b border-line" :open="$route.hash === `#${f}`">
        <summary class="row-hover -mx-2 flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-2 font-semibold">
          {{ t(`how.faq.${f}.q`) }}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
            stroke-linecap="round" stroke-linejoin="round" class="chevron shrink-0 text-muted" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
        </summary>
        <p class="faq-body m-0 mb-4 text-[15px] leading-relaxed text-muted">{{ t(`how.faq.${f}.a`) }}</p>
      </details>
    </section>

    <RouterLink to="/" class="btn btn-primary">{{ t('common.checkLibrary') }}</RouterLink>
  </PageMain>
</template>
