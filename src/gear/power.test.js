import { describe, it, expect } from 'vitest'
import { STAT_KEYS, piecePower } from './power.js'

describe('piecePower', () => {
  it('sums weight × stat, treating missing values as 0', () => {
    expect(piecePower({ heroAttack: 100, heroHp: 10 }, { heroAttack: 2, heroHp: 0.5, critRate: 99 })).toBe(205)
  })
  it('exposes the ten stat keys', () => {
    expect(STAT_KEYS).toHaveLength(10)
  })
})
