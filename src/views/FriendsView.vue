<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { parseProfileInput } from '../../shared/profileInput'
import type { Friend, Profile } from '../../shared/types'
import PageMain from '../components/PageMain.vue'
import ProfileRow from '../components/ProfileRow.vue'
import ErrorState from '../components/states/ErrorState.vue'
import NotFoundState from '../components/states/NotFoundState.vue'
import StateIcon from '../components/states/StateIcon.vue'
import { fetchFriends } from '../lib/api'
import { MAX_FRIENDS_PICKED } from '../lib/group'
import { formatNumber } from '../lib/tiers'

type Phase = 'loading' | 'ok' | 'private' | 'not_found' | 'error'

/** Someone picked for the group: a friend from the list, or anyone added by profile link. */
interface Pick {
  /** SteamID64 or custom name, as the group page takes it. */
  key: string
  label: string
}

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const query = computed(() => String(route.params.query ?? ''))

const phase = ref<Phase>('loading')
const profile = ref<Profile | null>(null)
const friends = ref<Friend[]>([])
const picked = ref<Pick[]>([])

/** "Edit group" comes back here with the current picks in ?with=. */
function initialPicks(): Pick[] {
  const raw = typeof route.query.with === 'string' ? route.query.with.split(',') : []
  return raw
    .map((key) => key.trim())
    .filter(Boolean)
    .slice(0, MAX_FRIENDS_PICKED)
    .map((key) => ({ key, label: friends.value.find((f) => f.steamid === key)?.name ?? key }))
}

async function load() {
  phase.value = 'loading'
  try {
    const res = await fetchFriends(query.value)
    if (res.status === 'not_found') {
      phase.value = 'not_found'
      return
    }
    profile.value = res.profile
    friends.value = res.status === 'ok' ? res.friends : []
    picked.value = initialPicks()
    phase.value = res.status
    if (res.profile.steamid !== query.value) {
      router.replace({ name: 'friends', params: { query: res.profile.steamid }, query: route.query })
    }
  } catch {
    phase.value = 'error'
  }
}
watch(query, (q, old) => q && q !== profile.value?.steamid && q !== old && load(), { immediate: true })

const full = computed(() => picked.value.length >= MAX_FRIENDS_PICKED)
const isPicked = (key: string) => picked.value.some((p) => p.key === key)

function toggle(f: Friend) {
  if (isPicked(f.steamid)) picked.value = picked.value.filter((p) => p.key !== f.steamid)
  else if (!full.value) picked.value = [...picked.value, { key: f.steamid, label: f.name }]
}

const PAGE = 100
const search = ref('')
const limit = ref(PAGE)
const visible = computed(() => {
  const q = search.value.trim().toLocaleLowerCase(locale.value)
  return q ? friends.value.filter((f) => f.name.toLocaleLowerCase(locale.value).includes(q)) : friends.value
})
const shown = computed(() => visible.value.slice(0, limit.value))

const sinceYear = (f: Friend) => (f.since ? new Date(f.since * 1000).getFullYear() : null)

const manual = ref('')
const manualError = ref('')
function addManual() {
  const q = parseProfileInput(manual.value)
  if (!q) {
    manualError.value = t('friends.manualInvalid')
    return
  }
  if (q.value === profile.value?.steamid || isPicked(q.value)) {
    manualError.value = t('friends.manualDuplicate')
    return
  }
  if (full.value) return
  const friend = friends.value.find((f) => f.steamid === q.value)
  picked.value = [...picked.value, { key: q.value, label: friend?.name ?? q.value }]
  manual.value = ''
  manualError.value = ''
}

function compare() {
  if (!profile.value || !picked.value.length) return
  router.push({
    name: 'group',
    params: { query: profile.value.steamid },
    query: { with: picked.value.map((p) => p.key).join(',') },
  })
}
</script>

<template>
  <PageMain>
    <div v-if="phase === 'loading'" class="flex flex-col gap-7" aria-busy="true">
      <ProfileRow :profile="null" :detail="t('friends.loading')" />
      <div class="flex flex-col gap-2.5" aria-hidden="true">
        <div v-for="i in 5" :key="i" class="h-14 animate-pulse rounded-lg bg-surface" />
      </div>
    </div>
    <NotFoundState v-else-if="phase === 'not_found'" :key="`nf-${query}`" :query="query" />
    <ErrorState v-else-if="phase === 'error'" @retry="load" />

    <template v-else>
      <div class="flex flex-col gap-3">
        <div class="font-mono text-[13px] text-accent" lang="en" aria-hidden="true">
          $ windows --still-needed? --group
        </div>
        <h1 class="m-0 text-[38px] leading-none font-black tracking-tight">{{ t('friends.title') }}</h1>
        <p class="m-0 text-[17px] leading-normal text-muted">{{ t('friends.lead') }}</p>
      </div>

      <ProfileRow :profile="profile" :detail="t('friends.you')" />

      <div v-if="phase === 'private'" class="card flex gap-3 p-4" role="status">
        <StateIcon kind="lock" class="size-10! shrink-0 rounded-[10px]!" />
        <div class="flex flex-col gap-1">
          <h2 class="m-0 text-[15px] font-bold">{{ t('friends.privateTitle') }}</h2>
          <i18n-t scope="global" keypath="friends.privateLead" tag="p" class="m-0 text-sm leading-normal text-muted">
            <template #term
              ><strong class="text-ink">{{ t('friends.friendsListTerm') }}</strong></template
            >
          </i18n-t>
        </div>
      </div>

      <fieldset v-else class="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0">
        <legend class="mb-2.5 flex w-full items-baseline justify-between gap-3 p-0">
          <span class="text-sm font-semibold text-ink-2">{{ t('friends.pickLabel', { n: MAX_FRIENDS_PICKED }) }}</span>
        </legend>
        <label for="friend-search" class="text-[13px] font-semibold text-muted">{{
          t('friends.search', { n: formatNumber(friends.length) }, friends.length)
        }}</label>
        <input
          id="friend-search"
          v-model="search"
          type="search"
          autocomplete="off"
          :placeholder="t('friends.searchPlaceholder')"
          class="field min-h-12"
          @input="limit = PAGE"
        />
        <p v-if="!friends.length" class="m-0 py-4 text-faint">{{ t('friends.none') }}</p>
        <ul v-else class="card m-0 flex list-none flex-col px-3.5 py-0">
          <li v-for="f in shown" :key="f.steamid" class="border-b border-line last:border-b-0">
            <label
              class="flex min-h-14 items-center gap-3 py-1.5"
              :class="
                !f.isPublic || (full && !isPicked(f.steamid)) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
              "
            >
              <input
                type="checkbox"
                class="size-5.5 shrink-0 cursor-[inherit] accent-accent"
                :checked="isPicked(f.steamid)"
                :disabled="!f.isPublic || (full && !isPicked(f.steamid))"
                @change="toggle(f)"
              />
              <img
                v-if="f.avatar"
                :src="f.avatar"
                alt=""
                width="32"
                height="32"
                loading="lazy"
                class="size-8 shrink-0 rounded-full bg-raised"
              />
              <span v-else class="size-8 shrink-0 rounded-full bg-raised" aria-hidden="true" />
              <span class="flex min-w-0 flex-1 flex-col gap-0.5">
                <span class="truncate text-[15px] font-semibold">{{ f.name }}</span>
                <span v-if="!f.isPublic" class="text-xs text-faint">{{ t('friends.privateProfile') }}</span>
                <span v-else-if="sinceYear(f)" class="text-xs text-faint">{{
                  t('friends.since', { year: sinceYear(f) })
                }}</span>
              </span>
            </label>
          </li>
        </ul>
        <p v-if="friends.length && !visible.length" class="m-0 py-4 text-center text-faint">
          {{ t('friends.noMatch') }}
        </p>
        <button v-if="visible.length > limit" type="button" class="btn btn-secondary" @click="limit += PAGE">
          {{ t('games.showMore', { n: formatNumber(visible.length - limit) }) }}
        </button>
      </fieldset>

      <form class="flex flex-col gap-2" novalidate @submit.prevent="addManual">
        <label for="manual" class="text-sm font-semibold text-ink-2">{{
          phase === 'private' ? t('friends.manualLabelOnly') : t('friends.manualLabel')
        }}</label>
        <div class="flex gap-2">
          <input
            id="manual"
            v-model="manual"
            type="text"
            inputmode="url"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            :placeholder="t('search.placeholder')"
            class="field min-w-0 flex-1 font-mono"
            :aria-invalid="!!manualError"
            :aria-describedby="manualError ? 'manual-error' : undefined"
            :disabled="full"
          />
          <button
            type="submit"
            class="btn btn-secondary w-14 shrink-0 px-0"
            :aria-label="t('friends.manualAdd')"
            :disabled="full"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
        <p v-if="manualError" id="manual-error" class="m-0 text-sm text-danger" role="alert">{{ manualError }}</p>
      </form>

      <section class="flex flex-col gap-2.5" aria-labelledby="picked-heading">
        <h2 id="picked-heading" class="m-0 flex items-baseline justify-between gap-3 text-sm font-semibold text-ink-2">
          {{ t('friends.pickedTitle') }}
          <span class="font-mono text-xs font-normal text-faint">{{
            t('friends.pickedCount', { n: picked.length, max: MAX_FRIENDS_PICKED })
          }}</span>
        </h2>
        <ul v-if="picked.length" class="m-0 flex list-none flex-wrap gap-2 p-0">
          <li v-for="p in picked" :key="p.key">
            <button
              type="button"
              class="chip"
              :aria-label="t('friends.remove', { name: p.label })"
              @click="picked = picked.filter((x) => x.key !== p.key)"
            >
              <span class="max-w-48 truncate">{{ p.label }}</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.6"
                stroke-linecap="round"
                aria-hidden="true"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </li>
        </ul>
        <p v-else class="m-0 text-sm text-faint">{{ t('friends.pickedNone') }}</p>
      </section>

      <div class="flex flex-col gap-2.5">
        <button type="button" class="btn btn-primary" :disabled="!picked.length" @click="compare">
          {{ t('friends.compare', { n: picked.length + 1 }) }}
        </button>
        <p class="m-0 text-sm leading-normal text-faint">{{ t('friends.note') }}</p>
      </div>
    </template>
  </PageMain>
</template>

<style scoped>
.btn-primary:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.btn-secondary:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
