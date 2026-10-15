export type ProfileQuery = { kind: 'steamid'; value: string } | { kind: 'vanity'; value: string }

const STEAMID64 = /^7656\d{13}$/
const VANITY = /^[A-Za-z0-9_-]{2,32}$/

/**
 * Accepts what people paste: a full profile URL (/id/ or /profiles/),
 * a SteamID64 or a custom URL name. Returns null when it can't be any of them.
 */
export function parseProfileInput(raw: string): ProfileQuery | null {
  const s = raw.trim()
  if (!s) return null

  const byId = s.match(/steamcommunity\.com\/profiles\/(\d+)/i)
  if (byId) return STEAMID64.test(byId[1]!) ? { kind: 'steamid', value: byId[1]! } : null

  const byName = s.match(/steamcommunity\.com\/id\/([^/?#\s]+)/i)
  if (byName) {
    const name = decodeURIComponent(byName[1]!)
    return VANITY.test(name) ? { kind: 'vanity', value: name } : null
  }

  if (STEAMID64.test(s)) return { kind: 'steamid', value: s }
  if (VANITY.test(s)) return { kind: 'vanity', value: s }
  return null
}
