import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { buildDesign, fitPowerModel } from './fit.js'
import { stateKey } from '../src/gear/state.js'

const GEAR = JSON.parse(readFileSync('src/data/gearStats.json', 'utf8'))
const getStats = (slot, level, stars, sub) => GEAR[slot]?.[stateKey(level, stars, sub)] ?? null
const lineups = JSON.parse(readFileSync('data/raw/battleReports.json', 'utf8'))
const checks = existsSync('data/raw/powerChecks.json') ? JSON.parse(readFileSync('data/raw/powerChecks.json', 'utf8')) : []

const design = buildDesign(lineups, getStats, checks)
console.log(`${lineups.length} lineups and ${checks.length} power checks; ${design.ids.length} exact rows usable.`)
const byReason = {}
for (const d of design.dropped) (byReason[d.reason.replace(/^\w+ 40:\d: sub-upgrade step unknown$/, 'sub-upgrade step unknown')] ??= []).push(d.id)
for (const [reason, ids] of Object.entries(byReason)) console.log(`  dropped ${ids.length} (${reason}): ${ids.slice(0, 4).join(', ')}${ids.length > 4 ? ', …' : ''}`)

const fit = fitPowerModel(design)
console.log('Fitted keys:', fit.activeKeys.join(', '))
for (const [k, rep] of Object.entries(fit.merged)) console.log(`  ${k} is proportional to ${rep}; merged (weight reported on ${rep})`)
for (const r of fit.residuals) console.log(`  ${r.id}: predicted ${Math.round(r.predicted)} vs ${r.actual} (${(r.pct * 100).toFixed(2)}%)`)
if (!fit.ok) {
  console.error(`FAILED quality gate: ${fit.reason}. powerModel.json not written.`)
  process.exit(1)
}

const model = {
  weights: fit.weights,
  merged: fit.merged,
  fit: { rows: design.ids.length, maxResidualPct: fit.maxResidualPct, rmsResidualPct: fit.rmsResidualPct },
}
writeFileSync('src/data/powerModel.json', JSON.stringify(model, null, 1) + '\n')
console.log(`Wrote src/data/powerModel.json (max residual ${(fit.maxResidualPct * 100).toFixed(2)}%).`)
