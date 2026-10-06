import { describe, it, expect } from 'vitest'
import { getStats } from './stats.js'

describe('getStats', () => {
  it('returns real stats for a known (slot, level, stars)', () => {
    expect(getStats('armor', 0, 0).heroHp).toBe(31355)
    expect(getStats('armor', 40, 5).heroHp).toBe(502245)
  })
  it('treats a level-40 row as the top of its tier (sub 4) and keys sub 0-3 separately', () => {
    expect(getStats('armor', 40, 2, 4)).toEqual(getStats('armor', 40, 2))
    expect(getStats('armor', 40, 2, 1)).toBeNull()
  })
  it('returns null for unknown combinations', () => {
    expect(getStats('armor', 40, 1)).toBeNull()
    expect(getStats('armor', 15, 3)).toBeNull()
    expect(getStats('helmet', 0, 0)).toBeNull()
  })
})
