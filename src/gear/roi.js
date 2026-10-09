import { getStats as defaultGetStats } from './stats.js'
import { piecePower } from './power.js'
import { QUALITY_MAX_LEVEL } from './constants.js'
import POWER_MODEL from '../data/powerModel.json'
import UPGRADE_COSTS from '../data/upgradeCosts.json'

export const RESOURCES = UPGRADE_COSTS.resources

const DEFAULT_DEPS = { getStats: defaultGetStats, weights: POWER_MODEL.weights, specials: POWER_MODEL.specials, costs: UPGRADE_COSTS }

// piece = { slot, quality, level, stars, sub? }: sub (0-4) is the sub-upgrade step, only at level 40
// below 5★ (5★ has no sub-upgrades).
// Only legendary gear has stat data. Sub steps 1-3 that were not recorded are filled in linearly
// between the tier's sub 0 and sub 4 (in-game steps are equal: 0★ Railgun and Data Chip, 2026-10-06).
export function stateStats(piece, deps = DEFAULT_DEPS) {
  if (piece.quality !== 'legendary') return null
  const { slot, level, stars, sub } = piece
  if (level < 40) return deps.getStats(slot, level, 0)
  if (stars === 5) return deps.getStats(slot, level, 5, 0) // 5★ has no sub-upgrades
  if (sub == null) return null
  const row = deps.getStats(slot, level, stars, sub)
  if (row || sub === 0 || sub === 4) return row
  const lo = deps.getStats(slot, level, stars, 0), hi = deps.getStats(slot, level, stars, 4)
  if (!lo || !hi) return null
  const out = {}
  for (const k of new Set([...Object.keys(lo), ...Object.keys(hi)])) out[k] = (lo[k] ?? 0) + ((hi[k] ?? 0) - (lo[k] ?? 0)) * sub / 4
  return out
}

// A piece's Power: its stats under the fitted weights, plus the slot's special attribute at 5★.
export function piecePowerOf(piece, deps = DEFAULT_DEPS) {
  const stats = stateStats(piece, deps)
  if (!stats) return null
  if (piece.stars !== 5) return piecePower(stats, deps.weights)
  const special = deps.specials?.[piece.slot]
  return special == null ? null : piecePower(stats, deps.weights) + special
}

// The piece's one next step: level up to max, then 4 sub-upgrades per star tier, then promote.
// { type: 'sub', from: null } means a level-40 piece whose sub step is not entered yet.
export function nextStep(piece) {
  const maxLevel = QUALITY_MAX_LEVEL[piece.quality] ?? 40
  if (piece.level < maxLevel) return { type: 'level', from: piece.level, to: piece.level + 1 }
  if (piece.quality !== 'legendary' || piece.stars >= 5) return null
  if (piece.sub == null) return { type: 'sub', from: null, to: null }
  if (piece.sub < 4) return { type: 'sub', from: piece.sub, to: piece.sub + 1 }
  return { type: 'stars', from: piece.stars, to: piece.stars + 1 }
}

function applyStep(piece, step) {
  if (step.type === 'level') return { ...piece, level: step.to, ...(step.to === 40 ? { sub: 0 } : {}) }
  if (step.type === 'sub') return { ...piece, sub: step.to }
  return { ...piece, stars: step.to, sub: 0 }
}

// Cost of one step in one resource. 0 = the step does not use this resource; null = the table lacks it.
// A star's total (stars[res][n]) pays for the 4 sub-upgrades of tier n-1 and the promotion into n;
// stepSplit gives each step's share.
export function stepCost(piece, step, resource, deps = DEFAULT_DEPS) {
  if (step.type === 'level') {
    const table = deps.costs.level[resource]
    if (!table) return 0
    return typeof table[step.to] === 'number' ? table[step.to] : null
  }
  const table = deps.costs.stars[resource]
  if (!table) return 0
  const share = deps.costs.stepSplit?.[resource]?.[step.type === 'sub' ? 'sub' : 'promotion']
  if (share == null) return null
  if (share === 0) return 0
  const total = table[piece.stars + 1]
  return typeof total === 'number' ? total * share : null
}

export function roiOf(gain, cost) {
  if (gain === null || cost === null || cost <= 0) return null
  return gain / cost
}

function reasonFor(piece, step) {
  if (step.type === 'level') return step.to % 10 === 0 ? `Hits Lv ${step.to} — unlocks an extra attribute` : 'Level up'
  if (step.from === null) return 'Set the sub-upgrade step (0–4) on this piece to rank it'
  if (step.type === 'sub') return `${piece.stars}★ sub-upgrade ${step.from} → ${step.to}`
  return `${step.to}★ promotion`
}

export function rankUpgrades(assigned, resource, deps = DEFAULT_DEPS) {
  const items = []
  for (const [heroId, slots] of Object.entries(assigned)) {
    for (const [slot, piece] of Object.entries(slots)) {
      if (!piece) continue
      const step = nextStep(piece)
      if (!step) continue
      let gain = null, cost = null
      if (step.from !== null) {
        const before = piecePowerOf(piece, deps), after = piecePowerOf(applyStep(piece, step), deps)
        gain = before === null || after === null ? null : after - before
        cost = stepCost(piece, step, resource, deps)
      }
      const roi = roiOf(gain, cost)
      items.push({
        type: step.type, slot, heroId, from: step.from, to: step.to, stars: piece.stars,
        blueprintWarning: step.type === 'stars', reason: reasonFor(piece, step),
        score: roi ?? 0, roi, powerGain: gain, cost, resource,
      })
    }
  }
  return items.sort((a, b) => {
    if (a.roi === null && b.roi === null) return 0
    if (a.roi === null) return 1
    if (b.roi === null) return -1
    return b.roi - a.roi
  })
}

export function coverage(gear, deps = DEFAULT_DEPS) {
  return { covered: gear.filter(p => piecePowerOf(p, deps) !== null).length, total: gear.length }
}
