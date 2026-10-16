<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { sourceLinks } from '../../shared/types'
import { RUNS_WELL, summarize } from '../../shared/verdict'
import PageMain from '../components/PageMain.vue'
import ProfileRow from '../components/ProfileRow.vue'
import TierBadge from '../components/TierBadge.vue'
import CheckingState from '../components/states/CheckingState.vue'
import ErrorState from '../components/states/ErrorState.vue'
import NotFoundState from '../components/states/NotFoundState.vue'
import PrivateState from '../components/states/PrivateState.vue'
import StateIcon from '../components/states/StateIcon.vue'
import { TIER_META, antiCheatLabel, deckLabel, formatNumber, isBlocking } from '../lib/tiers'
import { useCountUp } from '../lib/useCountUp'
import { useWishlist, type WishRow } from '../stores/wishlist'

type Show = 'all' | 'good' | 'check'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const wish = useWishlist()
const query = computed(() => String(route.params.query ?? ''))

watch(query, (q) => q && wish.load(q), { immediate: true })
// Once a custom name resolves, the SteamID64 becomes the address, so shared links stay stable.
watch(
  () => wish.profile?.steamid,
  (steamid) => {
    if (!steamid || steamid === query.value) return
    wish.key = steamid
    router.replace({ name: 'wishlist', params: { query: steamid } })
  },
)

const loading = computed(() => ['idle', 'profile', 'checking'].includes(wish.phase))
const retry = () => wish.load(query.value, true)

// Wishlists have no playtime, so they're always counted by games.
const summary = computed(() =>
  summarize(
    wish.rows.map((r) => ({ tier: r.tier, minutes: 0 })),
    'games',
  ),
)
const pct = computed(() => summary.value.runsWellPct)
const shownPct = useCountUp(pct)
const verdictKey = computed(() => summary.value.verdict)
const barSlices = computed(() => summary.value.slices.filter((x) => x.value > 0))
const barLabel = computed(() =>
  t('wishlist.barLabel', { parts: barSlices.value.map((x) => `${TIER_META[x.tier].label} ${x.pct}%`).join(', ') }),
)

const runsWell = (r: WishRow) => RUNS_WELL.includes(r.tier)
const counts = computed(() => {
  const good = wish.rows.filter(runsWell).length
  return { all: wish.rows.length, good, check: wish.rows.length - good }
})

const PAGE = 50
const show = ref<Show>('all')
const limit = ref(PAGE)
function setShow(s: Show) {
  show.value = s
  limit.value = PAGE
}
const visible = computed(() => wish.rows.filter((r) => show.value === 'all' || (show.value === 'good') === runsWell(r)))
const shown = computed(() => visible.value.slice(0, limit.value))

function detail(r: WishRow): string {
  if (isBlocking(r.compat?.antiCheat)) return antiCheatLabel(r.compat?.antiCheat) ?? ''
  if (r.compat?.comingSoon) return t('wishlist.comingSoon')
  return t('games.deck', { status: deckLabel(r.compat?.deck ?? 'unknown') })
}

const shareNote = ref('')
async function share() {
  const url = `${location.origin}/u/${wish.profile?.steamid ?? ''}/wishlist`
  const text = t('wishlist.shareText', { pct: pct.value, verdict: t(`wishlistVerdicts.${verdictKey.value}.headline`) })
  try {
    if (navigator.share) {
      await navigator.share({ title: t('wishlist.shareTitle'), text, url })
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
    <Transition name="page" mode="out-in">
      <CheckingState
        v-if="loading"
        key="loading"
        :profile="wish.profile"
        :title="t('wishlist.loading')"
        :done="wish.checked"
        :total="wish.items.length"
      />
      <PrivateState v-else-if="wish.phase === 'private'" key="private" :profile="wish.profile" @retry="retry" />
      <NotFoundState v-else-if="wish.phase === 'not_found'" :key="`nf-${query}`" :query="query" />
      <ErrorState v-else-if="wish.phase === 'error'" key="error" @retry="retry" />

      <div v-else-if="wish.phase === 'empty'" key="empty" class="flex flex-col gap-6">
        <ProfileRow :profile="wish.profile" :detail="t('wishlist.count', { n: 0 }, 0)" />
        <StateIcon kind="search" />
        <div class="anim-in flex flex-col gap-2.5" style="--i: 1">
          <h1 class="m-0 text-[34px] leading-tight font-black tracking-tight">{{ t('wishlist.emptyTitle') }}</h1>
          <i18n-t scope="global" keypath="wishlist.emptyLead" tag="p" class="m-0 leading-normal text-muted">
            <template #term
              ><strong class="text-ink">{{ t('private.step3B') }}</strong></template
            >
          </i18n-t>
        </div>
        <div class="flex flex-col gap-2.5">
          <button type="button" class="btn btn-primary" @click="retry">{{ t('common.retry') }}</button>
          <RouterLink :to="{ name: 'results', params: { query } }" class="btn btn-secondary">{{
            t('wishlist.toLibrary')
          }}</RouterLink>
        </div>
      </div>

      <div v-else key="done" class="flex flex-col gap-7">
        <ProfileRow :profile="wish.profile" :detail="t('wishlist.count', { n: formatNumber(counts.all) }, counts.all)">
          <RouterLink to="/" class="flex min-h-11 items-center text-sm">{{ t('results.newCheck') }}</RouterLink>
        </ProfileRow>

        <section class="flex flex-col gap-3.5" aria-labelledby="verdict-heading">
          <p class="m-0 flex flex-col gap-3.5">
            <span
              class="text-[128px] leading-[0.85] font-black tracking-[-0.05em] text-accent tabular-nums sm:text-[160px]"
              aria-hidden="true"
            >
              {{ shownPct }}<span class="text-[60px] sm:text-[72px]">%</span>
            </span>
            <span class="sr-only">{{ pct }}% </span>
            <span class="text-[15px] text-muted">{{ t('wishlist.pct', { n: formatNumber(counts.all) }) }}</span>
          </p>
          <div class="kicker mt-3 uppercase">{{ t('results.verdictKicker') }}</div>
          <h1 id="verdict-heading" class="m-0 text-4xl leading-tight font-black tracking-tight sm:text-5xl">
            {{ t(`wishlistVerdicts.${verdictKey}.headline`) }}
          </h1>
          <p class="m-0 leading-normal text-muted">
            {{ t(`wishlistVerdicts.${verdictKey}.sub`, { pct: summary.borkedPct }) }}
          </p>
        </section>

        <section class="flex flex-col gap-3">
          <div class="anim-grow flex h-10 gap-0.5 overflow-hidden rounded-lg" role="img" :aria-label="barLabel">
            <div
              v-for="s in barSlices"
              :key="s.tier"
              :style="{ flex: `${s.value} 1 0`, background: TIER_META[s.tier].color }"
            />
          </div>
          <ul class="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0" aria-hidden="true">
            <li v-for="s in barSlices" :key="s.tier" class="flex items-center gap-1.5 text-[13px] text-ink-2">
              <span class="size-3 rounded-[3px]" :style="{ background: TIER_META[s.tier].color }" />
              <span lang="en">{{ TIER_META[s.tier].label }}</span>
              <span class="font-mono text-faint">{{ formatNumber(s.value) }}</span>
            </li>
          </ul>
          <p class="m-0 text-[13px] leading-relaxed text-faint">
            {{ t('wishlist.note') }}
            <span v-if="wish.failed" class="mt-1 block text-danger" role="status">
              {{ t('results.failed', { n: wish.failed }, wish.failed) }}
              <button
                type="button"
                class="min-h-6 cursor-pointer border-0 bg-transparent p-0 font-semibold text-accent-soft underline hover:text-accent-hover"
                @click="retry"
              >
                {{ t('results.checkAgain') }}
              </button>
            </span>
          </p>
        </section>

        <section class="flex flex-col gap-3.5" aria-labelledby="list-heading">
          <h2 id="list-heading" class="m-0 text-[19px] font-extrabold">{{ t('wishlist.listTitle') }}</h2>
          <div
            role="group"
            :aria-label="t('wishlist.showLabel')"
            class="grid grid-cols-3 rounded-xl border border-control bg-field p-1"
          >
            <button
              v-for="s in ['all', 'good', 'check'] as const"
              :key="s"
              type="button"
              class="segment px-1"
              :aria-pressed="show === s"
              @click="setShow(s)"
            >
              {{ t(`wishlist.show.${s}`, { n: formatNumber(counts[s]) }) }}
            </button>
          </div>
          <p class="sr-only" aria-live="polite">
            {{ t('games.showing', { shown: shown.length, total: visible.length }) }}
          </p>
          <ul class="m-0 flex list-none flex-col p-0">
            <li v-for="r in shown" :key="r.appid" class="border-b border-line">
              <a
                :href="sourceLinks.protondb(r.appid)"
                target="_blank"
                rel="noopener noreferrer"
                class="row-hover -mx-2 flex min-h-14 items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-ink no-underline hover:text-ink"
              >
                <span class="flex min-w-0 flex-col gap-0.5">
                  <span class="text-[15px] font-semibold"
                    >{{ r.name }}<span class="sr-only"> · ProtonDB {{ t('common.newTab') }}</span></span
                  >
                  <span class="text-[13px]" :class="isBlocking(r.compat?.antiCheat) ? 'text-danger' : 'text-faint'">{{
                    detail(r)
                  }}</span>
                </span>
                <span
                  v-if="r.compat?.comingSoon && r.tier === 'pending'"
                  class="shrink-0 rounded-md border border-control px-2.5 py-1 font-mono text-xs font-semibold text-muted"
                  >{{ t('wishlist.notOut') }}</span
                >
                <TierBadge v-else :tier="r.tier" />
              </a>
            </li>
          </ul>
          <button v-if="visible.length > limit" type="button" class="btn btn-secondary" @click="limit += PAGE">
            {{ t('games.showMore', { n: formatNumber(visible.length - limit) }) }}
          </button>
          <p v-if="!visible.length" class="m-0 py-6 text-center text-faint">{{ t('games.noMatch') }}</p>
        </section>

        <section class="card flex flex-col gap-2.5 p-5" aria-labelledby="refund-heading">
          <div class="kicker text-accent uppercase">{{ t('wishlist.refundKicker') }}</div>
          <h2 id="refund-heading" class="m-0 text-[19px] leading-snug font-extrabold">
            {{ t('wishlist.refundTitle') }}
          </h2>
          <p class="m-0 text-[15px] leading-normal text-muted">{{ t('wishlist.refundText') }}</p>
        </section>

        <div class="flex flex-col gap-2.5">
          <button type="button" class="btn btn-primary" @click="share">{{ t('wishlist.share') }}</button>
          <RouterLink :to="{ name: 'results', params: { query } }" class="btn btn-secondary">{{
            t('wishlist.toLibrary')
          }}</RouterLink>
          <p class="m-0 min-h-5 text-center text-sm text-muted" role="status">{{ shareNote }}</p>
        </div>
      </div>
    </Transition>
  </PageMain>
</template>
