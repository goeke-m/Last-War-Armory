// A piece's state key in gearStats. Sub-upgrades (4 per star tier) exist only at level 40;
// a plain level:stars key is the top of the tier (sub 4), which is what gear-stats.csv records.
export function stateKey(level, stars, sub = 4) {
  if (level < 40) return `${level}:${stars}`
  if (!Number.isInteger(sub) || sub < 0 || sub > 4) throw new Error(`bad sub step ${sub} (expected 0-4)`)
  return sub === 4 ? `${level}:${stars}` : `${level}:${stars}:${sub}`
}
