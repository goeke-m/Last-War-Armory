import { describe, it, expect } from 'vitest'
import { assignGear, releaseClashingPins } from './assign.js'

const piece = (id, slot, score, heroId) => ({ id, slot, score, ...(heroId ? { heroId } : {}) })
const deps = {
  rank: { a: 3, b: 2, c: 1 },
  pieceScore: p => p.score,
  slotPriority: () => ['gun', 'armor'],
}
// Piece ids per hero for the two slots these tests use.
const ids = assigned => Object.fromEntries(Object.entries(assigned).map(([h, s]) => [h, { gun: s.gun?.id ?? null, armor: s.armor?.id ?? null }]))

describe('assignGear', () => {
  it('gives each hero, best-ranked first, the best remaining piece per slot', () => {
    const gear = [piece('g1', 'gun', 1), piece('g2', 'gun', 9), piece('a1', 'armor', 5)]
    const { assigned, unassigned } = assignGear(['b', 'a'], gear, deps)
    expect(ids(assigned)).toEqual({ a: { gun: 'g2', armor: 'a1' }, b: { gun: 'g1', armor: null } })
    expect(unassigned).toEqual([])
  })

  it('puts pinned pieces on their hero first and auto-fills around them', () => {
    const gear = [piece('g1', 'gun', 1, 'a'), piece('g2', 'gun', 9), piece('a1', 'armor', 5)]
    const { assigned } = assignGear(['a', 'b'], gear, deps)
    expect(ids(assigned)).toEqual({ a: { gun: 'g1', armor: 'a1' }, b: { gun: 'g2', armor: null } })
  })

  it('keeps a piece pinned to a hero outside the squad off everyone else', () => {
    const gear = [piece('g1', 'gun', 9, 'c'), piece('g2', 'gun', 1)]
    const { assigned, unassigned } = assignGear(['a', 'b'], gear, deps)
    expect(ids(assigned).a.gun).toBe('g2')
    expect(ids(assigned).b.gun).toBeNull()
    expect(unassigned.map(p => p.id)).toEqual(['g1'])
  })

  it('places only the first of two pieces pinned to the same hero and slot', () => {
    const gear = [piece('g1', 'gun', 1, 'a'), piece('g2', 'gun', 9, 'a')]
    const { assigned, unassigned } = assignGear(['a'], gear, deps)
    expect(ids(assigned).a.gun).toBe('g1')
    expect(unassigned.map(p => p.id)).toEqual(['g2'])
  })
})

describe('releaseClashingPins', () => {
  it("unpins other pieces on the saved piece's hero and slot, as equipping does in-game", () => {
    const gear = [piece('g1', 'gun', 1, 'a'), piece('g2', 'gun', 9, 'a'), piece('a1', 'armor', 5, 'a'), piece('g3', 'gun', 2, 'b')]
    const out = releaseClashingPins(gear, 'g2')
    expect(out.map(p => [p.id, p.heroId ?? null])).toEqual([['g1', null], ['g2', 'a'], ['a1', 'a'], ['g3', 'b']])
  })
  it('changes nothing for an unpinned piece', () => {
    const gear = [piece('g1', 'gun', 1, 'a'), piece('g2', 'gun', 9)]
    expect(releaseClashingPins(gear, 'g2')).toEqual(gear)
  })
})
