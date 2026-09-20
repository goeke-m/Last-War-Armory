import { describe, it, expect } from 'vitest'
import { buildDesign, fitPowerModel } from './fit.js'

// Fake stats: attack scales with level; hp depends on slot; boostHp and boostDefense always equal.
const fakeStats = (slot, level, stars) => {
  if (level === 99) return null
  return {
    heroAttack: 100 + level * 10 + stars * 500,
    heroHp: slot === 'armor' ? 1000 + level * 100 : 200 + level * 5,
    boostHp: 0.01 * (stars + 1),
    boostDefense: 0.01 * (stars + 1),
  }
}
const SLOTS = ['gun', 'chip', 'armor', 'radar']
const truth = { heroAttack: 3, heroHp: 0.4, boostHp: 50000 }

function makeLineup(id, seed, border = 'orange', level = null) {
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    slot: SLOTS[i % 4],
    level: level ?? ((seed * 7 + i * 3) % 41),
    stars: (seed + i) % 6,
    border,
  }))
  const power = pieces.reduce((sum, p) => {
    const s = fakeStats(p.slot, p.level, p.stars)
    return sum + (s ? s.heroAttack * truth.heroAttack + s.heroHp * truth.heroHp + s.boostHp * truth.boostHp : 0)
  }, 0)
  return { id, power, pieces }
}

describe('buildDesign', () => {
  it('drops lineups with the wrong border or with a piece that has no stats', () => {
    const wrongBorder = makeLineup('red', 1, 'red')
    const noStats = { ...makeLineup('nostats', 2, 'orange', 99), power: 1 }
    const ok = makeLineup('ok', 3)
    const d = buildDesign([wrongBorder, noStats, ok], fakeStats, 'orange')
    expect(d.ids).toEqual(['ok'])
    expect(d.dropped.map(x => x.id).sort()).toEqual(['nostats', 'red'])
  })
  it('throws when a lineup does not have 20 pieces or has no power', () => {
    const bad = { id: 'x', power: 5, pieces: [] }
    expect(() => buildDesign([bad], fakeStats, 'orange')).toThrow(/20 pieces/)
    const noPower = { ...makeLineup('p', 1), power: 0 }
    expect(() => buildDesign([noPower], fakeStats, 'orange')).toThrow(/power/)
  })
  it('throws on bad power even if the lineup also has missing stats', () => {
    const badPowerAndNoStats = { ...makeLineup('bad', 1, 'orange', 99), power: 0 }
    expect(() => buildDesign([badPowerAndNoStats], fakeStats, 'orange')).toThrow(/power/)
  })
})

describe('fitPowerModel', () => {
  const lineups = Array.from({ length: 24 }, (_, i) => makeLineup(`l${i}`, i))

  it('recovers known weights, merging the proportional boostHp/boostDefense columns', () => {
    const fit = fitPowerModel(buildDesign(lineups, fakeStats, 'orange'))
    expect(fit.ok).toBe(true)
    expect(fit.weights.heroAttack).toBeCloseTo(3, 3)
    expect(fit.weights.heroHp).toBeCloseTo(0.4, 3)
    expect(fit.weights.boostHp).toBeCloseTo(50000, 0)
    expect(fit.merged).toEqual({ boostDefense: 'boostHp' })
    expect(fit.weights.boostDefense).toBe(0)
    expect(fit.maxResidualPct).toBeLessThan(1e-6)
  })

  it('fails the quality gate on noisy data and does not report ok', () => {
    const noisy = lineups.map((l, i) => ({ ...l, power: l.power * (i % 2 ? 1.2 : 0.8) }))
    const fit = fitPowerModel(buildDesign(noisy, fakeStats, 'orange'))
    expect(fit.ok).toBe(false)
    expect(fit.reason).toMatch(/residual/i)
  })

  it('refuses an underdetermined fit', () => {
    const few = lineups.slice(0, 3)
    const fit = fitPowerModel(buildDesign(few, fakeStats, 'orange'))
    expect(fit.ok).toBe(false)
    expect(fit.reason).toMatch(/underdetermined/i)
  })
})
