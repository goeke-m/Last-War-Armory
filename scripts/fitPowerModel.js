import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { buildDesign, fitPowerModel } from './fit.js'
import { piecePower } from '../src/gear/power.js'

const GEAR = JSON.parse(readFileSync('src/data/gearStats.json', 'utf8'))
const getStats = (slot, level, stars) => GEAR[slot]?.[`${level}:${stars}`] ?? null
const lineups = JSON.parse(readFileSync('data/raw/battleReports.json', 'utf8'))

const design = buildDesign(lineups, getStats)
console.log(`${lineups.length} lineups transcribed, ${design.ids.length} usable.`)
for (const d of design.dropped) console.log(`  dropped ${d.id}: ${d.reason}`)

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
  fit: { lineups: design.ids.length, maxResidualPct: fit.maxResidualPct, rmsResidualPct: fit.rmsResidualPct },
}
writeFileSync('src/data/powerModel.json', JSON.stringify(model, null, 1) + '\n')
console.log(`Wrote src/data/powerModel.json (max residual ${(fit.maxResidualPct * 100).toFixed(2)}%).`)

if (existsSync('data/raw/powerChecks.json')) {
  console.log('In-game checks (predicted vs measured Power delta):')
  for (const c of JSON.parse(readFileSync('data/raw/powerChecks.json', 'utf8'))) {
    const before = getStats(c.slot, c.from.level, c.from.stars)
    const after = getStats(c.slot, c.to.level, c.to.stars)
    if (!before || !after) { console.log(`  ${c.slot} ${JSON.stringify(c.from)}→${JSON.stringify(c.to)}: no stats, skipped`); continue }
    const predicted = piecePower(after, fit.weights) - piecePower(before, fit.weights)
    console.log(`  ${c.slot} ${JSON.stringify(c.from)}→${JSON.stringify(c.to)}: predicted ${Math.round(predicted)} vs measured ${c.powerAfter - c.powerBefore}`)
  }
}
