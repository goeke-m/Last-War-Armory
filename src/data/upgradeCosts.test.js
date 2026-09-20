import { describe, it, expect } from 'vitest'
import COSTS from './upgradeCosts.json'

const allPositive = table => Object.values(table).every(v => Number.isFinite(v) && v > 0)

describe('upgradeCosts.json', () => {
  it('lists its sources and resources', () => {
    expect(COSTS.sources.length).toBeGreaterThanOrEqual(2)
    expect(COSTS.resources.length).toBeGreaterThan(0)
  })
  it('every resource appears in level and/or stars, and no undeclared resource does', () => {
    const used = new Set([...Object.keys(COSTS.level), ...Object.keys(COSTS.stars)])
    expect([...used].sort()).toEqual([...COSTS.resources].sort())
  })
  it('level tables cover steps 1–40 with positive numbers', () => {
    for (const [res, table] of Object.entries(COSTS.level)) {
      expect(Object.keys(table).map(Number).sort((a, b) => a - b), res).toEqual(Array.from({ length: 40 }, (_, i) => i + 1))
      expect(allPositive(table), res).toBe(true)
    }
  })
  it('star tables cover promotions 1–5 with positive numbers', () => {
    for (const [res, table] of Object.entries(COSTS.stars)) {
      expect(Object.keys(table).map(Number).sort((a, b) => a - b), res).toEqual([1, 2, 3, 4, 5])
      expect(allPositive(table), res).toBe(true)
    }
  })
})
