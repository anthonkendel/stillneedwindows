<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { SOURCES, sourceLinks } from '../../shared/types'
import { summarize, type Mode } from '../../shared/verdict'
import ExtLink from '../components/ExtLink.vue'
import LibraryGate from '../components/LibraryGate.vue'
import PageMain from '../components/PageMain.vue'
import ProfileRow from '../components/ProfileRow.vue'
import TierBadge from '../components/TierBadge.vue'
import { TIER_META, antiCheatLabel, formatHours, formatNumber, isBlocking } from '../lib/tiers'
import { useCountUp } from '../lib/useCountUp'
import { useLibrary } from '../stores/library'

const { t } = useI18n()
const lib = useLibrary()
const mode = ref<Mode>('games')
watch(
  () => lib.playtimeVisible,
  (visible) => {
    if (!visible) mode.value = 'games'
  },
)

const summary = computed(() => summarize(lib.rows, mode.value))
const pct = computed(() => summary.value.runsWellPct)
const shownPct = useCountUp(pct)
const verdictKey = computed(() => summary.value.verdict)
const totalMinutes = computed(() => lib.rows.reduce((a, r) => a + r.minutes, 0))

const pctLabel = computed(() =>
  mode.value === 'games'
    ? t('results.pctGames', { n: formatNumber(lib.rows.length) })
    : t('results.pctHours', { h: formatHours(totalMinutes.value) }),
)

const barSlices = computed(() => summary.value.slices.filter((x) => x.value > 0))
const barLabel = computed(() =>
  t('results.barLabel', { parts: barSlices.value.map((x) => `${TIER_META[x.tier].label} ${x.pct}%`).join(', ') }),
)

const blockers = computed(() => lib.rows.filter((r) => r.tier === 'borked'))
const topBlockers = computed(() => blockers.value.slice(0, 3))
const top = computed(() => lib.rows.slice(0, 5))

const shareNote = ref('')
async function share() {
  const url = `${location.origin}/u/${lib.profile?.steamid ?? ''}`
  const text = t('results.shareText', { pct: pct.value, verdict: t(`verdicts.${verdictKey.value}.headline`) })
  try {
    if (navigator.share) {
      await navigator.share({ title: t('results.shareTitle'), text, url })
      return
    }
    await navigator.clipboard.writeText(`${text} ${url}`)
    shareNote.value = t('results.copied')
    setTimeout(() => (shareNote.value = ''), 3000)
  } catch {
    /* share sheet dismissed */
  }
}
</script>

<template>
  <PageMain>
    <LibraryGate>
      <ProfileRow :profile="lib.profile" :detail="t('results.games', { n: formatNumber(lib.rows.length) }, lib.rows.length)">
        <RouterLink to="/" class="flex min-h-11 items-center text-sm">{{ t('results.newCheck') }}</RouterLink>
      </ProfileRow>

      <div class="flex flex-col gap-2">
        <div role="group" :aria-label="t('results.countBy')" class="grid grid-cols-2 rounded-xl border border-control bg-field p-1">
          <button
            v-for="m in (['games', 'hours'] as const)"
            :key="m"
            type="button"
            class="segment"
            :aria-pressed="mode === m"
            :disabled="m === 'hours' && !lib.playtimeVisible"
            :aria-describedby="m === 'hours' && !lib.playtimeVisible ? 'hours-hidden' : undefined"
            @click="mode = m"
          >
            {{ m === 'games' ? t('results.byGames') : t('results.byHours') }}
          </button>
        </div>
        <p v-if="!lib.playtimeVisible" id="hours-hidden" class="m-0 text-[13px] leading-normal text-faint">
          {{ t('results.hoursHidden') }}
        </p>
      </div>

      <section class="flex flex-col gap-3.5" aria-labelledby="verdict-heading">
        <p class="m-0 flex flex-col gap-3.5">
          <span class="text-[128px] leading-[0.85] font-black tracking-[-0.05em] text-accent tabular-nums sm:text-[160px]" aria-hidden="true">
            {{ shownPct }}<span class="text-[60px] sm:text-[72px]">%</span>
          </span>
          <span class="sr-only">{{ pct }}% </span>
          <span class="text-[15px] text-muted">{{ pctLabel }}</span>
        </p>
        <div class="kicker mt-3 uppercase">{{ t('results.verdictKicker') }}</div>
        <Transition name="page" mode="out-in">
          <div :key="verdictKey" class="flex flex-col gap-3.5" aria-live="polite">
            <h1 id="verdict-heading" class="m-0 text-4xl leading-tight font-black tracking-tight sm:text-5xl">
              {{ t(`verdicts.${verdictKey}.headline`) }}
            </h1>
            <p class="m-0 leading-normal text-muted">{{ t(`verdicts.${verdictKey}.sub`, { pct: summary.borkedPct }) }}</p>
          </div>
        </Transition>
      </section>

      <section class="flex flex-col gap-3.5">
        <div class="anim-grow flex h-10 gap-0.5 overflow-hidden rounded-lg" role="img" :aria-label="barLabel">
          <div
            v-for="s in barSlices"
            :key="s.tier"
            class="transition-[flex-grow] duration-500 ease-out"
            :style="{ flex: `${s.value} 1 0`, background: TIER_META[s.tier].color }"
          />
        </div>
        <ul class="m-0 flex list-none flex-col p-0">
          <li
            v-for="(s, i) in summary.slices"
            :key="s.tier"
            class="anim-in flex items-center gap-3 border-b border-line py-3"
            :style="{ '--i': i }"
          >
            <span class="size-3 shrink-0 rounded-[3px]" :style="{ background: TIER_META[s.tier].color }" aria-hidden="true" />
            <span class="flex-1 font-semibold" lang="en">{{ TIER_META[s.tier].label }}</span>
            <span class="font-mono text-[13px] text-faint">{{ mode === 'games' ? formatNumber(s.value) : formatHours(s.value) }}</span>
            <span class="w-12 text-right text-lg font-extrabold tabular-nums">{{ s.pct }}%</span>
          </li>
        </ul>
        <p class="m-0 text-[13px] leading-relaxed text-faint">
          {{ t('results.runsWellNote') }}
          <span v-if="lib.failed" class="mt-1 block text-danger" role="status">
            {{ t('results.failed', { n: lib.failed }, lib.failed) }}
            <button type="button" class="min-h-6 cursor-pointer border-0 bg-transparent p-0 font-semibold text-accent-soft underline hover:text-accent-hover" @click="lib.load(lib.key, true)">
              {{ t('results.checkAgain') }}
            </button>
          </span>
        </p>
      </section>

      <section v-if="blockers.length" class="card flex flex-col gap-3 p-5" aria-labelledby="blockers-heading">
        <div class="flex items-baseline justify-between gap-3">
          <h2 id="blockers-heading" class="m-0 text-[19px] font-extrabold">{{ t('results.blockersTitle') }}</h2>
          <span class="font-mono text-xs text-danger">{{ t('results.blockers', { n: blockers.length }, blockers.length) }}</span>
        </div>
        <ul class="m-0 flex list-none flex-col p-0">
          <li v-for="b in topBlockers" :key="b.appid" class="flex items-center justify-between gap-3 border-b border-line py-3">
            <div class="flex min-w-0 flex-col gap-0.5">
              <span class="text-[15px] font-semibold">{{ b.name }}</span>
              <ExtLink
                v-if="isBlocking(b.compat?.antiCheat)"
                :href="sourceLinks.awacy(b.compat?.antiCheat?.slug)"
                class="w-fit text-[13px]"
              >{{ antiCheatLabel(b.compat?.antiCheat) }}</ExtLink>
              <ExtLink v-else :href="sourceLinks.protondb(b.appid)" class="w-fit text-[13px]">{{ t('results.borkedOnProton') }}</ExtLink>
            </div>
            <span class="shrink-0 font-mono text-[13px] text-muted">{{ formatHours(b.minutes) }}</span>
          </li>
          <li v-if="blockers.length > 3" class="pt-3">
            <RouterLink :to="{ name: 'games', params: { query: lib.key }, query: { tier: 'borked' } }" class="flex min-h-11 items-center text-sm font-semibold">
              {{ t('results.more', { n: blockers.length - 3 }) }}
            </RouterLink>
          </li>
        </ul>
      </section>

      <section class="card flex flex-col gap-3 p-5" aria-labelledby="top-heading">
        <h2 id="top-heading" class="m-0 text-[19px] font-extrabold">{{ t('results.topTitle', { n: top.length }) }}</h2>
        <ul class="m-0 flex list-none flex-col p-0">
          <li v-for="g in top" :key="g.appid" class="border-b border-line">
            <a
              :href="sourceLinks.protondb(g.appid)"
              target="_blank"
              rel="noopener noreferrer"
              class="row-hover -mx-2 flex min-h-12 items-center justify-between gap-3 rounded-lg px-2 py-2 text-ink no-underline hover:text-ink"
            >
              <span class="min-w-0 text-[15px] font-semibold">{{ g.name }}<span class="sr-only"> · ProtonDB {{ t('common.newTab') }}</span></span>
              <TierBadge :tier="g.tier" />
            </a>
          </li>
        </ul>
      </section>

      <div class="flex flex-col gap-2.5">
        <RouterLink :to="{ name: 'games', params: { query: lib.key } }" class="btn btn-primary">{{ t('results.seeAll') }}</RouterLink>
        <button type="button" class="btn btn-secondary" @click="share">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
            stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14" /></svg>
          {{ t('results.share') }}
        </button>
        <p class="m-0 min-h-5 text-center text-sm text-muted" role="status">{{ shareNote }}</p>
      </div>

      <aside class="flex flex-col gap-2 border-t border-line pt-6 text-[13px] leading-relaxed text-faint" aria-labelledby="sources-heading">
        <h2 id="sources-heading" class="m-0 text-sm font-bold text-ink-2">{{ t('results.sourcesTitle') }}</h2>
        <i18n-t scope="global" keypath="results.sourcesText" tag="p" class="m-0">
          <template #protondb><ExtLink :href="SOURCES.protondb">ProtonDB</ExtLink></template>
          <template #steam><ExtLink :href="SOURCES.steamStore">{{ t('results.steamStore') }}</ExtLink></template>
          <template #awacy><ExtLink :href="SOURCES.awacy">Are We Anti-Cheat Yet</ExtLink></template>
          <template #how><RouterLink to="/how-it-works">{{ t('results.sourcesHow') }}</RouterLink></template>
        </i18n-t>
      </aside>
    </LibraryGate>
  </PageMain>
</template>
