<script setup lang="ts">
import PageMain from '../components/PageMain.vue'
import { homeRoute, lastUser } from '../lib/lastUser'
</script>

<template>
  <PageMain>
    <div class="flex flex-col gap-6 pt-8">
      <div class="anim-in font-mono text-[13px] text-accent" lang="en" aria-hidden="true">
        $ cd /this/page<br />bash: no such file or directory
      </div>
      <h1 class="anim-in m-0 text-[42px] leading-none font-black tracking-tight" style="--i: 1">{{ $t('notFoundPage.title') }}</h1>
      <p class="anim-in m-0 leading-normal text-muted" style="--i: 2">{{ $t('notFoundPage.lead') }}</p>
      <RouterLink :to="homeRoute" class="btn btn-primary anim-in" style="--i: 3">
        {{ lastUser ? $t('common.backToResults') : $t('common.checkLibrary') }}
      </RouterLink>
    </div>
  </PageMain>
</template>
