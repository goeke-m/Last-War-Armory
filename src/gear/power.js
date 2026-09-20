export const STAT_KEYS = [
  'heroAttack', 'critRate', 'heroDefense', 'heroHp',
  'boostAttack', 'boostHp', 'boostDefense',
  'resistAll', 'resistPhysical', 'resistEnergy',
]

export function piecePower(stats, weights) {
  let total = 0
  for (const k of STAT_KEYS) total += (stats[k] ?? 0) * (weights[k] ?? 0)
  return total
}
