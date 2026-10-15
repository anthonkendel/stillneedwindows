export class UpstreamError extends Error {
  constructor(
    public source: string,
    public status: number,
  ) {
    super(`${source} responded ${status}`)
  }
}

/** fetch + JSON with a timeout. Returns null on 404, throws UpstreamError otherwise. */
export async function getJson(source: string, url: string, timeoutMs = 10_000): Promise<unknown | null> {
  let res: Response
  try {
    res = await fetch(url, {
      headers: { accept: 'application/json', 'user-agent': 'stillneedwindows (+https://stillneedwindows.com)' },
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch {
    throw new UpstreamError(source, 0)
  }
  if (res.status === 404) return null
  if (!res.ok) throw new UpstreamError(source, res.status)
  return res.json()
}
