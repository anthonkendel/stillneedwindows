<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { TIERS, sourceLinks, type Tier } from '../../shared/types'
import ExtLink from '../components/ExtLink.vue'
import LibraryGate from '../components/LibraryGate.vue'
import PageMain from '../components/PageMain.vue'
import TierBadge from '../components/TierBadge.vue'
import { TIER_META, antiCheatLabel, deckLabel, formatHours, formatNumber, isBlocking } from '../lib/tiers'
import { useLibrary } from '../stores/library'

type Filter = Tier | 'all'
type Sort = 'hours' | 'tier' | 'name'

const { t, locale } = useI18n()
const lib = useLibrary()
const route = useRoute()
const router = useRouter()

const filter = computed<Filter>(() => {
  const q = route.query.tier
  return typeof q === 'string' && (TIERS as readonly string[]).includes(q) ? (q as Tier) : 'all'
})

const PAGE = 100
const limit = ref(PAGE)
const search = ref('')
const sort = ref<Sort>('hours')

function setFilter(f: Filter) {
  limit.value = PAGE
  router.replace({ query: f === 'all' ? {} : { tier: f } })
}

const counts = computed(() => {
  const c = new Map<Filter, number>([['all', lib.rows.length]])
  for (const tier of TIERS) c.set(tier, 0)
  for (const r of lib.rows) c.set(r.tier, c.get(r.tier)! + 1)
  return c
})
const chips = computed(() => (['all', ...TIERS] as Filter[]).filter((f) => f === 'all' || counts.value.get(f)))

const visible = computed(() => {
  const q = search.value.trim().toLocaleLowerCase(locale.value)
  const rows = lib.rows.filter(
    (r) => (filter.value === 'all' || r.tier === filter.value) && (!q || r.name.toLocaleLowerCase(locale.value).includes(q)),
  )
  if (sort.value === 'name') return [...rows].sort((a, b) => a.name.localeCompare(b.name, locale.value))
  if (sort.value === 'tier') return [...rows].sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) || b.minutes - a.minutes)
  return rows // already by playtime
})
const shown = computed(() => visible.value.slice(0, limit.value))
</script>

<template>
  <PageMain>
    <LibraryGate>
      <RouterLink
        :to="{ name: 'results', params: { query: lib.key } }"
        class="group -mb-2 flex min-h-11 w-fit items-center gap-1.5 text-[15px] font-semibold no-underline"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
          stroke-linecap="round" stroke-linejoin="round" class="transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        {{ t('games.back') }}
      </RouterLink>

      <div class="flex flex-col gap-1.5">
        <h1 class="m-0 text-[32px] font-black tracking-tight">{{ t('games.title') }}</h1>
        <p class="m-0 text-sm text-faint">
          {{ t('games.subtitle', { name: lib.profile?.name, count: t('results.games', { n: formatNumber(lib.rows.length) }, lib.rows.length) }) }}
        </p>
      </div>

      <div class="flex gap-2.5">
        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <label for="q" class="text-[13px] font-semibold text-muted">{{ t('games.search') }}</label>
          <input id="q" v-model="search" type="search" :placeholder="t('games.searchPlaceholder')" class="field min-h-12" @input="limit = PAGE" />
        </div>
        <div class="flex shrink-0 flex-col gap-1.5">
          <label for="sort" class="text-[13px] font-semibold text-muted">{{ t('games.sort') }}</label>
          <select id="sort" v-model="sort" class="field min-h-12 w-auto cursor-pointer px-2.5">
            <option value="hours">{{ t('games.sortHours') }}</option>
            <option value="tier">{{ t('games.sortTier') }}</option>
            <option value="name">{{ t('games.sortName') }}</option>
          </select>
        </div>
      </div>

      <!-- Phones: one swipeable row with faded edges. Wider screens: chips wrap, no scrollbar. -->
      <div
        role="group"
        :aria-label="t('games.filterLabel')"
        class="chip-row no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 py-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
      >
        <button
          v-for="f in chips"
          :key="f"
          type="button"
          class="chip"
          :aria-pressed="filter === f"
          @click="setFilter(f)"
        >
          <span v-if="f !== 'all'" class="size-2.5 rounded-[3px]" :style="{ background: TIER_META[f].color }" aria-hidden="true" />
          <span :lang="f === 'all' ? undefined : 'en'">{{ f === 'all' ? t('games.all') : TIER_META[f].label }}</span>
          <span class="tabular-nums opacity-80">{{ formatNumber(counts.get(f) ?? 0) }}</span>
        </button>
      </div>

      <p class="sr-only" aria-live="polite">{{ t('games.showing', { shown: shown.length, total: visible.length }) }}</p>

      <TransitionGroup tag="ul" name="list" class="relative m-0 flex list-none flex-col gap-2.5 p-0">
        <li v-for="(r, i) in shown" :key="r.appid" class="card anim-in flex flex-col gap-2.5 p-4" :style="{ '--i': Math.min(i, 12) }">
          <div class="flex items-center justify-between gap-3">
            <h2 class="m-0 min-w-0 text-base font-bold">{{ r.name }}</h2>
            <TierBadge :tier="r.tier" />
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted">
            <span class="font-mono text-ink-2">{{ formatHours(r.minutes) }}</span>
            <span>{{ t('games.deck', { status: deckLabel(r.compat?.deck ?? 'unknown') }) }}</span>
            <span v-if="r.compat?.antiCheat" :class="isBlocking(r.compat.antiCheat) ? 'font-semibold text-danger' : ''">
              {{ antiCheatLabel(r.compat.antiCheat) }}
            </span>
            <span v-if="r.compat?.protonTier && r.tier !== r.compat.protonTier && r.tier !== 'native'">
              {{ t('games.protondbTier', { tier: TIER_META[r.compat.protonTier].label }) }}
            </span>
          </div>
          <div class="-mb-2 flex flex-wrap gap-x-5 border-t border-line pt-1">
            <ExtLink :href="sourceLinks.protondb(r.appid)" class="ext-link">
              {{ t('games.linkProtondb') }}<span class="sr-only">: {{ r.name }}</span>
            </ExtLink>
            <ExtLink :href="sourceLinks.steamStore(r.appid)" class="ext-link">
              {{ t('games.linkStore') }}<span class="sr-only">: {{ r.name }}</span>
            </ExtLink>
            <ExtLink v-if="r.compat?.antiCheat" :href="sourceLinks.awacy(r.compat.antiCheat.slug)" class="ext-link">
              {{ t('games.linkAntiCheat') }}<span class="sr-only">: {{ r.name }}</span>
            </ExtLink>
          </div>
        </li>
      </TransitionGroup>

      <button v-if="visible.length > limit" type="button" class="btn btn-secondary" @click="limit += PAGE">
        {{ t('games.showMore', { n: formatNumber(visible.length - limit) }) }}
      </button>
      <p v-if="!visible.length" class="anim-in m-0 py-8 text-center text-faint">{{ t('games.noMatch') }}</p>

      <p class="m-0 text-xs leading-relaxed text-dim">{{ t('games.note') }}</p>
    </LibraryGate>
  </PageMain>
</template>

<style scoped>
@media (max-width: 639px) {
  .chip-row {
    mask-image: linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 28px), transparent 100%);
  }
}
.list-leave-active {
  transition: opacity 0.15s;
  position: absolute;
  width: 100%;
}
.list-leave-to {
  opacity: 0;
}
.list-move {
  transition: transform 0.3s var(--ease-out);
}
</style>
