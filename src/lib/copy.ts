import type { VerdictKey } from '../../shared/verdict'

export const VERDICT_COPY: Record<VerdictKey, { headline: string; sub: (borkedPct: number) => string }> = {
  optional: {
    headline: 'Windows is optional.',
    sub: () => 'Nearly everything you play runs on Linux. The holdouts are few.',
  },
  mostly: {
    headline: 'Mostly ready.',
    sub: (b) => `But ${b}% is borked. Keep a Windows partition, or say goodbye to those.`,
  },
  dualboot: {
    headline: 'Dual-boot territory.',
    sub: () => 'Linux for most things, Windows on the side for the rest.',
  },
  needed: {
    headline: 'You still need Windows.',
    sub: () => "Too much of your library doesn't run yet. Check back in a year.",
  },
  empty: {
    headline: 'Nothing to count.',
    sub: () => 'Switch to counting by games instead.',
  },
}

export const VERDICT_RULES: { key: Exclude<VerdictKey, 'empty'>; rule: string }[] = [
  { key: 'optional', rule: '70% or more runs well, and under 10% is borked.' },
  { key: 'mostly', rule: '70% or more runs well, but 10% or more is borked. Usually one big anti-cheat game.' },
  { key: 'dualboot', rule: '40–69% runs well. Linux for most things, Windows on the side.' },
  { key: 'needed', rule: 'Under 40% runs well. Check back in a year.' },
]
