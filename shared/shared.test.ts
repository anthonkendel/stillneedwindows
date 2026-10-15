import { describe, expect, it } from 'vitest'
import { parseProfileInput } from './profileInput.js'
import { roundToHundred, summarize, verdictFor } from './verdict.js'
import { effectiveTier, type Tier } from './types.js'

describe('parseProfileInput', () => {
  it('reads /id/ and /profiles/ URLs', () => {
    expect(parseProfileInput('https://steamcommunity.com/id/gaben/')).toEqual({ kind: 'vanity', value: 'gaben' })
    expect(parseProfileInput('steamcommunity.com/profiles/76561197960287930?l=sv')).toEqual({
      kind: 'steamid',
      value: '76561197960287930',
    })
  })
  it('reads bare ids and names', () => {
    expect(parseProfileInput(' 76561197960287930 ')).toEqual({ kind: 'steamid', value: '76561197960287930' })
    expect(parseProfileInput('some_name-1')).toEqual({ kind: 'vanity', value: 'some_name-1' })
  })
  it('rejects junk', () => {
    expect(parseProfileInput('')).toBeNull()
    expect(parseProfileInput('my display name')).toBeNull()
    expect(parseProfileInput('steamcommunity.com/profiles/123')).toBeNull()
  })
})

describe('effectiveTier', () => {
  it('prefers native, then blocking anti-cheat, then ProtonDB', () => {
    const ac = { status: 'denied' as const, anticheats: ['X'] }
    expect(effectiveTier({ native: true, protonTier: 'borked', antiCheat: ac })).toBe('native')
    expect(effectiveTier({ native: false, protonTier: 'platinum', antiCheat: ac })).toBe('borked')
    expect(effectiveTier({ native: false, protonTier: 'gold', antiCheat: null })).toBe('gold')
    expect(effectiveTier({ native: false, protonTier: null, antiCheat: null })).toBe('pending')
  })
})

describe('verdict', () => {
  it('follows the published thresholds', () => {
    expect(verdictFor(0.73, 0.04)).toBe('optional')
    expect(verdictFor(0.76, 0.15)).toBe('mostly')
    expect(verdictFor(0.5, 0.2)).toBe('dualboot')
    expect(verdictFor(0.39, 0.3)).toBe('needed')
  })

  it('rounds slices to exactly 100', () => {
    expect(roundToHundred([1, 1, 1]).reduce((a, b) => a + b)).toBe(100)
    expect(roundToHundred([0, 0])).toEqual([0, 0])
  })

  it('summarizes by games and by hours', () => {
    const g = (tier: Tier, minutes: number) => ({ tier, minutes })
    const lib = [g('native', 60), g('platinum', 600), g('borked', 6000), g('pending', 0)]
    const byGames = summarize(lib, 'games')
    expect(byGames.runsWellPct).toBe(50)
    expect(byGames.verdict).toBe('dualboot')
    const byHours = summarize(lib, 'hours')
    expect(byHours.borkedPct).toBe(90)
    expect(byHours.verdict).toBe('needed')
    expect(summarize([], 'games').verdict).toBe('empty')
  })
})
