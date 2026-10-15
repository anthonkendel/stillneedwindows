import { createI18n } from 'vue-i18n'
import en from './locales/en'

/** The site follows the browser: Swedish if the visitor prefers it, English otherwise. */
export const LOCALES = [
  { code: 'en', name: 'English', htmlLang: 'en', og: 'en_US' },
  { code: 'sv', name: 'Svenska', htmlLang: 'sv', og: 'sv_SE' },
] as const

export type LocaleCode = (typeof LOCALES)[number]['code']

const isLocale = (v: unknown): v is LocaleCode => LOCALES.some((l) => l.code === v)

/** First supported language in the browser's preference list, else English. */
export function detectLocale(languages: readonly string[] = navigator.languages ?? [navigator.language]): LocaleCode {
  for (const lang of languages) {
    const base = lang.toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return 'en'
}

const messages: Record<string, typeof en> = { en }

export const i18n = createI18n({
  legacy: false,
  locale: 'en' as string,
  fallbackLocale: 'en',
  messages,
})

export function currentLocale(): LocaleCode {
  return i18n.global.locale.value as LocaleCode
}

export async function setLocale(code: LocaleCode) {
  if (code === 'sv' && !i18n.global.availableLocales.includes('sv')) {
    try {
      i18n.global.setLocaleMessage('sv', (await import('./locales/sv')).default)
    } catch {
      return // chunk failed to load; stay in English
    }
  }
  i18n.global.locale.value = code
  const meta = LOCALES.find((l) => l.code === code)!
  document.documentElement.lang = meta.htmlLang
  document.querySelector('meta[property="og:locale"]')?.setAttribute('content', meta.og)
}

// Follow the browser if its language preference changes while the page is open.
if (typeof window !== 'undefined') {
  window.addEventListener('languagechange', () => setLocale(detectLocale()))
}
