<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { sourceLinks } from '../../shared/types'
import { summarize } from '../../shared/verdict'
import CompareFriendsCard from '../components/CompareFriendsCard.vue'
import TierBreakdown from '../components/TierBreakdown.vue'
import WishlistBadge from '../components/WishlistBadge.vue'
import WishlistGate from '../components/WishlistGate.vue'
import { TIER_META, antiCheatLabel, formatNumber, isBlocking } from '../lib/tiers'
import { useCountUp } from '../lib/useCountUp'
import { useUserHeader } from '../lib/userHeader'
import { useWishlist } from '../stores/wishlist'

const { t } = useI18n()
const wish = useWishlist()

/** The layout already shows the profile row while the wishlist loads. */
const { profile: headerProfile, query } = useUserHeader()

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
const barLabel = computed(() =>
  t('wishlist.barLabel', {
    parts: summary.value.slices
      .filter((x) => x.value > 0)
      .map((x) => `${TIER_META[x.tier].label} ${x.pct}%`)
      .join(', '),
  }),
)

/** The wishlist comes newest first, so these are the games most recently added. */
const top = computed(() => wish.rows.slice(0, 5))
const blockers = computed(() => wish.rows.filter((r) => r.tier === 'borked'))

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
  <WishlistGate :bare="!!headerProfile">
    <section class="flex flex-col gap-3.5" aria-labelledby="verdict-heading">
      <p class="m-0 flex flex-col gap-3.5">
        <span
          class="text-[128px] leading-[0.85] font-black tracking-[-0.05em] text-accent tabular-nums sm:text-[160px]"
          aria-hidden="true"
        >
          {{ shownPct }}<span class="text-[60px] sm:text-[72px]">%</span>
        </span>
        <span class="sr-only">{{ pct }}% </span>
        <span class="text-[15px] text-muted">{{ t('wishlist.pct', { n: formatNumber(wish.rows.length) }) }}</span>
      </p>
      <div class="kicker mt-3 uppercase">{{ t('results.verdictKicker') }}</div>
      <h1 id="verdict-heading" class="m-0 text-4xl leading-tight font-black tracking-tight sm:text-5xl">
        {{ t(`wishlistVerdicts.${verdictKey}.headline`) }}
      </h1>
      <p class="m-0 leading-normal text-muted">
        {{ t(`wishlistVerdicts.${verdictKey}.sub`, { pct: summary.borkedPct }) }}
      </p>
    </section>

    <TierBreakdown :summary="summary" :label="barLabel" :format="formatNumber">
      <p class="m-0 text-[13px] leading-relaxed text-faint">
        {{ t('wishlist.note') }}
        <span v-if="wish.failed" class="mt-1 block text-danger" role="status">
          {{ t('results.failed', { n: wish.failed }, wish.failed) }}
          <button
            type="button"
            class="min-h-6 cursor-pointer border-0 bg-transparent p-0 font-semibold text-accent-soft underline hover:text-accent-hover"
            @click="wish.load(wish.key, true)"
          >
            {{ t('results.checkAgain') }}
          </button>
        </span>
      </p>
    </TierBreakdown>

    <section v-if="blockers.length" class="card flex flex-col gap-3 p-5" aria-labelledby="wish-blockers-heading">
      <div class="flex items-baseline justify-between gap-3">
        <h2 id="wish-blockers-heading" class="m-0 text-[19px] font-extrabold">{{ t('wishlist.blockersTitle') }}</h2>
        <span class="font-mono text-xs text-danger">{{
          t('results.blockers', { n: blockers.length }, blockers.length)
        }}</span>
      </div>
      <ul class="m-0 flex list-none flex-col p-0">
        <li v-for="b in blockers.slice(0, 3)" :key="b.appid" class="flex flex-col gap-0.5 border-b border-line py-3">
          <span class="text-[15px] font-semibold">{{ b.name }}</span>
          <span class="text-[13px]" :class="isBlocking(b.compat?.antiCheat) ? 'text-danger' : 'text-faint'">{{
            isBlocking(b.compat?.antiCheat) ? antiCheatLabel(b.compat?.antiCheat) : t('results.borkedOnProton')
          }}</span>
        </li>
        <li v-if="blockers.length > 3" class="pt-3">
          <RouterLink
            :to="{ name: 'wishlist-games', params: { query }, query: { tier: 'borked' } }"
            class="flex min-h-11 items-center text-sm font-semibold"
          >
            {{ t('results.more', { n: blockers.length - 3 }) }}
          </RouterLink>
        </li>
      </ul>
    </section>

    <section class="card flex flex-col gap-3 p-5" aria-labelledby="wish-top-heading">
      <h2 id="wish-top-heading" class="m-0 text-[19px] font-extrabold">
        {{ t('wishlist.topTitle', { n: top.length }) }}
      </h2>
      <ul class="m-0 flex list-none flex-col p-0">
        <li v-for="g in top" :key="g.appid" class="border-b border-line">
          <a
            :href="sourceLinks.protondb(g.appid)"
            target="_blank"
            rel="noopener noreferrer"
            class="row-hover -mx-2 flex min-h-12 items-center justify-between gap-3 rounded-lg px-2 py-2 text-ink no-underline hover:text-ink"
          >
            <span class="min-w-0 text-[15px] font-semibold"
              >{{ g.name }}<span class="sr-only"> · ProtonDB {{ t('common.newTab') }}</span></span
            >
            <WishlistBadge :row="g" />
          </a>
        </li>
      </ul>
    </section>

    <div class="flex flex-col gap-2.5">
      <RouterLink :to="{ name: 'wishlist-games', params: { query } }" class="btn btn-primary">{{
        t('wishlist.seeAll')
      }}</RouterLink>
      <button type="button" class="btn btn-secondary" @click="share">{{ t('wishlist.share') }}</button>
      <p class="m-0 min-h-5 text-center text-sm text-muted" role="status">{{ shareNote }}</p>
    </div>

    <section class="card flex flex-col gap-2.5 p-5" aria-labelledby="refund-heading">
      <div class="kicker text-accent uppercase">{{ t('wishlist.refundKicker') }}</div>
      <h2 id="refund-heading" class="m-0 text-[19px] leading-snug font-extrabold">
        {{ t('wishlist.refundTitle') }}
      </h2>
      <p class="m-0 text-[15px] leading-normal text-muted">{{ t('wishlist.refundText') }}</p>
    </section>

    <CompareFriendsCard :query="query" />
  </WishlistGate>
</template>
