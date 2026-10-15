<script setup lang="ts">
import { TIERS } from '../../shared/types'
import PageMain from '../components/PageMain.vue'
import TierBadge from '../components/TierBadge.vue'
import { VERDICT_COPY, VERDICT_RULES } from '../lib/copy'
import { TIER_META } from '../lib/tiers'

const steps = [
  {
    title: 'Read your library',
    text: "We ask Steam's public API for the games you own and your hours in each. This only works if your profile and game details are public.",
  },
  {
    title: 'Match ProtonDB and anti-cheat data',
    text: 'Each game gets its ProtonDB tier, built from reports by people playing on Linux. Steam tells us which games have a native Linux version, and online games are checked against Are We Anti-Cheat Yet.',
  },
  {
    title: 'Work out the verdict',
    text: 'Counted by games or by hours played, so a game you sank 400 hours into weighs more than one you never launched.',
  },
]

const faq = [
  {
    id: 'public',
    q: 'How do I make my profile public?',
    a: 'In Steam, open your profile, choose Edit Profile, then Privacy Settings. Set My profile and Game details to Public, and untick "Always keep my total playtime private" to get the hours view. You can switch it back afterwards.',
  },
  {
    id: 'login',
    q: 'Why no Steam login?',
    a: "Signing in with Steam only proves who you are; it doesn't give anyone access to a private game list. A public profile is the only way, so we skip the login.",
  },
  {
    id: 'anticheat',
    q: 'What about anti-cheat?',
    a: "Some online games block Linux on purpose. We count those as Borked even when ProtonDB reports look fine (often from single-player modes), so you know a Proton update won't fix them.",
  },
  {
    id: 'pending',
    q: 'Why are some games Pending?',
    a: "Nobody has reported them on ProtonDB yet. They still count towards your total, so a big pile of obscure games pulls the number down. Many of them run fine; check by hours played if that's the case for you.",
  },
  { id: 'stores', q: 'Does it check Epic, GOG or Xbox games?', a: 'No, Steam only. ProtonDB ratings are for Steam games.' },
  {
    id: 'data',
    q: 'Do you store my data?',
    a: "No profiles or game lists are stored. We only cache each game's compatibility for a day so checks stay fast.",
  },
  {
    id: 'hardware',
    q: 'Is my hardware taken into account?',
    a: 'No. Tiers come from reports across many machines. AMD and Intel graphics tend to have the fewest surprises on Linux.',
  },
]
</script>

<template>
  <PageMain>
    <div class="flex flex-col gap-3">
      <h1 class="m-0 text-[38px] leading-none font-black tracking-tight">How it works</h1>
      <p class="m-0 text-[17px] leading-normal text-muted">
        We read the games you own on Steam, look each one up on ProtonDB, and add it up into one verdict.
      </p>
    </div>

    <section class="flex flex-col gap-3">
      <h2 class="m-0 mb-1 text-[22px] font-extrabold">Three steps</h2>
      <div v-for="(s, i) in steps" :key="s.title" class="card flex gap-4 p-[18px]">
        <span class="font-mono text-[13px] text-accent">0{{ i + 1 }}</span>
        <div class="flex flex-col gap-1">
          <span class="font-bold">{{ s.title }}</span>
          <span class="text-sm leading-normal text-muted">{{ s.text }}</span>
        </div>
      </div>
    </section>

    <section class="flex flex-col">
      <h2 class="m-0 mb-2 text-[22px] font-extrabold">What the tiers mean</h2>
      <div v-for="t in TIERS" :key="t" class="flex gap-3.5 border-b border-line py-3.5">
        <TierBadge :tier="t" wide class="self-start" />
        <span class="text-[15px] leading-normal text-ink-2">{{ TIER_META[t].meaning }}</span>
      </div>
      <p class="m-0 mt-3 text-sm leading-normal text-faint">Native, Platinum and Gold count as "runs well".</p>
    </section>

    <section class="flex flex-col gap-2">
      <h2 class="m-0 mb-2 text-[22px] font-extrabold">The verdicts</h2>
      <div v-for="v in VERDICT_RULES" :key="v.key" class="card flex flex-col gap-1 px-4 py-3.5">
        <span class="text-[17px] font-extrabold">{{ VERDICT_COPY[v.key].headline }}</span>
        <span class="text-sm leading-normal text-muted">{{ v.rule }}</span>
      </div>
    </section>

    <section class="flex flex-col">
      <h2 class="m-0 mb-2 text-[22px] font-extrabold">Questions</h2>
      <details v-for="f in faq" :id="f.id" :key="f.id" class="border-b border-line" :open="$route.hash === `#${f.id}`">
        <summary class="flex min-h-14 cursor-pointer list-none items-center font-semibold">{{ f.q }}</summary>
        <p class="m-0 mb-4 text-[15px] leading-relaxed text-muted">{{ f.a }}</p>
      </details>
    </section>

    <RouterLink to="/" class="btn btn-primary">Check my library</RouterLink>
  </PageMain>
</template>
