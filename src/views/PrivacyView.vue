<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { REPO_URL } from '../../shared/types'
import PageMain from '../components/PageMain.vue'

const { t, tm, rt } = useI18n()

/** GitHub issues by default; VITE_CONTACT (an email address or URL) overrides it. */
const raw = (import.meta.env.VITE_CONTACT ?? '').trim() || `${REPO_URL}/issues`
const contact = computed(() => {
  const isEmail = /^[^\s/:]+@[^\s/]+\.[^\s/]+$/.test(raw)
  return { href: isEmail ? `mailto:${raw}` : raw, label: raw.replace(/^https?:\/\//, '') }
})
</script>

<template>
  <PageMain>
    <div class="anim-in flex flex-col gap-3">
      <h1 class="m-0 text-[38px] leading-none font-black tracking-tight">{{ t('privacy.title') }}</h1>
      <p class="m-0 font-mono text-xs text-faint">{{ t('privacy.updated') }}</p>
      <p class="m-0 text-[17px] leading-normal text-ink-2">{{ t('privacy.lead') }}</p>
    </div>

    <section
      v-for="(s, i) in tm('privacy.sections') as { title: string; body: string }[]"
      :key="i"
      class="anim-in flex flex-col gap-2"
      :style="{ '--i': i + 1 }"
      :aria-labelledby="`privacy-${i}`"
    >
      <h2 :id="`privacy-${i}`" class="m-0 text-[20px] font-extrabold">{{ rt(s.title) }}</h2>
      <p class="m-0 text-[15px] leading-relaxed text-muted">{{ rt(s.body) }}</p>
    </section>

    <section class="card flex flex-col gap-2 p-5" aria-labelledby="privacy-contact">
      <h2 id="privacy-contact" class="m-0 text-[20px] font-extrabold">{{ t('privacy.contactTitle') }}</h2>
      <p class="m-0 text-[15px] leading-relaxed text-muted">
        {{ t('privacy.contactText') }}
        <a :href="contact.href" class="font-semibold break-all">{{ contact.label }}</a>
      </p>
    </section>
  </PageMain>
</template>
