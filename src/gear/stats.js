import GEAR_STATS from '../data/gearStats.json'

// Returns the stat object for a piece state, or null when the data has no row for it.
export function getStats(slot, level, stars) {
  return GEAR_STATS[slot]?.[`${level}:${stars}`] ?? null
}
