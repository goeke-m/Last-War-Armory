import { describe, it, expect } from 'vitest'
import { stateKey } from './state.js'

describe('stateKey', () => {
  it('uses level:stars below level 40, where sub-upgrades do not exist', () => {
    expect(stateKey(25, 0)).toBe('25:0')
    expect(stateKey(25, 0, 4)).toBe('25:0')
  })
  it('uses level:stars for the top of a tier (sub 4, the default) at level 40', () => {
    expect(stateKey(40, 3)).toBe('40:3')
    expect(stateKey(40, 3, 4)).toBe('40:3')
  })
  it('adds the sub step for sub 0-3 at level 40', () => {
    expect(stateKey(40, 3, 0)).toBe('40:3:0')
    expect(stateKey(40, 0, 2)).toBe('40:0:2')
  })
  it('rejects an out-of-range sub step', () => {
    expect(() => stateKey(40, 3, 5)).toThrow(/sub/)
    expect(() => stateKey(40, 3, 1.5)).toThrow(/sub/)
  })
})
