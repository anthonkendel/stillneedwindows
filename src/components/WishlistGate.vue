<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouteWishlist } from '../lib/useRouteWishlist'
import CheckingState from './states/CheckingState.vue'
import ErrorState from './states/ErrorState.vue'
import NotFoundState from './states/NotFoundState.vue'
import PrivateState from './states/PrivateState.vue'
import StateIcon from './states/StateIcon.vue'

/** Shows the wishlist's loading and error states, and the slot once every game is checked. */
defineProps<{
  /** The page above already shows the profile row. */
  bare?: boolean
}>()
const { t } = useI18n()
const { wish, query, retry } = useRouteWishlist()
const loading = computed(() => ['idle', 'profile', 'checking'].includes(wish.phase))
</script>

<template>
  <Transition name="page" mode="out-in">
    <CheckingState
      v-if="loading"
      key="loading"
      :bare="bare"
      :profile="wish.profile"
      :title="t('wishlist.loading')"
      :done="wish.checked"
      :total="wish.items.length"
    />
    <PrivateState v-else-if="wish.phase === 'private'" key="private" :profile="wish.profile" @retry="retry" />
    <NotFoundState v-else-if="wish.phase === 'not_found'" :key="`nf-${query}`" :query="query" />
    <ErrorState v-else-if="wish.phase === 'error'" key="error" @retry="retry" />
    <div v-else-if="wish.phase === 'empty'" key="empty" class="flex flex-col gap-6">
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
      <slot />
    </div>
  </Transition>
</template>
