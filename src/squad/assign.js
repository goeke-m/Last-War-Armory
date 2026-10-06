// Gear placement for a squad. A piece may be pinned to a hero (piece.heroId: the player put it
// on that hero). Pinned pieces go on their hero first; the rest is auto-assigned: heroes ranked
// best first each take the best remaining unpinned piece for every still-empty slot, in their
// slot priority order. A piece pinned to a hero outside the squad stays with that hero.
// deps: { rank: {[heroId]: number}, pieceScore(piece) → number, slotPriority(heroId) → slot[] }
// Returns { assigned: {[heroId]: {gun, chip, armor, radar}}, unassigned: piece[] }.
export function assignGear(squadIds, gear, { rank, pieceScore, slotPriority }) {
  const assigned = Object.fromEntries(squadIds.map(id => [id, { gun: null, chip: null, armor: null, radar: null }]))
  const used = new Set()

  for (const p of gear) {
    const slots = p.heroId && assigned[p.heroId]
    if (slots && !slots[p.slot]) { slots[p.slot] = p; used.add(p.id) }
  }

  const pool = gear.filter(p => !p.heroId).sort((a, b) => pieceScore(b) - pieceScore(a))
  const byRank = [...squadIds].sort((a, b) => (rank[b] ?? 0) - (rank[a] ?? 0))
  for (const heroId of byRank) {
    for (const slot of slotPriority(heroId)) {
      if (assigned[heroId][slot]) continue
      const best = pool.find(p => p.slot === slot && !used.has(p.id))
      if (best) { assigned[heroId][slot] = best; used.add(best.id) }
    }
  }

  return { assigned, unassigned: gear.filter(p => !used.has(p.id)) }
}

// After saving piece `id`: like equipping in-game, any other piece pinned to the same hero and
// slot comes off (goes back to auto).
export function releaseClashingPins(gear, id) {
  const saved = gear.find(p => p.id === id)
  if (!saved?.heroId) return gear
  return gear.map(p => {
    if (p.id === id || p.heroId !== saved.heroId || p.slot !== saved.slot) return p
    const rest = { ...p }
    delete rest.heroId
    return rest
  })
}
