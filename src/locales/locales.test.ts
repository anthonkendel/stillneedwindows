import { describe, expect, it } from 'vitest'
import { detectLocale } from '../i18n'
import en from './en'
import sv from './sv'

/** Every leaf path plus the placeholders used in it, e.g. "results.games:{n}". */
function shape(node: unknown, path = ''): string[] {
  if (typeof node === 'string') {
    const vars = [...new Set(node.match(/\{\w+\}/g) ?? [])].sort().join('')
    return [`${path}:${vars}`]
  }
  return Object.entries(node as Record<string, unknown>).flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k))
}

describe('sv', () => {
  it('has every English key with the same placeholders', () => {
    expect(shape(sv)).toEqual(shape(en))
  })
  it('avoids characters vue-i18n treats as syntax', () => {
    for (const leaf of shape(sv)) expect(leaf).not.toMatch(/@/)
  })
})

describe('detectLocale', () => {
  it('follows the browser, falling back to English', () => {
    expect(detectLocale(['sv-SE', 'en'])).toBe('sv')
    expect(detectLocale(['de-DE', 'sv'])).toBe('sv')
    expect(detectLocale(['de-DE', 'fr'])).toBe('en')
    expect(detectLocale([])).toBe('en')
  })
})
