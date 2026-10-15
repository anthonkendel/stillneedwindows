import { nextTick, watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { i18n } from './i18n'
import SearchView from './views/SearchView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'search', component: SearchView, meta: { title: 'meta.search' } },
    { path: '/u/:query', name: 'results', component: () => import('./views/ResultsView.vue'), meta: { title: 'meta.results' } },
    { path: '/u/:query/games', name: 'games', component: () => import('./views/DeepDiveView.vue'), meta: { title: 'meta.games' } },
    { path: '/how-it-works', name: 'how', component: () => import('./views/HowItWorksView.vue'), meta: { title: 'meta.how' } },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./views/NotFoundView.vue'), meta: { title: 'meta.notFound' } },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, top: 16 }
    // Only the query changed (e.g. a tier filter): stay put.
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

function setTitle() {
  const key = router.currentRoute.value.meta.title
  document.title = key ? `${i18n.global.t(key)} · stillneedwindows` : 'stillneedwindows'
}

// Page titles follow both navigation and language changes.
router.afterEach(setTitle)
watch(i18n.global.locale, setTitle)

// After in-app navigation, move focus to the new page so keyboard and
// screen reader users start at the top of the content (WCAG 2.4.3).
let first = true
router.afterEach((to, from) => {
  if (first) {
    first = false
    return
  }
  if (to.path === from.path) return
  nextTick(() => document.getElementById('main')?.focus({ preventScroll: true }))
})
