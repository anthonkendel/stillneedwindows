<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { TIERS, type Tier } from '../../shared/types'
import LibraryGate from '../components/LibraryGate.vue'
import PageMain from '../components/PageMain.vue'
import TierBadge from '../components/TierBadge.vue'
import { DECK_LABEL, TIER_META, antiCheatLabel, formatHours, isBlocking } from '../lib/tiers'
import { useLibrary } from '../stores/library'

type Filter = Tier | 'all'
type Sort = 'hours' | 'tier' | 'name'

const lib = useLibrary()
const route = useRoute()
const router = useRouter()

const filter = computed<Filter>(() => {
  const t = route.query.tier
  return typeof t === 'string' && (TIERS as readonly string[]).includes(t) ? (t as Tier) : 'all'
})
function setFilter(f: Filter) {
  router.replace({ query: f === 'all' ? {} : { tier: f } })
}

const search = ref('')
const sort = ref<Sort>('hours')

const counts = computed(() => {
  const c = new Map<Filter, number>([['all', lib.rows.length]])
  for (const t of TIERS) c.set(t, 0)
  for (const r of lib.rows) c.set(r.tier, c.get(r.tier)! + 1)
  return c
})
const chips = computed(() => (['all', ...TIERS] as Filter[]).filter((f) => f === 'all' || counts.value.get(f)))

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  const rows = lib.rows.filter(
    (r) => (filter.value === 'all' || r.tier === filter.value) && (!q || r.name.toLowerCase().includes(q)),
  )
  if (sort.value === 'name') return [...rows].sort((a, b) => a.name.localeCompare(b.name))
  if (sort.value === 'tier') return [...rows].sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) || b.minutes - a.minutes)
  return rows // already by playtime
})

// Render in pages so a 2,000-game library stays quick on a phone.
const PAGE = 100
const limit = ref(PAGE)
</script>

<template>
  <PageMain>
    <LibraryGate>
      <RouterLink :to="{ name: 'results', params: { query: lib.key } }"
        class="-mb-2 flex min-h-11 w-fit items-center gap-1.5 text-[15px] font-semibold text-accent no-underline">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
          stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        Verdict
      </RouterLink>

      <div class="flex flex-col gap-1.5">
        <h1 class="m-0 text-[32px] font-black tracking-tight">Every game, by tier</h1>
        <p class="m-0 text-sm text-faint">{{ lib.profile?.name }} · {{ lib.rows.length }} games</p>
      </div>

      <div class="flex gap-2.5">
        <div class="flex min-w-0 flex-1 flex-col gap-1.5">
          <label for="q" class="text-[13px] font-semibold text-muted">Search</label>
          <input id="q" v-model="search" type="search" placeholder="Game name" class="field h-12" @input="limit = PAGE" />
        </div>
        <div class="flex shrink-0 flex-col gap-1.5">
          <label for="sort" class="text-[13px] font-semibold text-muted">Sort</label>
          <select id="sort" v-model="sort" class="field h-12 w-auto px-2.5">
            <option value="hours">Hours</option>
            <option value="tier">Tier</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      <div role="group" aria-label="Filter by tier" class="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
        <button
          v-for="f in chips"
          :key="f"
          type="button"
          class="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-3.5 text-sm font-semibold whitespace-nowrap"
          :class="filter === f ? 'border-ink bg-ink text-bg' : 'border-line-strong bg-field text-ink-2'"
          :aria-pressed="filter === f"
          @click="setFilter(f); limit = PAGE"
        >
          <span v-if="f !== 'all'" class="size-2.5 rounded-[3px]" :style="{ background: TIER_META[f].color }" aria-hidden="true" />
          {{ f === 'all' ? 'All' : TIER_META[f].label }} {{ counts.get(f) }}
        </button>
      </div>

      <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
        <li v-for="r in visible.slice(0, limit)" :key="r.appid">
          <a
            :href="`https://www.protondb.com/app/${r.appid}`"
            target="_blank"
            rel="noopener"
            class="card flex flex-col gap-2.5 p-4 text-ink no-underline"
          >
            <span class="flex items-center justify-between gap-3">
              <span class="min-w-0 font-bold">{{ r.name }}</span>
              <TierBadge :tier="r.tier" />
            </span>
            <span class="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px] text-muted">
              <span class="font-mono text-ink-2">{{ formatHours(r.minutes) }}</span>
              <span>Deck: {{ DECK_LABEL[r.compat?.deck ?? 'unknown'] }}</span>
              <span v-if="r.compat?.antiCheat" :class="isBlocking(r.compat.antiCheat) ? 'font-semibold text-danger' : ''">
                {{ antiCheatLabel(r.compat.antiCheat) }}
              </span>
              <span v-if="r.tier !== r.compat?.protonTier && r.compat?.protonTier && r.tier !== 'native'">
                ProtonDB: {{ TIER_META[r.compat.protonTier].label }}
              </span>
            </span>
          </a>
        </li>
      </ul>
      <button v-if="visible.length > limit" type="button" class="btn btn-secondary bg-transparent" @click="limit += PAGE">
        Show more ({{ visible.length - limit }} left)
      </button>
      <p v-if="!visible.length" class="m-0 py-8 text-center text-faint">No games match.</p>

      <p class="m-0 text-xs leading-relaxed text-dim">
        Tiers from ProtonDB. Anti-cheat status from Are We Anti-Cheat Yet. Tap a game for its ProtonDB reports.
      </p>
    </LibraryGate>
  </PageMain>
</template>
