// rows: { [heroId]: 'front' | 'back' }, the player's placement, overriding each hero's default row.
export function rowOf(heroId, rows, defaultRow) {
  return rows?.[heroId] ?? defaultRow
}

// The game's formation: 2 front, 3 back. Front-row heroes come first (squad order within a row);
// if more than 2 claim the front, the extras go to the back.
export function arrangeFormation(squad, rowFn) {
  const sorted = [...squad].sort((a, b) => (rowFn(a) === 'front' ? 0 : 1) - (rowFn(b) === 'front' ? 0 : 1))
  return { front: sorted.slice(0, 2), back: sorted.slice(2) }
}

// Swaps heroes a and b between rows of the current formation. Every squad hero's row is written
// explicitly, so the result lays out exactly as shown, whatever the defaults are.
export function swapRows(rows, formation, a, b) {
  const front = formation.front.map(id => (id === a ? b : id === b ? a : id))
  const back = formation.back.map(id => (id === a ? b : id === b ? a : id))
  return { ...rows, ...Object.fromEntries(front.map(id => [id, 'front'])), ...Object.fromEntries(back.map(id => [id, 'back'])) }
}
