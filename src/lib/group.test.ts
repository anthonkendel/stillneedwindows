import { describe, expect, it } from 'vitest'
import { NEAR_MISS_LIMIT, overlap } from './group'

const lib = (steamid: string, ids: number[]) => ({
  steamid,
  games: ids.map((appid) => ({ appid, name: `G${appid}`, minutes: appid })),
})

describe('overlap', () => {
  it('finds games everyone owns, most played first', () => {
    const { shared } = overlap([lib('a', [1, 2, 3]), lib('b', [2, 3, 4]), lib('c', [3, 2])])
    expect(shared.map((g) => g.appid)).toEqual([3, 2])
    expect(shared[0]!.minutes).toBe(9)
  })

  it('lists games only one member is missing, and who', () => {
    const { nearMiss } = overlap([lib('a', [1, 2]), lib('b', [1, 2]), lib('c', [1])])
    expect(nearMiss).toEqual([{ appid: 2, name: 'G2', minutes: 4, missing: ['c'] }])
  })

  it('caps near misses so big libraries stay cheap to check', () => {
    const many = Array.from({ length: 200 }, (_, i) => i + 1)
    expect(overlap([lib('a', many), lib('b', [])]).nearMiss).toHaveLength(NEAR_MISS_LIMIT)
  })
})
