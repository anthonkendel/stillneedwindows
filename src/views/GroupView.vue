<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { parseProfileInput } from '../../shared/profileInput'
import { sourceLinks } from '../../shared/types'
import { RUNS_WELL } from '../../shared/verdict'
import PageMain from '../components/PageMain.vue'
import TierBadge from '../components/TierBadge.vue'
import CheckingState from '../components/states/CheckingState.vue'
import ErrorState from '../components/states/ErrorState.vue'
import StateIcon from '../components/states/StateIcon.vue'
import { MAX_FRIENDS_PICKED } from '../lib/group'
import { antiCheatLabel, deckLabel, formatNumber, isBlocking } from '../lib/tiers'
import { useGroup, type GroupRow, type Member } from '../stores/group'

type Show = 'multiplayer' | 'all'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const group = useGroup()

/** You first, then up to three others from ?with=. Anything that isn't a profile is dropped. */
const queries = computed(() => {
  const raw = [String(route.params.query ?? ''), ...String(route.query.with ?? '').split(',')]
  const out: string[] = []
  for (const r of raw) {
    const q = parseProfileInput(r)
    if (q && !out.includes(q.value)) out.push(q.value)
  }
  return out.slice(0, MAX_FRIENDS_PICKED + 1)
})

watch(
  queries,
  (qs) => {
    if (qs.length >= 2) group.load(qs)
    else if (qs[0]) router.replace({ name: 'friends', params: { query: qs[0] } })
  },
  { immediate: true },
)
const retry = () => group.load(queries.value, true)

const you = computed(() => group.members[0])
const others = computed(() => group.members.slice(1))
const editRoute = computed(() => ({
  name: 'friends',
  params: { query: you.value?.profile?.steamid ?? queries.value[0] },
  query: { with: others.value.map((m) => m.profile?.steamid ?? m.query).join(',') },
}))
const loading = computed(() => ['idle', 'profiles', 'checking'].includes(group.phase))

// Everyone else turned out to be you (added again by custom name): back to picking friends.
watch(
  () => group.phase === 'done' && group.members.length < 2,
  (alone) =>
    alone && router.replace({ name: 'friends', params: { query: you.value?.profile?.steamid ?? queries.value[0] } }),
)

const memberName = (m: Member) => m.profile?.name ?? m.query

// ---- Blocked: someone's games can't be read ----

const okOthers = computed(() => others.value.filter((m) => m.status === 'ok'))
const canContinue = computed(() => you.value?.status === 'ok' && okOthers.value.length > 0)
function continueWithout() {
  router.replace({
    name: 'group',
    params: { query: you.value!.profile!.steamid },
    query: { with: okOthers.value.map((m) => m.profile!.steamid).join(',') },
  })
}

// ---- Result ----

const hasMultiplayerInfo = computed(() => group.sharedRows.some((r) => r.compat?.multiplayer != null))
const show = ref<Show>('multiplayer')
const mode = computed<Show>(() => (hasMultiplayerInfo.value ? show.value : 'all'))
const inMode = (r: GroupRow) => mode.value === 'all' || r.compat?.multiplayer === true
const runsWell = (r: GroupRow) => RUNS_WELL.includes(r.tier)

const shared = computed(() => group.sharedRows.filter(inMode))
const playable = computed(() => shared.value.filter(runsWell))
const blocked = computed(() => shared.value.filter((r) => isBlocking(r.compat?.antiCheat)))
const unsure = computed(() => shared.value.length - playable.value.length - blocked.value.length)
const nearMiss = computed(() => group.nearMissRows.filter((r) => inMode(r) && runsWell(r)).slice(0, 5))

const verdict = computed(() => (playable.value.length >= 5 ? 'on' : playable.value.length > 0 ? 'few' : 'none'))

const PAGE = 10
const limit = ref(PAGE)
const shownPlayable = computed(() => playable.value.slice(0, limit.value))
watch(mode, () => (limit.value = PAGE))

const nameOf = computed(() => new Map(group.members.map((m) => [m.profile?.steamid ?? m.query, memberName(m)])))
function missingText(r: GroupRow) {
  const name = nameOf.value.get(r.missing[0]!) ?? ''
  return r.missing[0] === you.value?.profile?.steamid ? t('group.youMissing') : t('group.missing', { name })
}
function meta(r: GroupRow) {
  const parts = []
  if (r.compat?.multiplayer) parts.push(t('group.multiplayer'))
  parts.push(t('games.deck', { status: deckLabel(r.compat?.deck ?? 'unknown') }))
  return parts.join(' · ')
}

const shareNote = ref('')
async function share() {
  const url = location.href
  const text = t('group.shareText', { n: playable.value.length })
  try {
    if (navigator.share) {
      await navigator.share({ title: t('group.shareTitle'), text, url })
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
        :profile="you?.profile ?? null"
        :title="t('group.loading', { n: queries.length })"
        :done="group.checked"
        :total="group.total"
      />
      <ErrorState v-else-if="group.phase === 'error'" key="error" @retry="retry" />

      <div v-else-if="group.phase === 'blocked'" key="blocked" class="flex flex-col gap-6">
        <StateIcon kind="lock" />
        <div class="anim-in flex flex-col gap-2.5" style="--i: 1">
          <h1 class="m-0 text-[34px] leading-tight font-black tracking-tight">{{ t('group.blockedTitle') }}</h1>
          <p class="m-0 leading-normal text-muted">{{ t('group.blockedLead') }}</p>
        </div>
        <ul class="card m-0 flex list-none flex-col px-5 py-1">
          <li
            v-for="m in group.members"
            :key="m.query"
            class="flex min-h-14 items-center gap-3 border-b border-line py-2 last:border-b-0"
          >
            <img
              v-if="m.profile?.avatar"
              :src="m.profile.avatar"
              alt=""
              width="32"
              height="32"
              class="size-8 shrink-0 rounded-full bg-raised"
            />
            <span v-else class="size-8 shrink-0 rounded-full bg-raised" aria-hidden="true" />
            <span class="min-w-0 flex-1 truncate text-[15px] font-semibold">{{ memberName(m) }}</span>
            <span class="shrink-0 font-mono text-xs" :class="m.status === 'ok' ? 'text-ink-2' : 'text-danger'">{{
              m.status === 'ok'
                ? t('results.games', { n: formatNumber(m.games.length) }, m.games.length)
                : t(`group.status.${m.status}`)
            }}</span>
          </li>
        </ul>
        <div class="flex flex-col gap-2.5">
          <button v-if="canContinue" type="button" class="btn btn-primary" @click="continueWithout">
            {{ t('group.continue', { n: okOthers.length + 1 }) }}
          </button>
          <button type="button" class="btn btn-secondary" @click="retry">{{ t('private.retry') }}</button>
          <RouterLink :to="editRoute" class="btn btn-secondary">{{ t('group.edit') }}</RouterLink>
        </div>
        <section class="card flex flex-col gap-3 p-5" aria-labelledby="howto-heading">
          <h2 id="howto-heading" class="m-0 text-[17px] font-extrabold">{{ t('group.howToTitle') }}</h2>
          <ol class="m-0 flex list-decimal flex-col gap-2 pl-5 text-[15px] leading-normal text-ink-2">
            <i18n-t scope="global" keypath="private.step1" tag="li"
              ><template #term
                ><strong class="text-ink">{{ t('private.step1Term') }}</strong></template
              ></i18n-t
            >
            <i18n-t scope="global" keypath="private.step2" tag="li"
              ><template #term
                ><strong class="text-ink">{{ t('private.step2Term') }}</strong></template
              ></i18n-t
            >
            <i18n-t scope="global" keypath="private.step3" tag="li">
              <template #a
                ><strong class="text-ink">{{ t('private.step3A') }}</strong></template
              >
              <template #b
                ><strong class="text-ink">{{ t('private.step3B') }}</strong></template
              >
            </i18n-t>
          </ol>
          <p class="m-0 text-[13px] leading-relaxed text-faint">{{ t('private.note') }}</p>
        </section>
      </div>

      <div v-else key="done" class="flex flex-col gap-7">
        <section class="flex flex-col gap-3" aria-labelledby="members-heading">
          <div class="flex items-center justify-between gap-3">
            <h2 id="members-heading" class="kicker m-0 font-normal uppercase">
              {{ t('group.members', { n: group.members.length }) }}
            </h2>
            <RouterLink :to="editRoute" class="flex min-h-11 items-center text-sm">{{ t('group.edit') }}</RouterLink>
          </div>
          <ul
            class="m-0 grid list-none gap-2 p-0"
            :style="{ gridTemplateColumns: `repeat(${group.members.length}, minmax(0, 1fr))` }"
          >
            <li
              v-for="m in group.members"
              :key="m.query"
              class="card flex min-w-0 flex-col items-center gap-1.5 px-2 py-3 text-center"
            >
              <img
                v-if="m.profile?.avatar"
                :src="m.profile.avatar"
                alt=""
                width="40"
                height="40"
                class="size-10 rounded-full bg-raised"
              />
              <span v-else class="size-10 rounded-full bg-raised" aria-hidden="true" />
              <span class="max-w-full truncate text-[13px] font-bold">{{ memberName(m) }}</span>
              <span class="font-mono text-[11px] text-faint">{{
                t('results.games', { n: formatNumber(m.games.length) }, m.games.length)
              }}</span>
            </li>
          </ul>
        </section>

        <div
          v-if="hasMultiplayerInfo"
          role="group"
          :aria-label="t('group.showLabel')"
          class="grid grid-cols-2 rounded-xl border border-control bg-field p-1"
        >
          <button
            v-for="s in ['multiplayer', 'all'] as const"
            :key="s"
            type="button"
            class="segment"
            :aria-pressed="mode === s"
            @click="show = s"
          >
            {{ t(`group.show.${s}`) }}
          </button>
        </div>

        <section class="flex flex-col gap-3.5" aria-labelledby="verdict-heading">
          <p class="m-0 flex flex-col gap-3.5">
            <span
              class="text-[128px] leading-[0.85] font-black tracking-[-0.05em] text-accent tabular-nums sm:text-[160px]"
              aria-hidden="true"
              >{{ formatNumber(playable.length) }}</span
            >
            <span class="text-[15px] text-muted">
              <span class="sr-only">{{ formatNumber(playable.length) }} </span>
              {{ t(`group.count.${mode}`, { n: playable.length }, playable.length) }}
            </span>
          </p>
          <div class="kicker mt-3 uppercase">{{ t('results.verdictKicker') }}</div>
          <div class="flex flex-col gap-3.5" aria-live="polite">
            <h1 id="verdict-heading" class="m-0 text-4xl leading-tight font-black tracking-tight sm:text-5xl">
              {{ t(`group.verdicts.${verdict}.headline`) }}
            </h1>
            <p class="m-0 leading-normal text-muted">
              {{ t(`group.verdicts.${verdict}.sub`, { blocked: blocked.length }, blocked.length) }}
            </p>
          </div>
          <p v-if="group.failed" class="m-0 text-[13px] text-danger" role="status">
            {{ t('results.failed', { n: group.failed }, group.failed) }}
            <button
              type="button"
              class="min-h-6 cursor-pointer border-0 bg-transparent p-0 font-semibold text-accent-soft underline hover:text-accent-hover"
              @click="retry"
            >
              {{ t('results.checkAgain') }}
            </button>
          </p>
        </section>

        <section v-if="playable.length" class="card flex flex-col gap-3 p-5" aria-labelledby="shared-heading">
          <h2 id="shared-heading" class="m-0 text-[19px] font-extrabold">{{ t('group.sharedTitle') }}</h2>
          <ul class="m-0 flex list-none flex-col p-0">
            <li v-for="r in shownPlayable" :key="r.appid" class="border-b border-line">
              <a
                :href="sourceLinks.protondb(r.appid)"
                target="_blank"
                rel="noopener noreferrer"
                class="row-hover -mx-2 flex min-h-14 items-center justify-between gap-3 rounded-lg px-2 py-2 text-ink no-underline hover:text-ink"
              >
                <span class="flex min-w-0 flex-col gap-0.5">
                  <span class="text-[15px] font-semibold"
                    >{{ r.name }}<span class="sr-only"> · ProtonDB {{ t('common.newTab') }}</span></span
                  >
                  <span class="text-[13px] text-faint">{{ meta(r) }}</span>
                </span>
                <TierBadge :tier="r.tier" />
              </a>
            </li>
          </ul>
          <button v-if="playable.length > limit" type="button" class="btn btn-secondary" @click="limit += 20">
            {{ t('games.showMore', { n: formatNumber(playable.length - limit) }) }}
          </button>
        </section>

        <section v-if="nearMiss.length" class="card flex flex-col gap-3 p-5" aria-labelledby="near-heading">
          <h2 id="near-heading" class="m-0 text-[19px] font-extrabold">{{ t('group.nearTitle') }}</h2>
          <p class="m-0 text-sm leading-normal text-muted">{{ t('group.nearLead') }}</p>
          <ul class="m-0 flex list-none flex-col p-0">
            <li
              v-for="r in nearMiss"
              :key="r.appid"
              class="flex min-h-14 items-center justify-between gap-3 border-b border-line py-2"
            >
              <span class="flex min-w-0 flex-col gap-0.5">
                <span class="text-[15px] font-semibold">{{ r.name }}</span>
                <span class="text-[13px] text-faint">{{ missingText(r) }}</span>
              </span>
              <TierBadge :tier="r.tier" />
            </li>
          </ul>
        </section>

        <section v-if="blocked.length" class="card flex flex-col gap-3 p-5" aria-labelledby="blocked-heading">
          <div class="flex items-baseline justify-between gap-3">
            <h2 id="blocked-heading" class="m-0 text-[19px] font-extrabold">{{ t('group.blockedListTitle') }}</h2>
            <span class="font-mono text-xs text-danger">{{
              t('results.games', { n: blocked.length }, blocked.length)
            }}</span>
          </div>
          <p class="m-0 text-sm leading-normal text-muted">{{ t('group.blockedListLead') }}</p>
          <ul class="m-0 flex list-none flex-col p-0">
            <li v-for="r in blocked.slice(0, 5)" :key="r.appid" class="flex flex-col gap-0.5 border-b border-line py-3">
              <span class="text-[15px] font-semibold">{{ r.name }}</span>
              <span class="text-[13px] text-danger">{{ antiCheatLabel(r.compat?.antiCheat) }}</span>
            </li>
            <li v-if="blocked.length > 5" class="pt-3 text-sm text-muted">
              {{ t('results.more', { n: blocked.length - 5 }) }}
            </li>
          </ul>
        </section>

        <p v-if="unsure > 0" class="m-0 text-[13px] leading-relaxed text-faint">
          {{ t('group.unsure', { n: unsure }, unsure) }}
        </p>

        <div class="flex flex-col gap-2.5">
          <button type="button" class="btn btn-primary" @click="share">{{ t('group.share') }}</button>
          <p class="m-0 text-[13px] leading-relaxed text-faint">{{ t('group.shareNote') }}</p>
          <p class="m-0 min-h-5 text-center text-sm text-muted" role="status">{{ shareNote }}</p>
        </div>
      </div>
    </Transition>
  </PageMain>
</template>
