import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { i18n } from '../i18n'

/** Public origin, set with VITE_SITE_URL at build time. Used for canonical and social URLs. */
export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://stillneedwindows.com').replace(/\/$/, '')
export const SITE_NAME = 'stillneedwindows'

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

function setCanonical(href: string | null) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!href) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('link')
    el.rel = 'canonical'
    document.head.appendChild(el)
  }
  el.href = href
}

/**
 * Keeps title, description, canonical, robots and social tags in step with the route
 * and language. index.html carries the same tags statically for crawlers that don't run JS.
 */
export function applyHead(route: RouteLocationNormalizedLoaded) {
  const t = i18n.global.t
  const { title, description, index } = route.meta
  const pageTitle = `${t(title)} · ${SITE_NAME}`
  const desc = t(description)
  const url = SITE_URL + route.path

  document.title = pageTitle
  setMeta('name', 'description', desc)
  setMeta('name', 'robots', index ? 'index, follow' : 'noindex, follow')
  setCanonical(index ? url : null)
  setMeta('property', 'og:title', t(title))
  setMeta('property', 'og:description', desc)
  setMeta('property', 'og:url', index ? url : SITE_URL + '/')
  setMeta('name', 'twitter:title', t(title))
  setMeta('name', 'twitter:description', desc)
}
