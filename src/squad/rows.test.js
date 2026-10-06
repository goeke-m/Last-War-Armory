import { describe, it, expect } from 'vitest'
import { rowOf, arrangeFormation, swapRows } from './rows.js'

const DEFAULTS = { a: 'front', b: 'front', c: 'back', d: 'back', e: 'back' }
const row = rows => id => rowOf(id, rows, DEFAULTS[id])

describe('rowOf', () => {
  it("uses the player's choice over the hero's default row", () => {
    expect(rowOf('c', { c: 'front' }, 'back')).toBe('front')
    expect(rowOf('c', {}, 'back')).toBe('back')
    expect(rowOf('c', undefined, 'back')).toBe('back')
  })
})

describe('arrangeFormation', () => {
  it('lays out 2 front and 3 back, front-row heroes first, keeping squad order within a row', () => {
    expect(arrangeFormation(['c', 'a', 'd', 'b', 'e'], row({}))).toEqual({ front: ['a', 'b'], back: ['c', 'd', 'e'] })
  })
  it('moves extra front-row heroes to the back when more than 2 claim the front', () => {
    expect(arrangeFormation(['a', 'b', 'c', 'd', 'e'], row({ c: 'front' }))).toEqual({ front: ['a', 'b'], back: ['c', 'd', 'e'] })
  })
})

describe('swapRows', () => {
  it('swaps two heroes across rows and writes every squad hero\'s row explicitly', () => {
    const formation = { front: ['a', 'b'], back: ['c', 'd', 'e'] }
    const rows = swapRows({}, formation, 'b', 'd')
    expect(rows).toEqual({ a: 'front', d: 'front', b: 'back', c: 'back', e: 'back' })
    expect(arrangeFormation(['a', 'b', 'c', 'd', 'e'], row(rows))).toEqual({ front: ['a', 'd'], back: ['b', 'c', 'e'] })
  })
  it('keeps rows of heroes outside the squad', () => {
    expect(swapRows({ z: 'front' }, { front: ['a', 'b'], back: ['c', 'd', 'e'] }, 'a', 'c').z).toBe('front')
  })
})
