<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { summarize, type Mode } from '../../shared/verdict'
import LibraryGate from '../components/LibraryGate.vue'
import PageMain from '../components/PageMain.vue'
import ProfileRow from '../components/ProfileRow.vue'
import TierBadge from '../components/TierBadge.vue'
import { VERDICT_COPY } from '../lib/copy'
import { TIER_META, antiCheatLabel, formatHours, isBlocking } from '../lib/tiers'
import { useLibrary } from '../stores/library'

const lib = useLibrary()
const mode = ref<Mode>('games')
watch(
  () => lib.playtimeVisible,
  (visible) => {
    if (!visible) mode.value = 'games'
  },
)

const summary = computed(() => summarize(lib.rows, mode.value))
const copy = computed(() => VERDICT_COPY[summary.value.verdict])
const barSlices = computed(() => summary.value.slices.filter((x) => x.value > 0))
const barLabel = computed(() => barSlices.value.map((x) => `${TIER_META[x.tier].label} ${x.pct}%`).join(', '))
const totalMinutes =computed(() => lib.rows.reduce((a, r) => a + r.minutes, 0))

const pctLabel = computed(() =>
  mode.value === 'games'
    ? `of your ${lib.rows.length} games run well on Linux`
    : `of your ${formatHours(totalMinutes.value)} were in games that run well`,
)

const blockers = computed(() => lib.rows.filter((r) => r.tier === 'borked'))
const topBlockers = computed(() => blockers.value.slice(0, 3))
const top = computed(() => lib.rows.slice(0, 5))

const shareNote = ref('')
async function share() {
  const url = `${location.origin}/u/${lib.profile?.steamid ?? ''}`
  const text = `${summary.value.runsWellPct}% of my Steam library runs well on Linux. ${copy.value.headline}`
  try {
    if (navigator.share) {
      await navigator.share({ title: 'Does my Steam library still need Windows?', text, url })
      return
    }
    await navigator.clipboard.writeText(`${text} ${url}`)
    shareNote.value = 'Link copied'
  } catch {
    shareNote.value = ''
  }
}
</script>

<template>
  <PageMain>
    <LibraryGate>
      <ProfileRow :profile="lib.profile" :detail="`${lib.rows.length} games`">
        <RouterLink to="/" class="flex min-h-11 items-center text-sm">New check</RouterLink>
      </ProfileRow>

      <div role="group" aria-label="Count by" class="grid grid-cols-2 rounded-xl border border-line-strong bg-field p-1">
        <button
          v-for="m in (['games', 'hours'] as const)"
          :key="m"
          type="button"
          class="h-11 cursor-pointer rounded-[9px] border-0 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
          :class="mode === m ? 'bg-ink text-bg' : 'bg-transparent text-muted'"
          :aria-pressed="mode === m"
          :disabled="m === 'hours' && !lib.playtimeVisible"
          @click="mode = m"
        >
          {{ m === 'games' ? 'By games' : 'By hours played' }}
        </button>
      </div>
      <p v-if="!lib.playtimeVisible" class="-mt-4 m-0 text-[13px] leading-normal text-faint">
        Hours are hidden on this profile. Untick "Always keep my total playtime private" on Steam to unlock them.
      </p>

      <section class="flex flex-col gap-3.5" aria-live="polite">
        <div class="text-[128px] leading-[0.85] font-black tracking-[-0.05em] text-accent sm:text-[160px]">
          {{ summary.runsWellPct }}<span class="text-[60px] sm:text-[72px]">%</span>
        </div>
        <div class="text-[15px] text-muted">{{ pctLabel }}</div>
        <div class="kicker mt-3">VERDICT</div>
        <h1 class="m-0 text-4xl leading-tight font-black tracking-tight sm:text-5xl">{{ copy.headline }}</h1>
        <p class="m-0 leading-normal text-muted">{{ copy.sub(summary.borkedPct) }}</p>
      </section>

      <section class="flex flex-col gap-3.5">
        <div class="flex h-10 gap-0.5 overflow-hidden rounded-lg" role="img" :aria-label="barLabel">
          <div
            v-for="s in barSlices"
            :key="s.tier"
            :style="{ flex: `${s.value} 1 0`, background: TIER_META[s.tier].color }"
          />
        </div>
        <ul class="m-0 flex list-none flex-col p-0">
          <li v-for="s in summary.slices" :key="s.tier" class="flex items-center gap-3 border-b border-line py-3">
            <span class="size-3 shrink-0 rounded-[3px]" :style="{ background: TIER_META[s.tier].color }" aria-hidden="true" />
            <span class="flex-1 font-semibold">{{ TIER_META[s.tier].label }}</span>
            <span class="font-mono text-[13px] text-faint">{{ mode === 'games' ? s.value : formatHours(s.value) }}</span>
            <span class="w-12 text-right text-lg font-extrabold">{{ s.pct }}%</span>
          </li>
        </ul>
        <p class="m-0 text-[13px] leading-relaxed text-faint">
          Runs well = Native, Platinum and Gold. Pending = no ProtonDB reports yet.
          <span v-if="lib.failed" class="text-danger">
            {{ lib.failed }} game{{ lib.failed === 1 ? '' : 's' }} couldn't be fully checked right now; results may be off.
            <button type="button" class="cursor-pointer border-0 bg-transparent p-0 text-accent-soft underline" @click="lib.load(lib.key, true)">Check again</button>
          </span>
        </p>
      </section>

      <section v-if="blockers.length" class="card flex flex-col gap-3 p-5">
        <div class="flex items-baseline justify-between gap-3">
          <h2 class="m-0 text-[19px] font-extrabold">Keeping you on Windows</h2>
          <span class="font-mono text-xs text-danger">{{ blockers.length }} blocker{{ blockers.length === 1 ? '' : 's' }}</span>
        </div>
        <ul class="m-0 flex list-none flex-col p-0">
          <li v-for="b in topBlockers" :key="b.appid" class="flex items-center justify-between gap-3 border-b border-line py-3">
            <div class="flex min-w-0 flex-col gap-0.5">
              <span class="text-[15px] font-semibold">{{ b.name }}</span>
              <span class="text-[13px] text-faint">
                {{ isBlocking(b.compat?.antiCheat) ? antiCheatLabel(b.compat?.antiCheat) : 'Borked on ProtonDB' }}
              </span>
            </div>
            <span class="shrink-0 font-mono text-[13px] text-muted">{{ formatHours(b.minutes) }}</span>
          </li>
          <li v-if="blockers.length > 3" class="py-3">
            <RouterLink :to="{ name: 'games', params: { query: lib.key }, query: { tier: 'borked' } }" class="text-sm">
              + {{ blockers.length - 3 }} more
            </RouterLink>
          </li>
        </ul>
      </section>

      <section class="card flex flex-col gap-3 p-5">
        <h2 class="m-0 text-[19px] font-extrabold">Your top {{ top.length }} by playtime</h2>
        <ul class="m-0 flex list-none flex-col p-0">
          <li v-for="g in top" :key="g.appid" class="flex items-center justify-between gap-3 border-b border-line py-3">
            <span class="min-w-0 text-[15px] font-semibold">{{ g.name }}</span>
            <TierBadge :tier="g.tier" />
          </li>
        </ul>
      </section>

      <div class="flex flex-col gap-2.5">
        <RouterLink :to="{ name: 'games', params: { query: lib.key } }" class="btn btn-primary">See every game by tier</RouterLink>
        <button type="button" class="btn btn-secondary bg-transparent" @click="share">Share my result</button>
        <p v-if="shareNote" class="m-0 text-center text-sm text-muted" role="status">{{ shareNote }}</p>
      </div>
    </LibraryGate>
  </PageMain>
</template>
