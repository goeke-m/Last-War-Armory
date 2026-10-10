import { describe, it, expect } from 'vitest'
import { progressOf, roleBasedUpgrades, weakestLinkUpgrades } from './modes.js'

const lg = (stars, sub = 0) => ({ quality: 'legendary', level: 40, stars, sub })
const roles = { d: 'dps', t: 'tank', s: 'support' }
const roleOf = id => roles[id]

describe('progressOf', () => {
  it('orders end-game pieces by stars, then sub-upgrade step', () => {
    expect(progressOf(lg(0, 4))).toBeLessThan(progressOf(lg(1, 0)))
    expect(progressOf(lg(2, 1))).toBeGreaterThan(progressOf(lg(2, 0)))
  })
})

describe('roleBasedUpgrades', () => {
  it('finds a DPS Gun that trails its Armor when every piece is Lv 40', () => {
    const list = roleBasedUpgrades({ d: { gun: lg(1, 2), armor: lg(3), chip: lg(1, 2), radar: lg(0) } }, roleOf)
    expect(list).toHaveLength(1)
    expect(list[0]).toMatchObject({ heroId: 'd', slot: 'gun', type: 'sub', from: 2, to: 3 })
  })

  it('flags a DPS Chip behind the Gun, and a tank or support whose lead slot trails', () => {
    const list = roleBasedUpgrades({
      d: { gun: lg(3), armor: lg(3), chip: lg(2, 4) },
      t: { gun: lg(4), armor: lg(2) },
      s: { gun: lg(1), chip: lg(1), armor: lg(1), radar: lg(0, 4) },
    }, roleOf)
    expect(list.map(i => `${i.heroId}.${i.slot}`)).toEqual(['t.armor', 'd.chip', 's.radar'])
    expect(list.find(i => i.slot === 'chip')).toMatchObject({ type: 'stars', to: 3 })
  })

  it('returns nothing when gear already fits each role', () => {
    expect(roleBasedUpgrades({ d: { gun: lg(3), armor: lg(2), chip: lg(3) }, t: { gun: lg(1), armor: lg(2) } }, roleOf)).toEqual([])
  })
})

describe('weakestLinkUpgrades', () => {
  it('lists the least-upgraded pieces first with their real next step, skipping maxed ones', () => {
    const list = weakestLinkUpgrades({ d: { gun: lg(5), armor: lg(1, 3), chip: lg(0, 1) } })
    expect(list.map(i => i.slot)).toEqual(['chip', 'armor'])
    expect(list[0]).toMatchObject({ type: 'sub', from: 1, to: 2 })
    expect(list.some(i => i.type === 'level')).toBe(false)
  })
})
