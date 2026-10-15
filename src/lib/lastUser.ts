import { computed, ref } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

/**
 * The last profile checked in this tab. Lives in sessionStorage, so it's gone
 * once the tab or window is closed. Never sent anywhere.
 */
export interface LastUser {
  steamid: string
  name: string
}

const KEY = 'snw-last-user'

function read(): LastUser | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    const v = raw ? JSON.parse(raw) : null
    return v && typeof v.steamid === 'string' && typeof v.name === 'string' ? v : null
  } catch {
    return null
  }
}

export const lastUser = ref<LastUser | null>(read())

export function rememberUser(user: LastUser) {
  lastUser.value = user
  try {
    sessionStorage.setItem(KEY, JSON.stringify(user))
  } catch {
    /* storage blocked: still works for this page view */
  }
}

/** Where "home" goes: the last checked library if there is one, otherwise search. */
export const homeRoute = computed<RouteLocationRaw>(() =>
  lastUser.value ? { name: 'results', params: { query: lastUser.value.steamid } } : { name: 'search' },
)
