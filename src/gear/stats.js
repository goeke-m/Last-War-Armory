import GEAR_STATS from '../data/gearStats.json'
import { stateKey } from './state.js'

// Returns the stat object for a piece state, or null when the data has no row for it.
// sub (0-4) is required at level 40 and ignored below it.
export function getStats(slot, level, stars, sub) {
  return GEAR_STATS[slot]?.[stateKey(level, stars, sub)] ?? null
}
