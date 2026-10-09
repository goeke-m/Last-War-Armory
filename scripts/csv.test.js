import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseGearCsv } from './csv.js'

const HEADER = 'Equipment,Level,Stars,Hero Attack,Crit Rate,Hero Defense,Hero HP,Boost Hero Attack,Boost Hero HP,Boost Hero Defense,Resistance to all Damage Types,Physical Damage Resistance,Energy Damage Resistance,Special Attribute'

const csv = lines => [HEADER, ...lines].join('\r\n')

describe('parseGearCsv', () => {
  it('parses numbers and percentages and maps equipment to slots', () => {
    const { stats } = parseGearCsv(csv([
      'Armor,0,0,,,59,31355,,2.50%,2.50%,,,,',
      'Armor,1,0,,,62,32922,,2.62%,2.62%,,,,',
    ]))
    expect(stats.armor['0:0']).toEqual({ heroDefense: 59, heroHp: 31355, boostHp: 0.025, boostDefense: 0.025 })
    expect(stats.armor['1:0'].boostHp).toBe(0.0262)
  })

  it('treats whitespace-only cells as blank and trims equipment names', () => {
    const { stats } = parseGearCsv(csv(['Armor ,0,0,  ,,59,31355,,,,,,,']))
    expect(stats.armor['0:0']).toEqual({ heroDefense: 59, heroHp: 31355 })
  })

  it('drops rows with no stats and rows missing a primary stat', () => {
    const { stats, dropped } = parseGearCsv(csv([
      'Radar,0,0,,,119,18813,,2.50%,2.50%,,,,',
      'Radar,40,1,,,,,,,,,,,',
      'Radar,40,3,,,,,,14.50%,14.50%,,,30.00%,',
      'Radar,40,5,,,2033,225747,15.00%,,15.00%,,,40.00%,note',
    ]))
    expect(stats.radar['40:1:4']).toBeUndefined()
    expect(stats.radar['40:3:4']).toBeUndefined()
    expect(stats.radar['40:5:0'].heroDefense).toBe(2033)
    expect(dropped.map(d => d.key).sort()).toEqual(['40:1:4', '40:3:4'])
  })

  it('accepts an optional Sub column; a blank Sub at level 40 is sub 0 for 0★ and 5★, sub 4 (top of tier) for 1★-4★', () => {
    const withSub = lines => [HEADER.replace('Stars,', 'Stars,Sub,'), ...lines].join('\r\n')
    const { stats } = parseGearCsv(withSub([
      'Armor,0,0,,,,59,31355,,,,,,,',
      'Armor,40,0,,,,179,136065,,7.50%,7.50%,,20%,,',
      'Armor,40,2,,,,412,300531,,11.50%,11.50%,,30.00%,,',
      'Armor,40,3,0,,,449,361719,,12.00%,12.00%,,30.00%,,',
    ]))
    expect(stats.armor['40:0:0'].heroDefense).toBe(179)
    expect(stats.armor['40:2:4'].heroDefense).toBe(412)
    expect(stats.armor['40:3:0'].heroDefense).toBe(449)
    expect(() => parseGearCsv(withSub([
      'Armor,0,0,,,,59,31355,,,,,,,',
      'Armor,40,2,,,,412,300531,,,,,,,',
      'Armor,40,2,4,,,412,300531,,,,,,,',
    ]))).toThrow(/duplicate/i)
    expect(() => parseGearCsv(withSub(['Armor,0,0,2,,,59,31355,,,,,,,']))).toThrow(/sub/i)
    // 5★ has no sub-upgrades: its row is sub 0, and a Sub of 1-4 is an error
    expect(() => parseGearCsv(withSub(['Armor,0,0,,,,59,31355,,,,,,,', 'Armor,40,5,4,,,716,502245,,,,,,,']))).toThrow(/5★/)
  })

  it('throws on duplicate (slot, level, stars)', () => {
    expect(() => parseGearCsv(csv([
      'Armor,0,0,,,59,31355,,,,,,,',
      'Armor,0,0,,,60,31355,,,,,,,',
    ]))).toThrow(/duplicate/i)
  })

  it('throws on an unparsable value, unknown equipment, or a bad header', () => {
    expect(() => parseGearCsv(csv(['Armor,0,0,,,5x9,31355,,,,,,,']))).toThrow(/line 2/i)
    expect(() => parseGearCsv(csv(['Helmet,0,0,,,59,31355,,,,,,,']))).toThrow(/Helmet/)
    expect(() => parseGearCsv('Equipment,Level\r\nArmor,0')).toThrow(/header/i)
  })

  it('throws if a slot has no level-0 / 0-star row to define its primary stats', () => {
    expect(() => parseGearCsv(csv(['Armor,1,0,,,62,32922,,,,,,,']))).toThrow(/0:0/)
  })

  it('parses the real CSV: 5-star Armor present, 1-star Armor absent, partial Radar 4★ dropped', () => {
    const { stats, dropped } = parseGearCsv(readFileSync('data/raw/gear-stats.csv', 'utf8'))
    expect(stats.armor['40:5:0'].heroHp).toBe(502245)
    expect(stats.armor['40:1:4']).toBeUndefined()
    expect(stats.radar['40:4:4']).toBeUndefined()
    expect(dropped.some(d => d.slot === 'radar' && d.key === '40:4:4')).toBe(true)
    // 0★: levels 0-39, then level 40 at sub 0, 1 and 4 (from upgrade previews and Gear Details screens)
    expect(Object.keys(stats.gun).filter(k => k.split(':')[1] === '0').length).toBe(43)
    expect(stats.gun['40:0:1']).toEqual({ heroAttack: 3381, critRate: 0.205, heroDefense: 384, boostAttack: 0.0775 })
  })
})
