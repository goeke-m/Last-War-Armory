// Usage: node scripts/readGearScreens.js <screenshot folder> [out.json]
// Reads every Gear-page screenshot in the folder (other pages have no gear grid and are skipped)
// and prints star bars per side. Pieces without a bar are below level 40: read their level by eye.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { PNG } from 'pngjs'
import { readGearPage } from './gearPage.js'

const [dir, out] = process.argv.slice(2)
if (!dir) { console.error('Usage: node scripts/readGearScreens.js <screenshot folder> [out.json]'); process.exit(1) }

const pages = []
for (const file of readdirSync(dir).filter(f => f.toLowerCase().endsWith('.png')).sort()) {
  const page = readGearPage(PNG.sync.read(readFileSync(join(dir, file))))
  if (page.left.length + page.right.length < 24) continue // other tabs: no gear grid (a real one has 32-40 tiles)
  pages.push({ file, ...page })
  const fmt = side => side.map(p => p.hasBar ? p.stars : '-').join('')
  const noBar = [...page.left, ...page.right].filter(p => !p.hasBar).length
  console.log(`${file}  L ${fmt(page.left)}  R ${fmt(page.right)}${noBar ? `  (${noBar} without bar: read level)` : ''}`)
  for (const w of page.warnings) console.log(`  warning: ${w}`)
}
console.log(`${pages.length} gear pages. Stars per piece in on-screen order; '-' = no star bar (below level 40).`)
if (out) writeFileSync(out, JSON.stringify(pages, null, 1) + '\n')
