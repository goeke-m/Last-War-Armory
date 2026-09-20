import { nnls } from './nnls.js'
import { STAT_KEYS } from '../src/gear/power.js'

export function buildDesign(lineups, getStats, border) {
  const rows = [], y = [], ids = [], dropped = []
  for (const l of lineups) {
    if (l.pieces.length !== 20) throw new Error(`lineup ${l.id}: expected 20 pieces, got ${l.pieces.length}`)
    if (l.pieces.some(p => p.border !== border)) {
      dropped.push({ id: l.id, reason: `has a piece whose border is not "${border}"` })
      continue
    }
    const sum = Object.fromEntries(STAT_KEYS.map(k => [k, 0]))
    let missing = null
    for (const p of l.pieces) {
      const s = getStats(p.slot, p.level, p.stars)
      if (!s) { missing = `${p.slot} ${p.level}:${p.stars}`; break }
      for (const k of STAT_KEYS) sum[k] += s[k] ?? 0
    }
    if (missing) { dropped.push({ id: l.id, reason: `no stats for ${missing}` }); continue }
    if (!(l.power > 0)) throw new Error(`lineup ${l.id}: power must be a positive number`)
    rows.push(STAT_KEYS.map(k => sum[k]))
    y.push(l.power)
    ids.push(l.id)
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

  if (rows.length < 2 * active.length) {
    return { ...base, ok: false, reason: `underdetermined: ${rows.length} usable lineups for ${active.length} unknowns (need at least ${2 * active.length})` }
  }
  const A = rows.map(r => active.map(j => r[j]))
  const w = nnls(A, y)
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
