import { describe, it, expect } from 'vitest'
import { stateStats, piecePowerOf, nextStep, stepCost, roiOf, rankUpgrades, coverage } from './roi.js'
import { stateKey } from './state.js'

// Fixture gun: attack 10/level (+100 from level 10, an extra attribute); at level 40 each star adds
// 1000 and each sub step 100. 2★ has only its top (sub 4) recorded, so its sub steps are unknown.
const ROWS = {}
for (let l = 0; l < 40; l++) ROWS[stateKey(l, 0)] = { heroAttack: l * 10 + (l >= 10 ? 100 : 0) }
for (const [s, subs] of [[0, [0, 4]], [1, [0, 1, 2, 3, 4]], [2, [4]], [3, [0, 4]], [4, [4]], [5, [0]]]) {
  for (const k of subs) ROWS[stateKey(40, s, k)] = { heroAttack: 500 + s * 1000 + k * 100 }
}
const getStats = (slot, level, stars, sub) => (slot === 'gun' ? ROWS[stateKey(level, stars, sub)] ?? null : null)
const costs = {
  resources: ['gold', 'ore', 'blueprints'],
  level: { gold: Object.fromEntries(Array.from({ length: 40 }, (_, i) => [i + 1, 10])) },
  stars: { gold: { 1: 400, 2: 400, 3: 400, 4: 400, 5: 400 }, ore: { 1: 50, 2: 50, 3: 50, 4: 50, 5: 50 }, blueprints: { 1: 5, 2: 5, 3: 5, 4: 5, 5: 5 } },
  stepSplit: {
    gold: { sub: 0.25, promotion: 0 },
    ore: { sub: 0.2, promotion: 0.2 },
    blueprints: { sub: 0, promotion: 1 },
  },
}
const deps = { getStats, weights: { heroAttack: 1 }, specials: { gun: 7000 }, costs }
const gun = (level, stars = 0, sub, quality = 'legendary') => ({ slot: 'gun', quality, level, stars, ...(sub === undefined ? {} : { sub }) })

describe('stateStats', () => {
  it('reads recorded rows and fills sub 1-3 linearly between sub 0 and sub 4', () => {
    expect(stateStats(gun(12), deps)).toEqual({ heroAttack: 220 })
    expect(stateStats(gun(40, 0, 2), deps)).toEqual({ heroAttack: 700 })
    expect(stateStats(gun(40, 3, 1), deps)).toEqual({ heroAttack: 3600 })
  })
  it('is null without the sub step at level 40, without both tier ends, or for non-legendary gear', () => {
    expect(stateStats(gun(40, 0), deps)).toBeNull()
    expect(stateStats(gun(40, 2, 1), deps)).toBeNull()
    expect(stateStats(gun(12, 0, undefined, 'epic'), deps)).toBeNull()
  })
})

describe('piecePowerOf', () => {
  it("adds the slot's 5★ special attribute, and is null when it is unknown", () => {
    expect(piecePowerOf(gun(40, 5, 0), deps)).toBe(5500 + 7000)
    // 5★ has no sub-upgrades, so a stale sub on a 5★ piece is ignored
    expect(piecePowerOf(gun(40, 5, 4), deps)).toBe(5500 + 7000)
    expect(piecePowerOf({ ...gun(40, 5, 4), slot: 'chip' }, { ...deps, getStats: () => ({ heroAttack: 1 }) })).toBeNull()
  })
})

describe('nextStep', () => {
  it('levels up below max level, then sub-upgrades, then promotes from sub 4', () => {
    expect(nextStep(gun(12))).toEqual({ type: 'level', from: 12, to: 13 })
    expect(nextStep(gun(40, 1, 2))).toEqual({ type: 'sub', from: 2, to: 3 })
    expect(nextStep(gun(40, 1, 4))).toEqual({ type: 'stars', from: 1, to: 2 })
  })
  it('has no step at 5★, and an unknown one when a level-40 piece has no sub step', () => {
    expect(nextStep(gun(40, 5, 4))).toBeNull()
    expect(nextStep(gun(40, 1))).toEqual({ type: 'sub', from: null, to: null })
  })
})

describe('stepCost', () => {
  it('reads level costs and splits star totals per step: sub-upgrades of tier s and the promotion into s+1', () => {
    expect(stepCost(gun(12), { type: 'level', from: 12, to: 13 }, 'gold', deps)).toBe(10)
    expect(stepCost(gun(40, 1, 2), { type: 'sub', from: 2, to: 3 }, 'gold', deps)).toBe(100)
    expect(stepCost(gun(40, 1, 2), { type: 'sub', from: 2, to: 3 }, 'ore', deps)).toBe(10)
    expect(stepCost(gun(40, 1, 4), { type: 'stars', from: 1, to: 2 }, 'gold', deps)).toBe(0)
    expect(stepCost(gun(40, 1, 4), { type: 'stars', from: 1, to: 2 }, 'blueprints', deps)).toBe(5)
  })
  it('is 0 for a resource the step does not use, null when the step is missing from a table', () => {
    expect(stepCost(gun(12), { type: 'level', from: 12, to: 13 }, 'blueprints', deps)).toBe(0)
    const gappy = { ...costs, level: { gold: { 1: 10 } } }
    expect(stepCost(gun(12), { type: 'level', from: 12, to: 13 }, 'gold', { ...deps, costs: gappy })).toBeNull()
  })
})

describe('roiOf', () => {
  it('divides gain by cost and refuses null or zero inputs', () => {
    expect(roiOf(110, 10)).toBe(11)
    expect(roiOf(null, 10)).toBeNull()
    expect(roiOf(110, null)).toBeNull()
    expect(roiOf(110, 0)).toBeNull()
  })
})

describe('rankUpgrades', () => {
  const slots = piece => ({ gun: piece, chip: null, armor: null, radar: null })

  it('ranks by Power per unit of the chosen resource; the milestone step (9→10) beats a smooth one', () => {
    const list = rankUpgrades({ h1: slots(gun(9)), h2: slots(gun(12)) }, 'gold', deps)
    expect(list.map(i => [i.heroId, i.from, i.to, i.roi])).toEqual([['h1', 9, 10, 11], ['h2', 12, 13, 1]])
    expect(list[0]).toMatchObject({ type: 'level', powerGain: 110, cost: 10, resource: 'gold' })
  })

  it('puts items without an ROI last and keeps them, with a reason', () => {
    const list = rankUpgrades({ h1: slots(gun(9)), h2: slots(gun(40, 1)), h3: slots(gun(40, 2, 1)) }, 'gold', deps)
    expect(list[0].heroId).toBe('h1')
    expect(list.slice(1).every(i => i.roi === null)).toBe(true)
    expect(list.find(i => i.heroId === 'h2').reason).toMatch(/sub-upgrade step/)
  })

  it('ranks the promotion to 5★ onto the 5★ row, which has no sub-upgrades', () => {
    const [promo] = rankUpgrades({ h: slots(gun(40, 4, 4)) }, 'blueprints', deps)
    expect(promo).toMatchObject({ type: 'stars', from: 4, to: 5, powerGain: 5500 + 7000 - 4900, cost: 5 })
  })

  it('ranks a promotion by blueprints and flags it', () => {
    const [item] = rankUpgrades({ h: slots(gun(40, 3, 4)) }, 'blueprints', deps)
    expect(item).toMatchObject({ type: 'stars', from: 3, to: 4, blueprintWarning: true })
    expect(item.roi).toBeNull() // 4★ sub 0 is not recorded in the fixture
    const [promo] = rankUpgrades({ h: slots(gun(40, 0, 4)) }, 'blueprints', deps)
    expect(promo).toMatchObject({ type: 'stars', from: 0, to: 1, powerGain: 600, cost: 5, roi: 120 })
  })

  it('offers nothing for a 5★ piece', () => {
    expect(rankUpgrades({ h: slots(gun(40, 5, 4)) }, 'gold', deps)).toEqual([])
  })
})

describe('coverage', () => {
  it("counts pieces whose current state's Power is known", () => {
    const gear = [gun(9), gun(40, 1, 2), gun(40, 1), gun(9, 0, undefined, 'epic')]
    expect(coverage(gear, deps)).toEqual({ covered: 2, total: 4 })
  })
})
