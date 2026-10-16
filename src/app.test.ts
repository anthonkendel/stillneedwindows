// @vitest-environment happy-dom
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import type { FriendsResponse, GameCompat, ProfileResponse, WishlistResponse } from '../shared/types'
import App from './App.vue'
import { LOCALES, i18n, setLocale } from './i18n'
import { router } from './router'

const STEAMID = '76561197960287930'
const FRIEND = '76561197960287931'

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

const friendProfile: ProfileResponse = {
  status: 'ok',
  profile: { steamid: FRIEND, name: 'Buddy', avatar: '', profileUrl: '' },
  playtimeVisible: true,
  games: [
    { appid: 1, name: 'Native Game', minutes: 120 },
    { appid: 2, name: 'Anti-cheat Shooter', minutes: 60 },
    { appid: 5, name: 'Co-op Platinum', minutes: 300 },
  ],
}

const base = { protonTier: null, native: false, deck: 'unknown', antiCheat: null, complete: true } as const
const COMPAT: Record<number, GameCompat> = {
  1: {
    ...base,
    appid: 1,
    name: 'Native Game',
    tier: 'native',
    native: true,
    deck: 'verified',
    comingSoon: false,
    multiplayer: true,
  },
  2: {
    ...base,
    appid: 2,
    name: 'Anti-cheat Shooter',
    tier: 'borked',
    protonTier: 'gold',
    deck: 'unsupported',
    antiCheat: { status: 'denied', anticheats: ['BattlEye'], slug: 'shooter' },
    comingSoon: false,
    multiplayer: true,
  },
  3: {
    ...base,
    appid: 3,
    name: 'Gold Game',
    tier: 'gold',
    protonTier: 'gold',
    deck: 'playable',
    comingSoon: false,
    multiplayer: false,
  },
  4: { ...base, appid: 4, name: 'Mystery Game', tier: 'pending', comingSoon: false, multiplayer: false },
  5: {
    ...base,
    appid: 5,
    name: 'Co-op Platinum',
    tier: 'platinum',
    protonTier: 'platinum',
    comingSoon: false,
    multiplayer: true,
  },
  6: { ...base, appid: 6, name: 'Future Game', tier: 'pending', comingSoon: true, multiplayer: null },
}

const wishlist: WishlistResponse = {
  status: 'ok',
  profile: profile.profile,
  items: [
    { appid: 6, added: 3 },
    { appid: 3, added: 2 },
    { appid: 2, added: 1 },
  ],
}

const friends: FriendsResponse = {
  status: 'ok',
  profile: profile.profile,
  friends: [
    { ...friendProfile.profile, since: 1500000000, isPublic: true },
    { steamid: '76561197960287932', name: 'Lurker', avatar: '', profileUrl: '', since: 0, isPublic: false },
  ],
}

const warnings: string[] = []

beforeAll(() => {
  vi.stubGlobal('fetch', async (input: string) => {
    const url = String(input)
    if (url.includes('/api/profile/private')) {
      return Response.json({
        status: 'private',
        profile: { ...profile.profile, steamid: '76561197960287939', name: 'Hidden' },
      })
    }
    if (url.includes('/api/profile/nobody')) return Response.json({ status: 'not_found' })
    if (url.includes(`/api/profile/${FRIEND}`)) return Response.json(friendProfile)
    if (url.includes('/api/profile/')) return Response.json(profile)
    if (url.includes('/api/wishlist/')) return Response.json(wishlist)
    if (url.includes('/api/friends/')) return Response.json(friends)
    if (url.includes('/api/compat')) {
      const ids = new URL(url, 'http://x').searchParams.get('ids')!.split(',').map(Number)
      return Response.json({ games: ids.map((id) => COMPAT[id]).filter(Boolean) })
    }
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
  const wrapper = mount(App, {
    global: { plugins: [createPinia(), i18n, router], stubs: { Transition: false, TransitionGroup: false } },
    attachTo: document.body,
  })

  async function visit(path: string) {
    await router.push(path)
    await settle()
    return wrapper.text()
  }

  for (const { code } of LOCALES) {
    it(code, async () => {
      await setLocale(code)
      const t = i18n.global.t

      expect(await visit('/')).toContain(t('search.title'))
      expect(document.documentElement.lang).toBeTruthy()
      expect(document.title).toContain(t('meta.search'))

      const results = await visit(`/u/${STEAMID}`)
      expect(results).toContain('Tester')
      expect(results).toContain(t('results.blockersTitle'))
      expect(results).toContain('BattlEye')
      expect(results).toContain(t('compare.title'))
      expect(results).toContain(t('results.byWishlist'))
      expect(await visit(`/u/${STEAMID}?by=hours`)).toContain(t('results.verdictKicker'))
      expect(wrapper.find('a[aria-current="page"][href$="by=hours"]').exists()).toBe(true)

      const wish = await visit(`/u/${STEAMID}/wishlist`)
      expect(wish).toContain(t('wishlistVerdicts.needed.headline'))
      expect(wish).toContain('Future Game')
      expect(wish).toContain(t('wishlist.notOut'))
      expect(wish).toContain(t('compare.title'))

      const picker = await visit(`/u/${STEAMID}/friends`)
      expect(picker).toContain('Buddy')
      expect(picker).toContain(t('friends.privateProfile'))

      const group = await visit(`/u/${STEAMID}/group?with=${FRIEND}`)
      expect(group).toContain(t('group.sharedTitle'))
      expect(group).toContain('Native Game')
      expect(group).toContain(t('group.blockedListTitle'))
      expect(group).toContain('Co-op Platinum') // one purchase away
      expect(group).toContain(t('group.youMissing'))

      expect(await visit(`/u/${STEAMID}/group?with=private`)).toContain(t('group.blockedTitle'))

      const games = await visit(`/u/${STEAMID}/games?tier=borked`)
      expect(games).toContain('Anti-cheat Shooter')
      expect(games).not.toContain('Native Game')
      expect(wrapper.find('a[href="https://areweanticheatyet.com/game/shooter"]').exists()).toBe(true)

      expect(await visit('/how-it-works')).toContain(t('how.faqTitle'))
      expect(await visit('/privacy')).toContain(t('privacy.lead'))
      expect(await visit('/u/private')).toContain(t('private.title'))
      expect(await visit('/u/nobody')).toContain(t('notFound.title'))
      expect(await visit('/no/such/page')).toContain(t('notFoundPage.title'))

      expect(warnings).toEqual([])
    })
  }

  it('passes axe on every screen', async () => {
    const axe = (await import('axe-core')).default
    await setLocale('en')
    for (const path of [
      '/',
      `/u/${STEAMID}`,
      `/u/${STEAMID}/games`,
      `/u/${STEAMID}/wishlist`,
      `/u/${STEAMID}/friends`,
      `/u/${STEAMID}/group?with=${FRIEND}`,
      `/u/${STEAMID}/group?with=private`,
      '/how-it-works',
      '/privacy',
      '/u/private',
      '/u/nobody',
      '/nope',
    ]) {
      await visit(path)
      const result = await axe.run(document.body, {
        // happy-dom can't compute colors; contrast is checked against the palette in README.
        rules: { 'color-contrast': { enabled: false } },
      })
      const issues = result.violations.map(
        (v) => `${path} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
      )
      expect(issues).toEqual([])
    }
  })

  it('sets search-engine tags per page', async () => {
    await setLocale('en')
    const meta = (name: string) => document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)?.content
    const canonical = () => document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href

    await visit('/how-it-works')
    expect(meta('robots')).toBe('index, follow')
    expect(meta('description')).toBe(i18n.global.t('meta.howDesc'))
    expect(canonical()).toBe('https://stillneedwindows.com/how-it-works')

    await visit(`/u/${STEAMID}`)
    expect(meta('robots')).toBe('noindex, follow')
    expect(canonical()).toBeUndefined()

    await setLocale('sv')
    await settle()
    expect(meta('description')).toBe(i18n.global.t('meta.resultsDesc'))
    expect(document.documentElement.lang).toBe('sv')
    await setLocale('en')
  })

  it('remembers the last checked library for this tab', async () => {
    await visit(`/u/${STEAMID}`)
    expect(JSON.parse(sessionStorage.getItem('snw-last-user')!)).toEqual({ steamid: STEAMID, name: 'Tester' })
    await visit('/how-it-works')
    expect(wrapper.find('header a').attributes('href')).toBe(`/u/${STEAMID}`)
    expect(wrapper.text()).toContain(i18n.global.t('common.backToResults'))
  })

  it('keeps the profile row and tabs in place when switching to the wishlist tab', async () => {
    await setLocale('en')
    await visit(`/u/${STEAMID}`)
    const tabs = wrapper.find(`nav[aria-label="${i18n.global.t('results.countBy')}"]`).element
    expect(wrapper.findAll(`nav[aria-label="${i18n.global.t('results.countBy')}"]`)).toHaveLength(1)
    await visit(`/u/${STEAMID}/wishlist`)
    const after = wrapper.findAll(`nav[aria-label="${i18n.global.t('results.countBy')}"]`)
    expect(after).toHaveLength(1)
    expect(after[0]!.element).toBe(tabs) // same node: the frame was not rebuilt
    expect(wrapper.find('a[aria-current="page"]').text()).toBe(i18n.global.t('results.byWishlist'))
  })

  it('canonicalises a custom name to the SteamID64', async () => {
    await visit('/u/somename')
    expect(router.currentRoute.value.params.query).toBe(STEAMID)
  })
})
