import { createI18n } from 'vue-i18n'
import en from './locales/en'

export const LOCALES = [
  { code: 'en', name: 'English', htmlLang: 'en' },
  { code: 'sv', name: 'Svenska', htmlLang: 'sv' },
  { code: 'es', name: 'Español', htmlLang: 'es' },
  { code: 'zh', name: '中文（简体）', htmlLang: 'zh-Hans' },
  { code: 'hi', name: 'हिन्दी', htmlLang: 'hi' },
] as const

export type LocaleCode = (typeof LOCALES)[number]['code']

const STORAGE_KEY = 'snw-locale'
const isLocale = (v: unknown): v is LocaleCode => LOCALES.some((l) => l.code === v)

// English ships in the main bundle; the others load on demand.
const loaders: Record<Exclude<LocaleCode, 'en'>, () => Promise<{ default: typeof en }>> = {
  sv: () => import('./locales/sv'),
  es: () => import('./locales/es'),
  zh: () => import('./locales/zh'),
  hi: () => import('./locales/hi'),
}

/** Saved choice first, then the browser's language list, then English. */
export function detectLocale(): LocaleCode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {
    /* storage blocked */
  }
  for (const lang of navigator.languages ?? [navigator.language]) {
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

async function ensureLoaded(code: LocaleCode) {
  if (code === 'en' || i18n.global.availableLocales.includes(code)) return
  const { default: messages } = await loaders[code]()
  i18n.global.setLocaleMessage(code, messages)
}

/** Switches language, loading its messages first. `persist` remembers an explicit choice. */
export async function setLocale(code: LocaleCode, persist = true) {
  try {
    await ensureLoaded(code)
  } catch {
    return // chunk failed to load; stay on the current language
  }
  i18n.global.locale.value = code
  document.documentElement.lang = LOCALES.find((l) => l.code === code)!.htmlLang
  if (!persist) return
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    /* storage blocked */
  }
}
