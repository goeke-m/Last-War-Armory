import { describe, it, expect } from 'vitest'
import { nnls } from './nnls.js'

function lcg(seed) {
  let s = seed
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296
}

describe('nnls', () => {
  it('recovers known non-negative weights from exact data at very different column scales', () => {
    const rand = lcg(7)
    const truth = [0.002, 35, 0, 1200]
    const scales = [100000, 1000, 50, 0.1]
    const A = Array.from({ length: 30 }, () => scales.map(sc => rand() * sc))
    const y = A.map(r => r.reduce((s, v, j) => s + v * truth[j], 0))
    const w = nnls(A, y)
    truth.forEach((t, j) => expect(w[j]).toBeCloseTo(t, 4))
  })

  it('never returns a negative weight', () => {
    const A = [[1, 0], [0, 1], [1, 1]]
    const y = [1, -5, -2]
    expect(nnls(A, y).every(v => v >= 0)).toBe(true)
  })
})
