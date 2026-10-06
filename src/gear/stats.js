import GEAR_STATS from '../data/gearStats.json'
import { stateKey } from './state.js'

// Returns the stat object for a piece state, or null when the data has no row for it.
// sub defaults to 4, the top of the star tier.
export function getStats(slot, level, stars, sub = 4) {
  return GEAR_STATS[slot]?.[stateKey(level, stars, sub)] ?? null
}
