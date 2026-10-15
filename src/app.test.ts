// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { CompatResponse, ProfileResponse } from '../shared/types'
import App from './App.vue'
import { LOCALES, i18n, setLocale } from './i18n'
import { router } from './router'

const STEAMID = '76561197960287930'

const profile: ProfileResponse = {
  status: 'ok',
  profile: { steamid: STEAMID, name: 'Tester', avatar: '', profileUrl: '' },
  playtimeVisible: true,
  games: [
    { appid: 1, name: 'Native Game', minutes: 600 },
    { appid: 2, name: 'Anti-cheat Shooter', minutes: 6000 },
    { appid: 3, name: 'Gold Game', minutes: 30 },
    { appid: 4, name: 'Mystery Game', minutes: 0 },
  ],
}

const compat: CompatResponse = {
  games: [
    { appid: 1, tier: 'native', protonTier: null, native: true, deck: 'verified', antiCheat: null, complete: true },
    {
      appid: 2,
      tier: 'borked',
      protonTier: 'gold',
      native: false,
      deck: 'unsupported',
      antiCheat: { status: 'denied', anticheats: ['BattlEye'], slug: 'shooter' },
      complete: true,
    },
    { appid: 3, tier: 'gold', protonTier: 'gold', native: false, deck: 'playable', antiCheat: null, complete: true },
    { appid: 4, tier: 'pending', protonTier: null, native: false, deck: 'unknown', antiCheat: null, complete: true },
  ],
}

const warnings: string[] = []

beforeAll(() => {
  vi.stubGlobal('fetch', async (input: string) => {
    const url = String(input)
    if (url.includes('/api/profile/private')) {
      return Response.json({ status: 'private', profile: { ...profile.profile, name: 'Hidden' } })
    }
    if (url.includes('/api/profile/nobody')) return Response.json({ status: 'not_found' })
    if (url.includes('/api/profile/')) return Response.json(profile)
    if (url.includes('/api/compat')) return Response.json(compat)
    return new Response('', { status: 404 })
  })
  // Fail on any missing translation key or Vue runtime warning.
  vi.spyOn(console, 'warn').mockImplementation((...args) => warnings.push(args.join(' ')))
  vi.spyOn(console, 'error').mockImplementation((...args) => warnings.push(args.join(' ')))
})

afterAll(() => vi.unstubAllGlobals())

async function settle() {
  for (let i = 0; i < 10; i++) await flushPromises()
}

describe('every screen renders in every language', () => {
  const wrapper = mount(App, { global: { plugins: [createPinia(), i18n, router], stubs: { Transition: false, TransitionGroup: false } }, attachTo: document.body })

  async function visit(path: string) {
    await router.push(path)
    await settle()
    return wrapper.text()
  }

  for (const { code } of LOCALES) {
    it(code, async () => {
      await setLocale(code, false)
      const t = i18n.global.t

      expect(await visit('/')).toContain(t('search.title'))
      expect(document.documentElement.lang).toBeTruthy()
      expect(document.title).toContain(t('meta.search'))

      const results = await visit(`/u/${STEAMID}`)
      expect(results).toContain('Tester')
      expect(results).toContain(t('results.blockersTitle'))
      expect(results).toContain('BattlEye')

      const games = await visit(`/u/${STEAMID}/games?tier=borked`)
      expect(games).toContain('Anti-cheat Shooter')
      expect(games).not.toContain('Native Game')
      expect(wrapper.find('a[href="https://areweanticheatyet.com/game/shooter"]').exists()).toBe(true)

      expect(await visit('/how-it-works')).toContain(t('how.faqTitle'))
      expect(await visit('/u/private')).toContain(t('private.title'))
      expect(await visit('/u/nobody')).toContain(t('notFound.title'))
      expect(await visit('/no/such/page')).toContain(t('notFoundPage.title'))

      expect(warnings).toEqual([])
    })
  }

  it('passes axe on every screen', async () => {
    const axe = (await import('axe-core')).default
    await setLocale('en', false)
    for (const path of ['/', `/u/${STEAMID}`, `/u/${STEAMID}/games`, '/how-it-works', '/u/private', '/u/nobody', '/nope']) {
      await visit(path)
      const result = await axe.run(document.body, {
        // happy-dom can't compute colors; contrast is checked against the palette in README.
        rules: { 'color-contrast': { enabled: false } },
      })
      const issues = result.violations.map((v) => `${path} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)
      expect(issues).toEqual([])
    }
  })

  it('remembers the last checked library for this tab', async () => {
    await visit(`/u/${STEAMID}`)
    expect(JSON.parse(sessionStorage.getItem('snw-last-user')!)).toEqual({ steamid: STEAMID, name: 'Tester' })
    await visit('/how-it-works')
    expect(wrapper.find('header a').attributes('href')).toBe(`/u/${STEAMID}`)
    expect(wrapper.text()).toContain(i18n.global.t('common.backToResults'))
  })

  it('canonicalises a custom name to the SteamID64', async () => {
    await visit('/u/somename')
    expect(router.currentRoute.value.params.query).toBe(STEAMID)
  })
})
