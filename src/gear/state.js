// A piece's state key in gearStats. Sub-upgrades (4 per star tier) exist only at level 40,
// so a level-40 key always names its sub step 0-4: level:stars:sub.
export function stateKey(level, stars, sub) {
  if (level < 40) return `${level}:${stars}`
  if (!Number.isInteger(sub) || sub < 0 || sub > 4) throw new Error(`bad sub step ${sub} (expected 0-4 at level 40)`)
  return `${level}:${stars}:${sub}`
}
