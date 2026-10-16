import { TIERS, type Tier } from './types.js'

export type Mode = 'games' | 'hours'
export type VerdictKey = 'optional' | 'mostly' | 'dualboot' | 'needed' | 'empty'

export const RUNS_WELL: readonly Tier[] = ['native', 'platinum', 'gold']

export interface TierSlice {
  tier: Tier
  /** Game count, or minutes in hours mode. */
  value: number
  /** Whole-number percentage; slices always add up to 100 (or 0 when empty). */
  pct: number
}

export interface Summary {
  mode: Mode
  total: number
  slices: TierSlice[]
  runsWellPct: number
  borkedPct: number
  verdict: VerdictKey
}

/**
 * Verdict rules (also shown on the How it works page):
 * - optional: 70%+ runs well and under 10% borked
 * - mostly:   70%+ runs well but 10%+ borked
 * - dualboot: 40–69% runs well
 * - needed:   under 40% runs well
 */
export function verdictFor(runsWell: number, borked: number): Exclude<VerdictKey, 'empty'> {
  if (runsWell >= 0.7) return borked < 0.1 ? 'optional' : 'mostly'
  if (runsWell >= 0.4) return 'dualboot'
  return 'needed'
}

export type GroupVerdictKey = 'on' | 'few' | 'none'

/**
 * Group verdict (also shown on the How it works page), from the number of shared
 * games that run well for everyone:
 * - on:   5 or more
 * - few:  1–4
 * - none: 0
 */
export function groupVerdictFor(playable: number): GroupVerdictKey {
  if (playable >= 5) return 'on'
  return playable > 0 ? 'few' : 'none'
}

export function summarize(games: { tier: Tier; minutes: number }[], mode: Mode): Summary {
  const totals = new Map<Tier, number>(TIERS.map((t) => [t, 0]))
  for (const g of games) {
    totals.set(g.tier, totals.get(g.tier)! + (mode === 'games' ? 1 : g.minutes))
  }
  const total = [...totals.values()].reduce((a, b) => a + b, 0)
  const values = TIERS.map((t) => totals.get(t)!)
  const pcts = roundToHundred(values)
  const slices = TIERS.map((tier, i) => ({ tier, value: values[i]!, pct: pcts[i]! }))

  if (total === 0) {
    return { mode, total, slices, runsWellPct: 0, borkedPct: 0, verdict: 'empty' }
  }
  const runsWell = RUNS_WELL.reduce((a, t) => a + totals.get(t)!, 0) / total
  const borked = totals.get('borked')! / total
  return {
    mode,
    total,
    slices,
    runsWellPct: Math.round(runsWell * 100),
    borkedPct: Math.round(borked * 100),
    verdict: verdictFor(runsWell, borked),
  }
}

/** Largest-remainder rounding so whole-number percentages sum to exactly 100. */
export function roundToHundred(values: number[]): number[] {
  const total = values.reduce((a, b) => a + b, 0)
  if (total === 0) return values.map(() => 0)
  const raw = values.map((v) => (v / total) * 100)
  const floored = raw.map(Math.floor)
  let left = 100 - floored.reduce((a, b) => a + b, 0)
  const order = raw.map((r, i) => ({ i, rem: r - Math.floor(r) })).sort((a, b) => b.rem - a.rem)
  for (const { i } of order) {
    if (left <= 0) break
    floored[i]!++
    left--
  }
  return floored
}
