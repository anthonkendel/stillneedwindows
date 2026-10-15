<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { parseProfileInput } from '../../shared/profileInput'
import PageMain from '../components/PageMain.vue'

const router = useRouter()
const input = ref('')
const error = ref('')

const steps = [
  { title: 'Read your library', text: "Owned games and hours played, from Steam's public API." },
  { title: 'Match ProtonDB', text: 'Each game gets its tier, from Native down to Borked.' },
  { title: 'Get the verdict', text: 'Weighted by what you actually play, anti-cheat blockers flagged.' },
]

function submit() {
  const q = parseProfileInput(input.value)
  if (!q) {
    error.value = "That doesn't look like a profile link or custom URL name. Your display name won't work."
    return
  }
  error.value = ''
  router.push({ name: 'results', params: { query: q.value } })
}
</script>

<template>
  <PageMain>
    <div class="flex flex-col gap-6 pt-4 sm:pt-12">
      <div class="font-mono text-[13px] text-accent">$ windows --still-needed?</div>
      <h1 class="m-0 text-[42px] leading-none font-black tracking-[-0.03em] sm:text-6xl">
        Does your Steam library still need Windows?
      </h1>
      <p class="m-0 text-[17px] leading-normal text-muted">
        Paste your Steam profile. We check every game you own against ProtonDB and give you one number.
      </p>
    </div>

    <form class="flex flex-col gap-2.5" novalidate @submit.prevent="submit">
      <label for="profile" class="text-sm font-semibold text-ink-2">Steam profile URL or name</label>
      <input
        id="profile"
        v-model="input"
        type="text"
        inputmode="url"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        placeholder="steamcommunity.com/id/you"
        class="field font-mono"
        :class="error ? '!border-danger-line' : ''"
        :aria-invalid="!!error"
        aria-describedby="profile-help"
      />
      <p v-if="error" class="m-0 text-sm text-danger" role="alert">{{ error }}</p>
      <button type="submit" class="btn btn-primary border-0 text-[17px]">Check my library</button>
      <p id="profile-help" class="m-0 mt-1 text-sm leading-normal text-faint">
        No login. Your profile and game details must be public.
        <RouterLink :to="{ name: 'how', hash: '#public' }">How to make them public</RouterLink>
      </p>
    </form>

    <ol class="m-0 mt-4 flex list-none flex-col gap-3 p-0 sm:grid sm:grid-cols-3">
      <li v-for="(s, i) in steps" :key="s.title" class="card flex gap-4 p-[18px] sm:flex-col sm:gap-2">
        <span class="font-mono text-[13px] text-accent">0{{ i + 1 }}</span>
        <div class="flex flex-col gap-1">
          <span class="text-base font-bold">{{ s.title }}</span>
          <span class="text-sm leading-normal text-muted">{{ s.text }}</span>
        </div>
      </li>
    </ol>
  </PageMain>

  <footer class="border-t border-line px-5 py-5 text-xs leading-relaxed text-dim sm:px-10">
    Data from ProtonDB, Are We Anti-Cheat Yet and the Steam Web API. Not affiliated with Valve or ProtonDB.
  </footer>
</template>
