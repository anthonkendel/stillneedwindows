import { createRouter, createWebHistory } from 'vue-router'
import SearchView from './views/SearchView.vue'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'search', component: SearchView },
    { path: '/u/:query', name: 'results', component: () => import('./views/ResultsView.vue') },
    { path: '/u/:query/games', name: 'games', component: () => import('./views/DeepDiveView.vue') },
    { path: '/how-it-works', name: 'how', component: () => import('./views/HowItWorksView.vue') },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('./views/NotFoundView.vue') },
  ],
  scrollBehavior(to, _from, saved) {
    if (saved) return saved
    if (to.hash) return { el: to.hash }
    return { top: 0 }
  },
})
