import { nextTick, watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { i18n } from './i18n'
import { applyHead } from './lib/head'
import SearchView from './views/SearchView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /** i18n keys */
    title: string
    description: string
    /** Only public, shared-by-everyone pages are indexed; personal results are not. */
    index: boolean
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'search',
      component: SearchView,
      meta: { title: 'meta.search', description: 'meta.searchDesc', index: true },
    },
    {
      path: '/u/:query',
      name: 'results',
      component: () => import('./views/ResultsView.vue'),
      meta: { title: 'meta.results', description: 'meta.resultsDesc', index: false },
    },
    {
      path: '/u/:query/games',
      name: 'games',
      component: () => import('./views/DeepDiveView.vue'),
      meta: { title: 'meta.games', description: 'meta.gamesDesc', index: false },
    },
    {
      path: '/u/:query/wishlist',
      name: 'wishlist',
      component: () => import('./views/WishlistView.vue'),
      meta: { title: 'meta.wishlist', description: 'meta.wishlistDesc', index: false },
    },
    {
      path: '/u/:query/friends',
      name: 'friends',
      component: () => import('./views/FriendsView.vue'),
      meta: { title: 'meta.friends', description: 'meta.friendsDesc', index: false },
    },
    {
      path: '/u/:query/group',
      name: 'group',
      component: () => import('./views/GroupView.vue'),
      meta: { title: 'meta.group', description: 'meta.groupDesc', index: false },
    },
    {
      path: '/how-it-works',
      name: 'how',
      component: () => import('./views/HowItWorksView.vue'),
      meta: { title: 'meta.how', description: 'meta.howDesc', index: true },
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import('./views/PrivacyView.vue'),
      meta: { title: 'meta.privacy', description: 'meta.privacyDesc', index: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('./views/NotFoundView.vue'),
      meta: { title: 'meta.notFound', description: 'meta.notFoundDesc', index: false },
    },
  ],
  scrollBehavior(to, from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash, top: 16 }
    // Only the query changed (e.g. a tier filter): stay put.
    if (to.path === from.path) return false
    return { top: 0 }
  },
})

// Head tags follow both navigation and the language.
router.afterEach((to) => applyHead(to))
watch(i18n.global.locale, () => applyHead(router.currentRoute.value))

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
