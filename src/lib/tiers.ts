import type { AntiCheatInfo, DeckStatus, Tier } from '../../shared/types'
import { BLOCKING_ANTICHEAT } from '../../shared/types'

export const TIER_META: Record<Tier, { label: string; color: string; ink: string; meaning: string }> = {
  native: { label: 'Native', color: '#6FE3A6', ink: '#0D1014', meaning: 'Has a Linux version. No Proton needed.' },
  platinum: { label: 'Platinum', color: '#D5DEE8', ink: '#0D1014', meaning: 'Runs perfectly out of the box.' },
  gold: { label: 'Gold', color: '#E9B949', ink: '#0D1014', meaning: 'Runs perfectly after a tweak or two.' },
  silver: { label: 'Silver', color: '#8A97A6', ink: '#0D1014', meaning: 'Playable, with minor issues.' },
  bronze: { label: 'Bronze', color: '#B4723A', ink: '#0D1014', meaning: 'Runs, but crashes or issues get in the way.' },
  borked: {
    label: 'Borked',
    color: '#F0555B',
    ink: '#0D1014',
    meaning: 'Will not start, is unplayable, or its anti-cheat blocks Linux.',
  },
  pending: { label: 'Pending', color: '#3A4250', ink: '#E9EDF2', meaning: 'Not enough reports yet to say.' },
}

export const DECK_LABEL: Record<DeckStatus, string> = {
  verified: 'Verified',
  playable: 'Playable',
  unsupported: 'Unsupported',
  unknown: 'Unknown',
}

export function isBlocking(ac: AntiCheatInfo | null | undefined): boolean {
  return !!ac && BLOCKING_ANTICHEAT.includes(ac.status)
}

export function antiCheatLabel(ac: AntiCheatInfo | null | undefined): string | null {
  if (!ac) return null
  const name = ac.anticheats.join(', ') || 'Anti-cheat'
  switch (ac.status) {
    case 'denied':
    case 'broken':
      return `${name} blocks Linux`
    case 'planned':
      return `${name}: Linux support planned`
    default:
      return `${name}: works on Linux`
  }
}

export function formatHours(minutes: number): string {
  if (minutes === 0) return '0 h'
  if (minutes < 60) return '<1 h'
  return `${Math.round(minutes / 60).toLocaleString('en')} h`
}
