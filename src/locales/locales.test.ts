import { describe, expect, it } from 'vitest'
import en from './en'
import es from './es'
import hi from './hi'
import sv from './sv'
import zh from './zh'

type Tree = Record<string, unknown> | unknown[]

/** Every leaf path plus the placeholders used in it, e.g. "results.games:{n}". */
function shape(node: unknown, path = ''): string[] {
  if (typeof node === 'string') {
    const vars = [...new Set(node.match(/\{\w+\}/g) ?? [])].sort().join('')
    return [`${path}:${vars}`]
  }
  return Object.entries(node as Tree).flatMap(([k, v]) => shape(v, path ? `${path}.${k}` : k))
}

const reference = shape(en)

describe.each([
  ['sv', sv],
  ['es', es],
  ['zh', zh],
  ['hi', hi],
])('%s', (_, messages) => {
  it('has every English key with the same placeholders', () => {
    expect(shape(messages)).toEqual(reference)
  })

  it('avoids characters vue-i18n treats as syntax', () => {
    for (const leaf of shape(messages)) expect(leaf).not.toMatch(/@/)
  })
})
