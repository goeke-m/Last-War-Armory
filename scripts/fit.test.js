import { describe, it, expect } from 'vitest'
import { buildDesign, fitPowerModel, fitSpecials } from './fit.js'

// Fake stats: attack scales with level and sub step; hp depends on slot; boostHp and boostDefense always equal.
const fakeStats = (slot, level, stars, sub = 4) => {
  if (level === 99) return null
  return {
    heroAttack: 100 + level * 10 + stars * 500 + sub * 20,
    heroHp: slot === 'armor' ? 1000 + level * 100 : 200 + level * 5,
    boostHp: 0.01 * (stars + 1),
    boostDefense: 0.01 * (stars + 1),
  }
}
const SLOTS = ['gun', 'chip', 'armor', 'radar']
const truth = { heroAttack: 3, heroHp: 0.4, boostHp: 50000 }

function makeLineup(id, seed, level = null) {
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    slot: SLOTS[i % 4],
    level: level ?? ((seed * 7 + i * 3) % 41),
    stars: (seed + i) % 5,
    sub: 4,
  }))
  const power = pieces.reduce((sum, p) => {
    const s = fakeStats(p.slot, p.level, p.stars)
    return sum + (s ? s.heroAttack * truth.heroAttack + s.heroHp * truth.heroHp + s.boostHp * truth.boostHp : 0)
  }, 0)
  return { id, power, pieces }
}

const weigh = s => s.heroAttack * truth.heroAttack + s.heroHp * truth.heroHp + s.boostHp * truth.boostHp

describe('buildDesign', () => {
  it('drops lineups with a level-40 piece whose sub step is unknown (battle reports show stars only)', () => {
    const l = makeLineup('nosub', 1, 40)
    l.pieces[3] = { slot: l.pieces[3].slot, level: 40, stars: 2 }
    const d = buildDesign([l, makeLineup('ok', 3)], fakeStats)
    expect(d.ids).toEqual(['ok'])
    expect(d.dropped).toEqual([{ id: 'nosub', reason: expect.stringMatching(/sub/) }])
  })
  it('does not need a sub step below level 40', () => {
    const l = makeLineup('low', 1, 12)
    l.pieces.forEach(p => delete p.sub)
    expect(buildDesign([l], fakeStats).ids).toEqual(['low'])
  })
  it('turns a power check into a stat-delta row against the power delta', () => {
    const check = { id: 'c1', slot: 'gun', from: { level: 40, stars: 2, sub: 1 }, to: { level: 40, stars: 2, sub: 2 }, powerBefore: 1000, powerAfter: 1060 }
    const d = buildDesign([], fakeStats, { checks: [check] })
    expect(d.ids).toEqual(['c1'])
    expect(d.y).toEqual([60])
    expect(d.rows[0][0]).toBe(20) // heroAttack column: one sub step
  })
  it('drops a power check whose states have no stats, and throws on a missing or non-positive power delta', () => {
    const base = { slot: 'gun', from: { level: 98, stars: 0 }, to: { level: 99, stars: 0 }, powerBefore: 1, powerAfter: 2 }
    expect(buildDesign([], fakeStats, { checks: [{ ...base, id: 'x' }] }).dropped.map(d => d.id)).toEqual(['x'])
    expect(() => buildDesign([], fakeStats, { checks: [{ ...base, id: 'y', powerAfter: 1 }] })).toThrow(/power/)
    expect(() => buildDesign([], fakeStats, { checks: [{ ...base, id: 'z', powerAfter: undefined }] })).toThrow(/power/)
  })
  it("turns a piece's own Power (Gear Details screen) into a single-piece row", () => {
    const piece = { id: 'p1', slot: 'gun', level: 40, stars: 2, sub: 4, power: 5000 }
    const d = buildDesign([], fakeStats, { pieces: [piece] })
    expect(d.ids).toEqual(['p1'])
    expect(d.y).toEqual([5000])
    expect(d.rows[0][0]).toBe(fakeStats('gun', 40, 2, 4).heroAttack)
    expect(() => buildDesign([], fakeStats, { pieces: [{ ...piece, power: 0 }] })).toThrow(/power/)
  })
  it("uses a piece's own recorded stats (read off its Gear Details screen) over the stat table", () => {
    const piece = { id: 'p2', slot: 'gun', level: 40, stars: 2, sub: 4, power: 5000, stats: { heroAttack: 1234, heroHp: 7 } }
    const d = buildDesign([], fakeStats, { pieces: [piece] })
    expect(d.rows[0][0]).toBe(1234)
    expect(d.rows[0][3]).toBe(7)
  })
  it('drops any row with a 5★ piece: its special attribute adds Power the stats do not model', () => {
    const piece = { id: 'p5', slot: 'gun', level: 40, stars: 5, sub: 4, power: 5000 }
    expect(buildDesign([], fakeStats, { pieces: [piece] }).dropped).toEqual([{ id: 'p5', reason: expect.stringMatching(/5★/) }])
  })

  it('drops lineups with a piece that has no stats', () => {
    const noStats = { ...makeLineup('nostats', 2, 99), power: 1 }
    const ok = makeLineup('ok', 3)
    const d = buildDesign([noStats, ok], fakeStats)
    expect(d.ids).toEqual(['ok'])
    expect(d.dropped.map(x => x.id)).toEqual(['nostats'])
  })
  it('throws when a lineup does not have 20 pieces or has no power', () => {
    const bad = { id: 'x', power: 5, pieces: [] }
    expect(() => buildDesign([bad], fakeStats)).toThrow(/20 pieces/)
    const noPower = { ...makeLineup('p', 1), power: 0 }
    expect(() => buildDesign([noPower], fakeStats)).toThrow(/power/)
  })
  it('throws on bad power even if the lineup also has missing stats', () => {
    const badPowerAndNoStats = { ...makeLineup('bad', 1, 99), power: 0 }
    expect(() => buildDesign([badPowerAndNoStats], fakeStats)).toThrow(/power/)
  })
})

describe('fitPowerModel', () => {
  const lineups = Array.from({ length: 24 }, (_, i) => makeLineup(`l${i}`, i))

  it('recovers known weights, merging the proportional boostHp/boostDefense columns', () => {
    const fit = fitPowerModel(buildDesign(lineups, fakeStats))
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
    const fit = fitPowerModel(buildDesign(noisy, fakeStats))
    expect(fit.ok).toBe(false)
    expect(fit.reason).toMatch(/residual/i)
  })

  it('fits power checks and lineups together', () => {
    // Four kinds of step with different stat deltas: a sub-upgrade, armor and gun level-ups, a promotion.
    const steps = [
      ['armor', { level: 40, stars: 1, sub: 2 }, { level: 40, stars: 1, sub: 3 }],
      ['armor', { level: 20, stars: 0 }, { level: 21, stars: 0 }],
      ['gun', { level: 20, stars: 0 }, { level: 21, stars: 0 }],
      ['gun', { level: 40, stars: 1, sub: 4 }, { level: 40, stars: 2, sub: 0 }],
    ]
    const checks = steps.map(([slot, from, to], i) => {
      const delta = weigh(fakeStats(slot, to.level, to.stars, to.sub)) - weigh(fakeStats(slot, from.level, from.stars, from.sub))
      return { id: `c${i}`, slot, from, to, powerBefore: 5000, powerAfter: 5000 + delta }
    })
    expect(fitPowerModel(buildDesign(lineups.slice(0, 3), fakeStats)).ok).toBe(false)
    const fit = fitPowerModel(buildDesign(lineups.slice(0, 3), fakeStats, { checks }))
    expect(fit.residuals).toHaveLength(7)
    expect(fit.ok).toBe(true)
    expect(fit.weights.heroAttack).toBeCloseTo(3, 3)
  })

  it('counts only distinct rows toward the minimum, so repeated identical pieces do not fake coverage', () => {
    const d = buildDesign(lineups.slice(0, 2), fakeStats)
    const repeated = { rows: [...d.rows, ...d.rows, ...d.rows, ...d.rows], y: [...d.y, ...d.y, ...d.y, ...d.y], ids: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] }
    const fit = fitPowerModel(repeated)
    expect(fit.ok).toBe(false)
    expect(fit.reason).toMatch(/underdetermined: 2 distinct/)
  })

  it('refuses an underdetermined fit', () => {
    const few = lineups.slice(0, 3)
    const fit = fitPowerModel(buildDesign(few, fakeStats))
    expect(fit.ok).toBe(false)
    expect(fit.reason).toMatch(/underdetermined/i)
  })
})

describe('fitSpecials', () => {
  const weights = { heroAttack: 2 }
  const five = (id, slot, power) => ({ id, slot, level: 40, stars: 5, sub: 4, power, stats: { heroAttack: 100 } })

  it("is each slot's 5★ Power above what its stats predict, when every observation agrees", () => {
    const r = fitSpecials([five('a', 'gun', 1200), five('b', 'gun', 1200), five('c', 'armor', 700)], weights)
    expect(r.specials).toEqual({ gun: 1000, armor: 500 })
    expect(r.rejected).toEqual([])
  })
  it('rejects a slot whose observations disagree by more than 1%', () => {
    const r = fitSpecials([five('a', 'gun', 1200), five('b', 'gun', 1500)], weights)
    expect(r.specials).toEqual({})
    expect(r.rejected).toEqual([{ slot: 'gun', reason: expect.stringMatching(/disagree/) }])
  })
  it('ignores pieces below 5★', () => {
    expect(fitSpecials([{ ...five('a', 'gun', 1200), stars: 4 }], weights).specials).toEqual({})
  })
})
