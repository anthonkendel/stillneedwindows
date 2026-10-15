import type { AntiCheatInfo, DeckStatus, Tier } from '../../shared/types'
import { BLOCKING_ANTICHEAT } from '../../shared/types'
import { currentLocale, i18n } from '../i18n'

/**
 * Tier names stay in English in every language: they are ProtonDB's own labels.
 * Badge text colors are checked for 4.5:1 against their fill.
 */
export const TIER_META: Record<Tier, { label: string; color: string; ink: string }> = {
  native: { label: 'Native', color: '#6FE3A6', ink: '#0D1014' },
  platinum: { label: 'Platinum', color: '#D5DEE8', ink: '#0D1014' },
  gold: { label: 'Gold', color: '#E9B949', ink: '#0D1014' },
  silver: { label: 'Silver', color: '#8A97A6', ink: '#0D1014' },
  bronze: { label: 'Bronze', color: '#B4723A', ink: '#0D1014' },
  borked: { label: 'Borked', color: '#F0555B', ink: '#0D1014' },
  pending: { label: 'Pending', color: '#5E6876', ink: '#E9EDF2' },
}

const t = i18n.global.t

export const deckLabel = (d: DeckStatus) => t(`deck.${d}`)

export function isBlocking(ac: AntiCheatInfo | null | undefined): boolean {
  return !!ac && BLOCKING_ANTICHEAT.includes(ac.status)
}

export function antiCheatLabel(ac: AntiCheatInfo | null | undefined): string | null {
  if (!ac) return null
  const name = ac.anticheats.join(', ') || t('anticheat.generic')
  if (isBlocking(ac)) return t('anticheat.blocks', { name })
  if (ac.status === 'planned') return t('anticheat.planned', { name })
  return t('anticheat.works', { name })
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat(currentLocale()).format(n)
}

export function formatHours(minutes: number): string {
  if (minutes > 0 && minutes < 60) return t('common.underHour')
  return t('common.hours', { n: formatNumber(Math.round(minutes / 60)) })
}
