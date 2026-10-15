<script setup lang="ts">
import { useRouteLibrary } from '../lib/useRouteLibrary'
import EmptyState from './states/EmptyState.vue'
import ErrorState from './states/ErrorState.vue'
import LoadingState from './states/LoadingState.vue'
import NotFoundState from './states/NotFoundState.vue'
import PrivateState from './states/PrivateState.vue'

/** Shows the loading and error states, and the slot once every game is checked. */
const { lib, query, retry } = useRouteLibrary()
</script>

<template>
  <LoadingState v-if="lib.phase === 'idle' || lib.phase === 'profile' || lib.phase === 'checking'" />
  <PrivateState v-else-if="lib.phase === 'private'" :profile="lib.profile" @retry="retry" />
  <NotFoundState v-else-if="lib.phase === 'not_found'" :key="query" :query="query" />
  <EmptyState v-else-if="lib.phase === 'empty'" :profile="lib.profile" @retry="retry" />
  <ErrorState v-else-if="lib.phase === 'error'" @retry="retry" />
  <slot v-else />
</template>
