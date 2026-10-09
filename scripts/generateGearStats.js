import { readFileSync, writeFileSync } from 'node:fs'
import { parseGearCsv } from './csv.js'

const { stats, dropped } = parseGearCsv(readFileSync('data/raw/gear-stats.csv', 'utf8'))
writeFileSync('src/data/gearStats.json', JSON.stringify(stats, null, 1) + '\n')
const rows = Object.values(stats).reduce((n, s) => n + Object.keys(s).length, 0)
console.log(`Wrote src/data/gearStats.json (${rows} usable rows).`)
for (const d of dropped) console.log(`  dropped ${d.slot} ${d.key}: ${d.reason}`)
