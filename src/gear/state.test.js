import { describe, it, expect } from 'vitest'
import { stateKey } from './state.js'

describe('stateKey', () => {
  it('uses level:stars below level 40, where sub-upgrades do not exist', () => {
    expect(stateKey(25, 0)).toBe('25:0')
    expect(stateKey(25, 0, 4)).toBe('25:0')
  })
  it('always includes the sub step at level 40', () => {
    expect(stateKey(40, 0, 0)).toBe('40:0:0')
    expect(stateKey(40, 3, 4)).toBe('40:3:4')
  })
  it('rejects a missing or out-of-range sub step at level 40', () => {
    expect(() => stateKey(40, 3)).toThrow(/sub/)
    expect(() => stateKey(40, 3, 5)).toThrow(/sub/)
    expect(() => stateKey(40, 3, 1.5)).toThrow(/sub/)
  })
})
