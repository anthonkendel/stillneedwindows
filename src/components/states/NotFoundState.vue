<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { parseProfileInput } from '../../../shared/profileInput'
import StateIcon from './StateIcon.vue'

const props = defineProps<{ query: string }>()
const router = useRouter()
const input = ref(props.query)
const error = ref('')

function submit() {
  const q = parseProfileInput(input.value)
  if (!q) {
    error.value = "That doesn't look like a profile link or custom URL name."
    return
  }
  router.push({ name: 'results', params: { query: q.value } })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <StateIcon kind="search" />
    <div class="flex flex-col gap-2.5">
      <h1 class="m-0 text-[34px] leading-tight font-black tracking-tight">No profile by that name</h1>
      <p class="m-0 leading-normal text-muted">
        Steam doesn't know a profile called <span class="font-mono text-ink">{{ query }}</span>. Your display name
        won't work, only your profile link or custom URL.
      </p>
    </div>

    <form class="flex flex-col gap-2.5" novalidate @submit.prevent="submit">
      <label for="profile2" class="text-sm font-semibold text-ink-2">Steam profile URL or name</label>
      <input
        id="profile2"
        v-model="input"
        type="text"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        class="field !border-danger-line font-mono"
        aria-invalid="true"
      />
      <p v-if="error" class="m-0 text-sm text-danger" role="alert">{{ error }}</p>
      <button type="submit" class="btn btn-primary border-0 text-[17px]">Try again</button>
    </form>

    <div class="card flex flex-col gap-2.5 p-[18px]">
      <span class="text-[15px] font-bold">These all work</span>
      <div class="flex flex-col gap-1.5 font-mono text-[13px] text-ink-2">
        <span>steamcommunity.com/id/yourname</span>
        <span>steamcommunity.com/profiles/7656…</span>
        <span>yourname</span>
      </div>
      <p class="m-0 mt-1 text-sm leading-normal text-faint">
        Find your link in Steam: open your profile, then Copy Page URL.
      </p>
    </div>
  </div>
</template>
