<script setup lang="ts">
import { computed } from 'vue'
import { useRouteLibrary } from '../lib/useRouteLibrary'
import EmptyState from './states/EmptyState.vue'
import ErrorState from './states/ErrorState.vue'
import LoadingState from './states/LoadingState.vue'
import NotFoundState from './states/NotFoundState.vue'
import PrivateState from './states/PrivateState.vue'

/** Shows the loading and error states, and the slot once every game is checked. */
const { lib, query, retry } = useRouteLibrary()
const loading = computed(() => ['idle', 'profile', 'checking'].includes(lib.phase))
</script>

<template>
  <Transition name="page" mode="out-in">
    <LoadingState v-if="loading" key="loading" />
    <PrivateState v-else-if="lib.phase === 'private'" key="private" :profile="lib.profile" @retry="retry" />
    <NotFoundState v-else-if="lib.phase === 'not_found'" :key="`nf-${query}`" :query="query" />
    <EmptyState v-else-if="lib.phase === 'empty'" key="empty" :profile="lib.profile" @retry="retry" />
    <ErrorState v-else-if="lib.phase === 'error'" key="error" @retry="retry" />
    <div v-else key="done" class="flex flex-col gap-7">
      <slot />
    </div>
  </Transition>
</template>
