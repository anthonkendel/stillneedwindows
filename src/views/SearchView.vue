<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { parseProfileInput } from '../../shared/profileInput'
import PageMain from '../components/PageMain.vue'

const { tm, rt } = useI18n()
const router = useRouter()
const input = ref('')
const invalid = ref(false)
const shake = ref(false)

function submit() {
  const q = parseProfileInput(input.value)
  invalid.value = !q
  if (!q) {
    shake.value = false
    requestAnimationFrame(() => (shake.value = true))
    return
  }
  router.push({ name: 'results', params: { query: q.value } })
}
</script>

<template>
  <PageMain>
    <div class="flex flex-col gap-6 pt-4 sm:pt-12">
      <div class="anim-in font-mono text-[13px] text-accent" lang="en" aria-hidden="true">
        $ windows --still-needed?<span class="caret">▍</span>
      </div>
      <h1 class="anim-in m-0 text-[42px] leading-none font-black tracking-[-0.03em] sm:text-6xl" style="--i: 1">
        {{ $t('search.title') }}
      </h1>
      <p class="anim-in m-0 text-[17px] leading-normal text-muted" style="--i: 2">{{ $t('search.lead') }}</p>
    </div>

    <form class="anim-in flex flex-col gap-2.5" style="--i: 3" novalidate @submit.prevent="submit">
      <label for="profile" class="text-sm font-semibold text-ink-2">{{ $t('search.label') }}</label>
      <input
        id="profile"
        v-model="input"
        type="text"
        inputmode="url"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        :placeholder="$t('search.placeholder')"
        class="field"
        :class="{ '!border-danger-line': invalid, shake }"
        :aria-invalid="invalid"
        :aria-describedby="invalid ? 'profile-error profile-help' : 'profile-help'"
        @animationend="shake = false"
      />
      <p v-if="invalid" id="profile-error" class="m-0 text-sm text-danger" role="alert">{{ $t('search.invalid') }}</p>
      <button type="submit" class="btn btn-primary text-[17px]">
        {{ $t('search.submit') }}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"
          stroke-linecap="round" stroke-linejoin="round" class="arrow" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
      </button>
      <p id="profile-help" class="m-0 mt-1 text-sm leading-normal text-faint">
        {{ $t('search.help') }}
        <RouterLink :to="{ name: 'how', hash: '#public' }">{{ $t('search.howPublic') }}</RouterLink>
      </p>
    </form>

    <ol class="m-0 mt-4 flex list-none flex-col gap-3 p-0 sm:grid sm:grid-cols-3">
      <li
        v-for="(s, i) in tm('search.steps') as { title: string; text: string }[]"
        :key="i"
        class="card anim-in flex gap-4 p-[18px] sm:flex-col sm:gap-2"
        :style="{ '--i': i + 4 }"
      >
        <span class="font-mono text-[13px] text-accent" aria-hidden="true">0{{ i + 1 }}</span>
        <div class="flex flex-col gap-1">
          <h2 class="m-0 text-base font-bold">{{ rt(s.title) }}</h2>
          <p class="m-0 text-sm leading-normal text-muted">{{ rt(s.text) }}</p>
        </div>
      </li>
    </ol>
  </PageMain>
</template>

<style scoped>
.caret {
  margin-left: 2px;
  /* Stops after ~4 s: WCAG 2.2.2 allows blinking under 5 s without a pause control. */
  animation: blink 1.1s steps(1) 4 forwards;
}
@keyframes blink {
  50% {
    opacity: 0;
  }
}
.shake {
  animation: shake 0.35s;
}
@keyframes shake {
  25% {
    transform: translateX(-6px);
  }
  75% {
    transform: translateX(6px);
  }
}
.btn:hover .arrow {
  transform: translateX(3px);
}
.arrow {
  transition: transform 0.2s var(--ease-out);
}
</style>
