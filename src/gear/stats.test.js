import { describe, it, expect } from 'vitest'
import { getStats } from './stats.js'

describe('getStats', () => {
  it('returns real stats for a known (slot, level, stars, sub)', () => {
    expect(getStats('armor', 0, 0).heroHp).toBe(31355)
    expect(getStats('armor', 40, 5, 4).heroHp).toBe(502245)
  })
  it('keys level-40 rows by sub step: 0★ as recorded is sub 0, 1★-5★ are the top of the tier (sub 4)', () => {
    expect(getStats('gun', 40, 0, 0).heroAttack).toBe(3187)
    expect(getStats('gun', 40, 0, 2)).toBeNull()
    expect(getStats('armor', 40, 2, 4).heroDefense).toBe(412)
    expect(getStats('armor', 40, 2, 1)).toBeNull()
  })
  it('returns null for unknown combinations', () => {
    expect(getStats('armor', 40, 1, 4)).toBeNull()
    expect(getStats('armor', 15, 3)).toBeNull()
    expect(getStats('helmet', 0, 0)).toBeNull()
  })
})
