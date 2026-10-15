<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { parseProfileInput } from '../../../shared/profileInput'
import StateIcon from './StateIcon.vue'

const props = defineProps<{ query: string }>()
const router = useRouter()
const input = ref(props.query)
const invalid = ref(false)

function submit() {
  const q = parseProfileInput(input.value)
  invalid.value = !q
  if (q) router.push({ name: 'results', params: { query: q.value } })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <StateIcon kind="search" />
    <div class="anim-in flex flex-col gap-2.5" style="--i: 1">
      <h1 class="m-0 text-[34px] leading-tight font-black tracking-tight">{{ $t('notFound.title') }}</h1>
      <i18n-t scope="global" keypath="notFound.lead" tag="p" class="m-0 leading-normal text-muted">
        <template #query><span class="font-mono break-all text-ink">{{ query }}</span></template>
      </i18n-t>
    </div>

    <form class="flex flex-col gap-2.5" novalidate @submit.prevent="submit">
      <label for="profile2" class="text-sm font-semibold text-ink-2">{{ $t('search.label') }}</label>
      <input
        id="profile2"
        v-model="input"
        type="text"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        class="field font-mono !border-danger-line"
        aria-invalid="true"
        :aria-describedby="invalid ? 'profile2-error' : undefined"
      />
      <p v-if="invalid" id="profile2-error" class="m-0 text-sm text-danger" role="alert">{{ $t('notFound.invalid') }}</p>
      <button type="submit" class="btn btn-primary text-[17px]">{{ $t('common.retry') }}</button>
    </form>

    <div class="card flex flex-col gap-2.5 p-[18px]">
      <h2 class="m-0 text-[15px] font-bold">{{ $t('notFound.worksTitle') }}</h2>
      <ul class="m-0 flex list-none flex-col gap-1.5 p-0 font-mono text-[13px] text-ink-2" lang="en">
        <li>steamcommunity.com/id/yourname</li>
        <li>steamcommunity.com/profiles/7656…</li>
        <li>yourname</li>
      </ul>
      <p class="m-0 mt-1 text-sm leading-normal text-faint">{{ $t('notFound.findLink') }}</p>
    </div>
  </div>
</template>
