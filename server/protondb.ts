import { z } from 'zod'
import type { ProtonTier } from '../shared/types.js'
import { getJson } from './http.js'

const Summary = z.object({
  tier: z.string(),
  trendingTier: z.string().optional(),
  total: z.number().optional(),
})

const PROTON_TIERS: readonly ProtonTier[] = ['platinum', 'gold', 'silver', 'bronze', 'borked', 'pending']

function asTier(value: string | undefined): ProtonTier | null {
  return PROTON_TIERS.includes(value as ProtonTier) ? (value as ProtonTier) : null
}

/**
 * Pure parser, exported for tests. Prefers the trending tier (recent reports)
 * over the all-time tier, since Proton and games change over time.
 */
export function parseProtonSummary(json: unknown | null): ProtonTier | null {
  if (json === null) return null
  const s = Summary.parse(json)
  return asTier(s.trendingTier) ?? asTier(s.tier)
}

/** null = ProtonDB has no reports for this app. Throws on network/server errors. */
export async function getProtonTier(appid: number): Promise<ProtonTier | null> {
  const json = await getJson('protondb', `https://www.protondb.com/api/v1/reports/summaries/${appid}.json`)
  return parseProtonSummary(json)
}
