import { nnls } from './nnls.js'
import { STAT_KEYS } from '../src/gear/power.js'

// Stats of one piece state, or a reason it cannot be used. A level-40 piece needs its sub-upgrade
// step: battle reports show only stars, so without it the stats are a range, not a value.
// 5★ pieces carry a special attribute whose Power the stat columns do not capture.
function stateStats(getStats, slot, { level, stars, sub }) {
  if (stars === 5) return { reason: `${slot} 5★: special attribute not modeled` }
  if (level === 40 && sub == null) return { reason: `${slot} 40:${stars}: sub-upgrade step unknown` }
  const s = getStats(slot, level, stars, level === 40 ? sub : undefined)
  return s ? { stats: s } : { reason: `no stats for ${slot} ${level}:${stars}${level === 40 ? `:${sub}` : ''}` }
}

// Rows of the fit: a lineup is Σ piece stats against its gear Power; a power check
// (one upgrade measured in-game) is stats(to) − stats(from) against the Power it added;
// a piece is its own stats against the Power its Gear Details screen shows.
export function buildDesign(lineups, getStats, { checks = [], pieces = [] } = {}) {
  const rows = [], y = [], ids = [], dropped = []
  for (const l of lineups) {
    if (l.pieces.length !== 20) throw new Error(`lineup ${l.id}: expected 20 pieces, got ${l.pieces.length}`)
    if (!(l.power > 0)) throw new Error(`lineup ${l.id}: power must be a positive number`)
    const sum = Object.fromEntries(STAT_KEYS.map(k => [k, 0]))
    let reason = null
    for (const p of l.pieces) {
      const r = stateStats(getStats, p.slot, p)
      if (!r.stats) { reason = r.reason; break }
      for (const k of STAT_KEYS) sum[k] += r.stats[k] ?? 0
    }
    if (reason) { dropped.push({ id: l.id, reason }); continue }
    rows.push(STAT_KEYS.map(k => sum[k]))
    y.push(l.power)
    ids.push(l.id)
  }
  for (const c of checks) {
    const delta = c.powerAfter - c.powerBefore
    if (!(delta > 0)) throw new Error(`power check ${c.id}: powerAfter must exceed powerBefore`)
    const from = stateStats(getStats, c.slot, c.from), to = stateStats(getStats, c.slot, c.to)
    if (!from.stats || !to.stats) { dropped.push({ id: c.id, reason: (from.reason ?? to.reason) }); continue }
    rows.push(STAT_KEYS.map(k => (to.stats[k] ?? 0) - (from.stats[k] ?? 0)))
    y.push(delta)
    ids.push(c.id)
  }
  for (const p of pieces) {
    if (!(p.power > 0)) throw new Error(`piece ${p.id}: power must be a positive number`)
    const r = stateStats(getStats, p.slot, p)
    if (!r.stats) { dropped.push({ id: p.id, reason: r.reason }); continue }
    rows.push(STAT_KEYS.map(k => r.stats[k] ?? 0))
    y.push(p.power)
    ids.push(p.id)
  }
  return { rows, y, ids, dropped }
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i] }
  return dot / Math.sqrt(na * nb)
}

export function fitPowerModel({ rows, y, ids }, { maxResidualPct = 0.02 } = {}) {
  const col = j => rows.map(r => r[j])
  const active = []
  const merged = {}
  STAT_KEYS.forEach((key, j) => {
    const v = col(j)
    if (v.every(x => x === 0)) return
    const rep = active.find(a => cosine(col(a), v) > 1 - 1e-9)
    if (rep !== undefined) merged[key] = STAT_KEYS[rep]
    else active.push(j)
  })
  const activeKeys = active.map(j => STAT_KEYS[j])
  const weights = Object.fromEntries(STAT_KEYS.map(k => [k, 0]))
  const base = { weights, merged, activeKeys, residuals: [], maxResidualPct: null, rmsResidualPct: null }

  // Identical rows (the same piece state seen twice) add no information.
  const distinct = new Set(rows.map(r => r.join(','))).size
  if (distinct < 2 * active.length) {
    return { ...base, ok: false, reason: `underdetermined: ${distinct} distinct exact rows for ${active.length} unknowns (need at least ${2 * active.length})` }
  }
  const A = rows.map(r => active.map(j => r[j]))
  // Minimise relative error, like the gate: otherwise a power check's delta (thousands) is
  // drowned out by gear totals (millions).
  const w = nnls(A.map((r, i) => r.map(v => v / y[i])), y.map(() => 1))
  active.forEach((j, i) => { weights[STAT_KEYS[j]] = w[i] })
  const residuals = rows.map((r, i) => {
    const predicted = A[i].reduce((s, v, k) => s + v * w[k], 0)
    return { id: ids[i], predicted, actual: y[i], pct: Math.abs(predicted - y[i]) / y[i] }
  })
  const maxPct = Math.max(...residuals.map(r => r.pct))
  const rms = Math.sqrt(residuals.reduce((s, r) => s + r.pct * r.pct, 0) / residuals.length)
  const ok = maxPct <= maxResidualPct
  return {
    ...base, ok, residuals, maxResidualPct: maxPct, rmsResidualPct: rms,
    reason: ok ? undefined : `max residual ${(maxPct * 100).toFixed(2)}% exceeds the ${(maxResidualPct * 100).toFixed(0)}% gate`,
  }
}
