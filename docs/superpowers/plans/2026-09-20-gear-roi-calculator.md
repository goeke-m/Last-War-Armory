# Gear ROI Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the invented gear-upgrade scoring in max-efficiency mode with ROI = in-game Power gained per unit of a user-chosen limiting resource, built on datamined stats, a regression-fitted Power model, and sourced upgrade costs.

**Architecture:** The datamined CSV is compiled to a stat lookup (`src/data/gearStats.json`). An offline script fits Power-per-stat weights from transcribed battle-report gear totals and writes `src/data/powerModel.json` (only if a quality gate passes). `src/gear/roi.js` combines stats, weights and `src/data/upgradeCosts.json` to rank upgrades; `App.jsx` calls it for max-efficiency mode and shows a limiting-resource selector. Unknown data yields `null`, never a guess.

**Tech Stack:** React 18, Vite 5, plain ES modules, Vitest (added in Task 1), Node scripts under `scripts/`.

**Spec:** `docs/superpowers/specs/2026-09-20-gear-roi-calculator-design.md`

## Global Constraints

- Unknown stats or costs are never estimated: functions return `null`; UI shows "no data".
- Resources stay separate (gold / ore / ceramic / blueprints as they appear in the sourced cost tables); no exchange rate is invented.
- Quality gate: `scripts/fitPowerModel.js` refuses to write `powerModel.json` if any lineup's residual exceeds **2% of that lineup's gear total**, or if usable lineups < 2 × the number of fitted unknowns.
- Role-based and Weakest-link upgrade modes and `heroScore` are not modified. `pieceScore` stays because `assignGear` and Weakest-link still use it (the spec's "remove invented weights" applies to max-efficiency ranking only; see Task 5).
- Out of scope: drone ROI, hero-role weighting of gear, live-game data extraction.
- CSV facts: CRLF line endings, 14 columns, percentages like `2.50%`, no quoted fields. CSV equipment names map `Railgun→gun`, `Data Chip→chip`, `Armor→armor`, `Radar→radar` (the app's `SLOTS`).
- Stats exist only for `legendary` quality pieces (max Lv 40). Other qualities have no ROI.

> **2026-10-06 amendment (sub-upgrades):** every star tier, 0★ included, has 4 sub-upgrades that battle reports do not show. See the spec's "Sub-upgrades" section. Implemented: `stateKey(level, stars, sub)` in `src/gear/state.js` (plain `level:stars` = top of tier, sub 4); optional `Sub` CSV column; `getStats(slot, level, stars, sub = 4)`; `buildDesign(lineups, getStats, checks)` drops lineups with a Lv.40 piece lacking `sub` and turns `data/raw/powerChecks.json` entries into stat-delta rows (fit data, no longer only validation); `scripts/readGearScreens.js` reads star bars from screenshots. Still open: per-step costs in `upgradeCosts.json`, and the ROI/UI tasks ranking single steps.

> **2026-09-20 amendment (star tiers):** star promotions only unlock at level 40 (user-confirmed), so pieces below level 40 always have 0 stars and `rankUpgrades` offers a star promotion only when the piece is at max level (Task 5 code and tests below already reflect this).

> **2026-09-20 amendment:** the border filter in Task 3's code below was removed after execution (commit `refactor: drop border filter…`): a border is just the star tier, so `buildDesign(lineups, getStats)` takes no border, pieces have no `border` field, and the CLI takes no `--border` flag. The Task 3 code blocks below show the original version.

## File Structure

| File | Responsibility |
|---|---|
| `data/raw/gear-stats.csv` | Source CSV, copied into the repo |
| `data/raw/battleReports.json` | Hand-transcribed gear pages (user data) |
| `data/raw/powerChecks.json` | Optional in-game Power before/after measurements |
| `scripts/csv.js` | Pure CSV → stat table parser |
| `scripts/generateGearStats.js` | CLI: CSV → `src/data/gearStats.json` |
| `scripts/nnls.js` | Non-negative least squares solver |
| `scripts/fit.js` | Pure: design matrix + fit + quality gate |
| `scripts/fitPowerModel.js` | CLI: reports → `src/data/powerModel.json` |
| `src/data/gearStats.json` | Generated stat lookup |
| `src/data/powerModel.json` | Generated weights |
| `src/data/upgradeCosts.json` | Sourced costs per resource |
| `src/gear/constants.js` | `QUALITY_MAX_LEVEL` shared with App |
| `src/gear/stats.js` | `getStats(slot, level, stars)` |
| `src/gear/power.js` | `STAT_KEYS`, `piecePower` |
| `src/gear/roi.js` | `powerGain`, `upgradeCost`, `roiOf`, `rankUpgrades`, `coverage`, `RESOURCES` |
| `src/App.jsx` | Wire-in: state, reducer, priority engine, selector UI |

---

### Task 1: Vitest, CSV parser, generated stat lookup

**Files:**
- Modify: `package.json` (add vitest, `test` script)
- Modify: `eslint.config.js` (node globals for `scripts/`)
- Create: `data/raw/gear-stats.csv` (copy)
- Create: `scripts/csv.js`, `scripts/csv.test.js`, `scripts/generateGearStats.js`
- Create: `src/data/gearStats.json` (generated), `src/gear/stats.js`, `src/gear/stats.test.js`

**Interfaces:**
- Produces: `parseGearCsv(text) → { stats: { [slot]: { [\`${level}:${stars}\`]: { [statKey]: number } } }, dropped: { slot, key, reason }[] }`; `STAT_COLUMNS` (CSV header → statKey); `getStats(slot: 'gun'|'chip'|'armor'|'radar', level: number, stars: number) → object | null`.
- Stat keys: `heroAttack, critRate, heroDefense, heroHp, boostAttack, boostHp, boostDefense, resistAll, resistPhysical, resistEnergy`. Percentages are fractions (`2.50%` → `0.025`).

- [ ] **Step 1: Add Vitest**

Run:
```bash
cd /home/shadowmohawk/Repos/last-war-optimizer && npm install -D vitest
```
Edit `package.json` scripts to add `"test": "vitest run"` after `"lint": "eslint ."`.

- [ ] **Step 2: Allow Node globals in scripts**

In `eslint.config.js`, add a second config object after the existing one (inside the exported array):

```js
  {
    files: ['scripts/**/*.js', 'vite.config.js'],
    languageOptions: { globals: globals.node },
  },
```

- [ ] **Step 3: Copy the CSV**

```bash
mkdir -p data/raw && cp "$HOME/Downloads/Last War Equip Data Mining - Sheet1.csv" data/raw/gear-stats.csv
```
If the user has a newer version since 2026-09-20, use that instead and say so.

- [ ] **Step 4: Write the failing parser test**

Create `scripts/csv.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { parseGearCsv } from './csv.js'

const HEADER = 'Equipment,Level,Stars,Hero Attack,Crit Rate,Hero Defense,Hero HP,Boost Hero Attack,Boost Hero HP,Boost Hero Defense,Resistance to all Damage Types,Physical Damage Resistance,Energy Damage Resistance,Special Attribute'

const csv = lines => [HEADER, ...lines].join('\r\n')

describe('parseGearCsv', () => {
  it('parses numbers and percentages and maps equipment to slots', () => {
    const { stats } = parseGearCsv(csv([
      'Armor,0,0,,,59,31355,,2.50%,2.50%,,,,',
      'Armor,1,0,,,62,32922,,2.62%,2.62%,,,,',
    ]))
    expect(stats.armor['0:0']).toEqual({ heroDefense: 59, heroHp: 31355, boostHp: 0.025, boostDefense: 0.025 })
    expect(stats.armor['1:0'].boostHp).toBe(0.0262)
  })

  it('treats whitespace-only cells as blank and trims equipment names', () => {
    const { stats } = parseGearCsv(csv(['Armor ,0,0,  ,,59,31355,,,,,,,']))
    expect(stats.armor['0:0']).toEqual({ heroDefense: 59, heroHp: 31355 })
  })

  it('drops rows with no stats and rows missing a primary stat', () => {
    const { stats, dropped } = parseGearCsv(csv([
      'Radar,0,0,,,119,18813,,2.50%,2.50%,,,,',
      'Radar,40,1,,,,,,,,,,,',
      'Radar,40,3,,,,,,14.50%,14.50%,,,30.00%,',
      'Radar,40,5,,,2033,225747,15.00%,,15.00%,,,40.00%,note',
    ]))
    expect(stats.radar['40:1']).toBeUndefined()
    expect(stats.radar['40:3']).toBeUndefined()
    expect(stats.radar['40:5'].heroDefense).toBe(2033)
    expect(dropped.map(d => d.key).sort()).toEqual(['40:1', '40:3'])
  })

  it('throws on duplicate (slot, level, stars)', () => {
    expect(() => parseGearCsv(csv([
      'Armor,0,0,,,59,31355,,,,,,,',
      'Armor,0,0,,,60,31355,,,,,,,',
    ]))).toThrow(/duplicate/i)
  })

  it('throws on an unparsable value, unknown equipment, or a bad header', () => {
    expect(() => parseGearCsv(csv(['Armor,0,0,,,5x9,31355,,,,,,,']))).toThrow(/line 2/i)
    expect(() => parseGearCsv(csv(['Helmet,0,0,,,59,31355,,,,,,,']))).toThrow(/Helmet/)
    expect(() => parseGearCsv('Equipment,Level\r\nArmor,0')).toThrow(/header/i)
  })

  it('throws if a slot has no level-0 / 0-star row to define its primary stats', () => {
    expect(() => parseGearCsv(csv(['Armor,1,0,,,62,32922,,,,,,,']))).toThrow(/0:0/)
  })

  it('parses the real CSV: 5-star Armor present, 1-star Armor absent, partial Radar dropped', () => {
    const { stats, dropped } = parseGearCsv(readFileSync('data/raw/gear-stats.csv', 'utf8'))
    expect(stats.armor['40:5'].heroHp).toBe(502245)
    expect(stats.armor['40:1']).toBeUndefined()
    expect(stats.radar['40:3']).toBeUndefined()
    expect(dropped.some(d => d.slot === 'radar' && d.key === '40:3')).toBe(true)
    expect(Object.keys(stats.gun).filter(k => k.endsWith(':0')).length).toBe(41)
  })
})
```

- [ ] **Step 5: Run it to verify it fails**

Run: `npx vitest run scripts/csv.test.js`
Expected: FAIL — cannot find `./csv.js`.

- [ ] **Step 6: Implement the parser**

Create `scripts/csv.js`:

```js
export const SLOT_BY_EQUIPMENT = { Railgun: 'gun', 'Data Chip': 'chip', Armor: 'armor', Radar: 'radar' }

// CSV header → stat key, in CSV column order (columns 4–13 of the file).
export const STAT_COLUMNS = {
  'Hero Attack': 'heroAttack',
  'Crit Rate': 'critRate',
  'Hero Defense': 'heroDefense',
  'Hero HP': 'heroHp',
  'Boost Hero Attack': 'boostAttack',
  'Boost Hero HP': 'boostHp',
  'Boost Hero Defense': 'boostDefense',
  'Resistance to all Damage Types': 'resistAll',
  'Physical Damage Resistance': 'resistPhysical',
  'Energy Damage Resistance': 'resistEnergy',
}

// Stats every row of a slot must have to be usable (taken from the slot's 0:0 row).
const PRIMARY_KEYS = ['heroAttack', 'critRate', 'heroDefense', 'heroHp']

const EXPECTED_HEADER = ['Equipment', 'Level', 'Stars', ...Object.keys(STAT_COLUMNS), 'Special Attribute']

function parseValue(raw, lineNo) {
  const s = raw.trim().replace(/,/g, '')
  if (s === '') return null
  const isPercent = s.endsWith('%')
  const n = Number(isPercent ? s.slice(0, -1) : s)
  if (!Number.isFinite(n)) throw new Error(`Unparsable value "${raw}" on line ${lineNo}`)
  return isPercent ? Math.round(n * 100) / 10000 : n
}

export function parseGearCsv(text) {
  const lines = text.split(/\r?\n/)
  const header = lines[0].split(',').map(h => h.trim())
  if (header.join('|') !== EXPECTED_HEADER.join('|')) {
    throw new Error(`Unexpected CSV header: ${header.join(',')}`)
  }
  const statKeys = Object.values(STAT_COLUMNS)

  const stats = {}
  const dropped = []
  const seen = new Set()
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue
    const lineNo = i + 1
    const f = lines[i].split(',')
    if (f.length < EXPECTED_HEADER.length) throw new Error(`Line ${lineNo}: expected ${EXPECTED_HEADER.length} columns, got ${f.length}`)
    const equipment = f[0].trim()
    const slot = SLOT_BY_EQUIPMENT[equipment]
    if (!slot) throw new Error(`Line ${lineNo}: unknown equipment "${equipment}"`)
    const level = Number(f[1]), stars = Number(f[2])
    if (!Number.isInteger(level) || !Number.isInteger(stars)) throw new Error(`Line ${lineNo}: bad level/stars`)
    const key = `${level}:${stars}`
    if (seen.has(`${slot}|${key}`)) throw new Error(`Line ${lineNo}: duplicate ${slot} ${key}`)
    seen.add(`${slot}|${key}`)

    const row = {}
    statKeys.forEach((k, idx) => {
      const v = parseValue(f[3 + idx], lineNo)
      if (v !== null) row[k] = v
    })
    stats[slot] ??= {}
    stats[slot][key] = row
  }

  const kept = {}
  for (const [slot, rows] of Object.entries(stats)) {
    const base = rows['0:0']
    if (!base) throw new Error(`Slot ${slot} has no 0:0 row to define its primary stats`)
    const primary = PRIMARY_KEYS.filter(k => k in base)
    kept[slot] = {}
    for (const [key, row] of Object.entries(rows)) {
      if (Object.keys(row).length === 0) { dropped.push({ slot, key, reason: 'empty row' }); continue }
      const missing = primary.filter(k => !(k in row))
      if (missing.length) { dropped.push({ slot, key, reason: `missing primary stat(s): ${missing.join(', ')}` }); continue }
      kept[slot][key] = row
    }
  }
  return { stats: kept, dropped }
}
```

- [ ] **Step 7: Run the parser tests**

Run: `npx vitest run scripts/csv.test.js`
Expected: PASS (all 7).

- [ ] **Step 8: Write the generator CLI**

Create `scripts/generateGearStats.js`:

```js
import { readFileSync, writeFileSync } from 'node:fs'
import { parseGearCsv } from './csv.js'

const { stats, dropped } = parseGearCsv(readFileSync('data/raw/gear-stats.csv', 'utf8'))
writeFileSync('src/data/gearStats.json', JSON.stringify(stats, null, 1) + '\n')
const rows = Object.values(stats).reduce((n, s) => n + Object.keys(s).length, 0)
console.log(`Wrote src/data/gearStats.json (${rows} usable rows).`)
for (const d of dropped) console.log(`  dropped ${d.slot} ${d.key}: ${d.reason}`)
```

- [ ] **Step 9: Write the failing lookup test, then the lookup**

Create `src/gear/stats.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { getStats } from './stats.js'

describe('getStats', () => {
  it('returns real stats for a known (slot, level, stars)', () => {
    expect(getStats('armor', 0, 0).heroHp).toBe(31355)
    expect(getStats('armor', 40, 5).heroHp).toBe(502245)
  })
  it('returns null for unknown combinations', () => {
    expect(getStats('armor', 40, 1)).toBeNull()
    expect(getStats('armor', 15, 3)).toBeNull()
    expect(getStats('helmet', 0, 0)).toBeNull()
  })
})
```

Run: `node scripts/generateGearStats.js` then `npx vitest run src/gear/stats.test.js`
Expected: generator prints its dropped rows; the test FAILS (no `./stats.js`).

Create `src/gear/stats.js`:

```js
import GEAR_STATS from '../data/gearStats.json'

// Returns the stat object for a piece state, or null when the data has no row for it.
export function getStats(slot, level, stars) {
  return GEAR_STATS[slot]?.[`${level}:${stars}`] ?? null
}
```

- [ ] **Step 10: Run all tests and lint**

Run: `npm test && npm run lint`
Expected: all tests PASS; lint shows no new errors (pre-existing warnings, if any, are unchanged).

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json eslint.config.js data/raw/gear-stats.csv scripts src/data/gearStats.json src/gear
git commit -m "feat: parse datamined gear CSV into a stat lookup

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 2: Upgrade cost tables

This task is data sourcing. Values must come from published tables, never from memory. It can run in parallel with Tasks 3–4.

**Files:**
- Create: `src/data/upgradeCosts.json`, `src/data/upgradeCosts.test.js`

**Interfaces:**
- Produces `upgradeCosts.json`:
```json
{
  "sources": ["<url>", "<url>"],
  "resources": ["<resource>", "..."],
  "level": { "<resource>": { "1": 0, "2": 0, "...": 0, "40": 0 } },
  "stars": { "<resource>": { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 } }
}
```
`level[resource][n]` is the cost of the step **to** level `n` (1–40); `stars[resource][n]` is the cost of the promotion **to** `n` stars (1–5). A resource that an upgrade type doesn't consume is omitted from that section. Numbers above are shape examples only.

- [ ] **Step 1: Write the schema test**

Create `src/data/upgradeCosts.test.js`:

```js
import { describe, it, expect } from 'vitest'
import COSTS from './upgradeCosts.json'

const allPositive = table => Object.values(table).every(v => Number.isFinite(v) && v > 0)

describe('upgradeCosts.json', () => {
  it('lists its sources and resources', () => {
    expect(COSTS.sources.length).toBeGreaterThanOrEqual(2)
    expect(COSTS.resources.length).toBeGreaterThan(0)
  })
  it('every resource appears in level and/or stars, and no undeclared resource does', () => {
    const used = new Set([...Object.keys(COSTS.level), ...Object.keys(COSTS.stars)])
    expect([...used].sort()).toEqual([...COSTS.resources].sort())
  })
  it('level tables cover steps 1–40 with positive numbers', () => {
    for (const [res, table] of Object.entries(COSTS.level)) {
      expect(Object.keys(table).map(Number).sort((a, b) => a - b), res).toEqual(Array.from({ length: 40 }, (_, i) => i + 1))
      expect(allPositive(table), res).toBe(true)
    }
  })
  it('star tables cover promotions 1–5 with positive numbers', () => {
    for (const [res, table] of Object.entries(COSTS.stars)) {
      expect(Object.keys(table).map(Number).sort((a, b) => a - b), res).toEqual([1, 2, 3, 4, 5])
      expect(allPositive(table), res).toBe(true)
    }
  })
})
```

- [ ] **Step 2: Gather costs from at least two independent published sources**

Use WebFetch/WebSearch on the sites named in `docs/gear-roi-research-status.md` that publish cost tables (Last War Handbook, Last War Vault, lastwartutorial.com, etc.). Record, for **legendary** gear: cost per level step 1→40 per resource, and cost per star promotion 1★–5★ per resource. Cross-check every number between two sources. **If two sources disagree, or a value cannot be found in any source, stop and ask the user which to trust or to supply the value from the game. Do not fill gaps with estimates.**

- [ ] **Step 3: Write `src/data/upgradeCosts.json`**

Write it in the schema above with the real numbers and the source URLs in `sources`.

- [ ] **Step 4: Run the schema test**

Run: `npx vitest run src/data/upgradeCosts.test.js`
Expected: PASS. A failure names the missing or malformed level/resource.

- [ ] **Step 5: Commit**

```bash
git add src/data/upgradeCosts.json src/data/upgradeCosts.test.js
git commit -m "feat: add sourced gear upgrade cost tables

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 3: Power-model fitter (tooling only)

Pure, testable tooling. The real fit happens in Task 4.

**Files:**
- Create: `src/gear/power.js`, `src/gear/power.test.js`
- Create: `scripts/nnls.js`, `scripts/nnls.test.js`
- Create: `scripts/fit.js`, `scripts/fit.test.js`
- Create: `scripts/fitPowerModel.js`

**Interfaces:**
- Produces:
  - `STAT_KEYS: string[]` (the ten keys from Task 1, same order)
  - `piecePower(stats: object, weights: object) → number` (missing stat or weight counts as 0)
  - `nnls(A: number[][], y: number[]) → number[]` (rows × cols; minimises ‖A·w − y‖ with w ≥ 0)
  - `buildDesign(lineups, getStats) → { rows: number[][], y: number[], ids: string[], dropped: {id, reason}[] }`
  - `fitPowerModel(design, { maxResidualPct = 0.02 } = {}) → { ok: boolean, reason?: string, weights, merged, activeKeys, residuals: {id, predicted, actual, pct}[], maxResidualPct, rmsResidualPct }`
- Lineup shape: `{ id: string, power: number, pieces: { slot, level, stars }[20] }`.

- [ ] **Step 1: Write failing tests for `piecePower`**

Create `src/gear/power.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { STAT_KEYS, piecePower } from './power.js'

describe('piecePower', () => {
  it('sums weight × stat, treating missing values as 0', () => {
    expect(piecePower({ heroAttack: 100, heroHp: 10 }, { heroAttack: 2, heroHp: 0.5, critRate: 99 })).toBe(205)
  })
  it('exposes the ten stat keys', () => {
    expect(STAT_KEYS).toHaveLength(10)
  })
})
```
Run: `npx vitest run src/gear/power.test.js` — Expected: FAIL (no module).

- [ ] **Step 2: Implement `power.js`**

Create `src/gear/power.js`:

```js
export const STAT_KEYS = [
  'heroAttack', 'critRate', 'heroDefense', 'heroHp',
  'boostAttack', 'boostHp', 'boostDefense',
  'resistAll', 'resistPhysical', 'resistEnergy',
]

export function piecePower(stats, weights) {
  let total = 0
  for (const k of STAT_KEYS) total += (stats[k] ?? 0) * (weights[k] ?? 0)
  return total
}
```
Run the test again — Expected: PASS.

- [ ] **Step 3: Write the failing NNLS test**

Create `scripts/nnls.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { nnls } from './nnls.js'

function lcg(seed) {
  let s = seed
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296
}

describe('nnls', () => {
  it('recovers known non-negative weights from exact data at very different column scales', () => {
    const rand = lcg(7)
    const truth = [0.002, 35, 0, 1200]
    const scales = [100000, 1000, 50, 0.1]
    const A = Array.from({ length: 30 }, () => scales.map(sc => rand() * sc))
    const y = A.map(r => r.reduce((s, v, j) => s + v * truth[j], 0))
    const w = nnls(A, y)
    truth.forEach((t, j) => expect(w[j]).toBeCloseTo(t, 4))
  })

  it('never returns a negative weight', () => {
    const A = [[1, 0], [0, 1], [1, 1]]
    const y = [1, -5, -2]
    expect(nnls(A, y).every(v => v >= 0)).toBe(true)
  })
})
```
Run: `npx vitest run scripts/nnls.test.js` — Expected: FAIL (no module).

- [ ] **Step 4: Implement `nnls.js`**

Create `scripts/nnls.js`:

```js
// Non-negative least squares by cyclic coordinate descent on unit-normalised columns.
export function nnls(A, y, maxSweeps = 200000, tol = 1e-13) {
  const m = A.length
  const n = A[0].length
  const norms = Array.from({ length: n }, (_, j) => Math.sqrt(A.reduce((s, r) => s + r[j] * r[j], 0)))
  const B = A.map(r => r.map((v, j) => (norms[j] > 0 ? v / norms[j] : 0)))
  const w = new Array(n).fill(0)
  const r = y.slice()
  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let maxStep = 0
    for (let j = 0; j < n; j++) {
      if (norms[j] === 0) continue
      let g = 0
      for (let i = 0; i < m; i++) g += B[i][j] * r[i]
      const next = Math.max(0, w[j] + g)
      const d = next - w[j]
      if (d !== 0) {
        for (let i = 0; i < m; i++) r[i] -= B[i][j] * d
        w[j] = next
        maxStep = Math.max(maxStep, Math.abs(d))
      }
    }
    if (maxStep < tol) break
  }
  return w.map((v, j) => (norms[j] > 0 ? v / norms[j] : 0))
}
```
Run: `npx vitest run scripts/nnls.test.js` — Expected: PASS. If the first test is off by more than 4 decimals, raise `maxSweeps` before loosening the test.

- [ ] **Step 5: Write failing tests for the fitter**

Create `scripts/fit.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { buildDesign, fitPowerModel } from './fit.js'

// Fake stats: attack scales with level; hp depends on slot; boostHp and boostDefense always equal.
const fakeStats = (slot, level, stars) => {
  if (level === 99) return null
  return {
    heroAttack: 100 + level * 10 + stars * 500,
    heroHp: slot === 'armor' ? 1000 + level * 100 : 200 + level * 5,
    boostHp: 0.01 * (stars + 1),
    boostDefense: 0.01 * (stars + 1),
  }
}
const SLOTS = ['gun', 'chip', 'armor', 'radar']
const truth = { heroAttack: 3, heroHp: 0.4, boostHp: 50000 }

function makeLineup(id, seed, border = 'orange', level = null) {
  const pieces = Array.from({ length: 20 }, (_, i) => ({
    slot: SLOTS[i % 4],
    level: level ?? ((seed * 7 + i * 3) % 41),
    stars: (seed + i) % 6,
    border,
  }))
  const power = pieces.reduce((sum, p) => {
    const s = fakeStats(p.slot, p.level, p.stars)
    return sum + s.heroAttack * truth.heroAttack + s.heroHp * truth.heroHp + s.boostHp * truth.boostHp
  }, 0)
  return { id, power, pieces }
}

describe('buildDesign', () => {
  it('drops lineups with the wrong border or with a piece that has no stats', () => {
    const wrongBorder = makeLineup('red', 1, 'red')
    const noStats = makeLineup('nostats', 2, 'orange', 99)
    const ok = makeLineup('ok', 3)
    const d = buildDesign([wrongBorder, noStats, ok], fakeStats, 'orange')
    expect(d.ids).toEqual(['ok'])
    expect(d.dropped.map(x => x.id).sort()).toEqual(['nostats', 'red'])
  })
  it('throws when a lineup does not have 20 pieces or has no power', () => {
    const bad = { id: 'x', power: 5, pieces: [] }
    expect(() => buildDesign([bad], fakeStats, 'orange')).toThrow(/20 pieces/)
    const noPower = { ...makeLineup('p', 1), power: 0 }
    expect(() => buildDesign([noPower], fakeStats, 'orange')).toThrow(/power/)
  })
})

describe('fitPowerModel', () => {
  const lineups = Array.from({ length: 24 }, (_, i) => makeLineup(`l${i}`, i))

  it('recovers known weights, merging the proportional boostHp/boostDefense columns', () => {
    const fit = fitPowerModel(buildDesign(lineups, fakeStats, 'orange'))
    expect(fit.ok).toBe(true)
    expect(fit.weights.heroAttack).toBeCloseTo(3, 3)
    expect(fit.weights.heroHp).toBeCloseTo(0.4, 3)
    expect(fit.weights.boostHp).toBeCloseTo(50000, 0)
    expect(fit.merged).toEqual({ boostDefense: 'boostHp' })
    expect(fit.weights.boostDefense).toBe(0)
    expect(fit.maxResidualPct).toBeLessThan(1e-6)
  })

  it('fails the quality gate on noisy data and does not report ok', () => {
    const noisy = lineups.map((l, i) => ({ ...l, power: l.power * (i % 2 ? 1.2 : 0.8) }))
    const fit = fitPowerModel(buildDesign(noisy, fakeStats, 'orange'))
    expect(fit.ok).toBe(false)
    expect(fit.reason).toMatch(/residual/i)
  })

  it('refuses an underdetermined fit', () => {
    const few = lineups.slice(0, 3)
    const fit = fitPowerModel(buildDesign(few, fakeStats, 'orange'))
    expect(fit.ok).toBe(false)
    expect(fit.reason).toMatch(/underdetermined/i)
  })
})
```
Run: `npx vitest run scripts/fit.test.js` — Expected: FAIL (no module).

- [ ] **Step 6: Implement `fit.js`**

Create `scripts/fit.js`:

```js
import { nnls } from './nnls.js'
import { STAT_KEYS } from '../src/gear/power.js'

export function buildDesign(lineups, getStats, border) {
  const rows = [], y = [], ids = [], dropped = []
  for (const l of lineups) {
    if (l.pieces.length !== 20) throw new Error(`lineup ${l.id}: expected 20 pieces, got ${l.pieces.length}`)
    if (!(l.power > 0)) throw new Error(`lineup ${l.id}: power must be a positive number`)
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
```
Run: `npx vitest run scripts/fit.test.js` — Expected: PASS (all 5).

- [ ] **Step 7: Write the CLI**

Create `scripts/fitPowerModel.js`:

```js
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { buildDesign, fitPowerModel } from './fit.js'
import { piecePower } from '../src/gear/power.js'

const flag = process.argv.indexOf('--border')
const border = flag > -1 ? process.argv[flag + 1] : null
if (!border) {
  console.error('Usage: node scripts/fitPowerModel.js --border <color>   (the gear border color the CSV stats were measured on)')
  process.exit(2)
}

const GEAR = JSON.parse(readFileSync('src/data/gearStats.json', 'utf8'))
const getStats = (slot, level, stars) => GEAR[slot]?.[`${level}:${stars}`] ?? null
const lineups = JSON.parse(readFileSync('data/raw/battleReports.json', 'utf8'))

const design = buildDesign(lineups, getStats, border)
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
  fit: { border, lineups: design.ids.length, maxResidualPct: fit.maxResidualPct, rmsResidualPct: fit.rmsResidualPct },
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
```

- [ ] **Step 8: Run the full suite and lint, then commit**

Run: `npm test && npm run lint`
Expected: PASS.

```bash
git add src/gear/power.js src/gear/power.test.js scripts/nnls.js scripts/nnls.test.js scripts/fit.js scripts/fit.test.js scripts/fitPowerModel.js
git commit -m "feat: add Power-model fitter with quality gate

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 4: Transcribe battle reports and fit the model (needs the user)

**Files:**
- Create: `data/raw/battleReports.json`
- Create (optional but recommended): `data/raw/powerChecks.json`
- Create: `src/data/powerModel.json` (generated)

**Interfaces:**
- Consumes: `fitPowerModel` CLI from Task 3, `gearStats.json` from Task 1.
- Produces: `src/data/powerModel.json` with `{ weights, merged, fit }`, required by Task 5.

This task cannot be finished by an agent alone: the screenshots live in `~/Downloads/Battle Report/` (7 reports, ~15–19 screenshots each) and the gear page is the one titled **Gear** with "Power: N" at the top.

- [ ] **Step 1: Confirm the two open questions with the user**

(a) Resolved 2026-09-20: red/orange borders are just the star tier (orange = gold gear below 5★, red = 5★ mythic); there is no border field or filter. (b) Still open: does the game show a Power number on a single piece or upgrade screen? Record the answer at the end of the spec's "Open questions" section.

- [ ] **Step 2: Transcribe one lineup per side per report**

Each report's Gear page has two sides. For each side, one object in `data/raw/battleReports.json` (a JSON array):

```json
{
  "id": "attack1-me",
  "power": 6400000,
  "pieces": [
    { "slot": "gun", "level": 40, "stars": 5 }
  ]
}
```
`pieces` must list all 20 pieces (5 heroes × 4 slots). `slot` is `gun|chip|armor|radar`. Identify slots from the piece icon (Railgun→gun, Data Chip→chip, Armor→armor, Radar→radar). `stars` is the count of filled gold dots. `power` is the "Power: 6.4M" header of that side written as a full number (the game only shows 2–3 significant digits, so ±0.8% rounding error is expected and is inside the gate). The user does this; an agent can draft it from the screenshots but every row must be checked by the user.

- [ ] **Step 3: Record in-game checks (recommended)**

For 3–5 real upgrades the user performs, note total-power-before/after on any screen that shows it, into `data/raw/powerChecks.json`:

```json
[
  { "slot": "armor", "from": { "level": 39, "stars": 0 }, "to": { "level": 40, "stars": 0 }, "powerBefore": 0, "powerAfter": 0 }
]
```
(The zeros above only show the shape; use measured values.)

- [ ] **Step 4: Run the fit**

Run: `node scripts/fitPowerModel.js`
Expected: usable-lineup count, per-lineup residuals, and either `Wrote src/data/powerModel.json` or `FAILED quality gate` with the reason.

- [ ] **Step 5: Handle a failure honestly**

- "underdetermined": transcribe more lineups, or fill more CSV rows so fewer lineups are dropped (the run prints each dropped lineup and its reason).
- "max residual … exceeds the 2% gate": look at which lineups are worst. First check for transcription errors. If residuals are systematic, try a per-slot or per-stat-exponent model in `scripts/fit.js` (a new test first), or stop and report that Power is not fit by the current CSV; do not loosen the gate to make it pass.

- [ ] **Step 6: Compare the in-game checks**

The CLI prints predicted vs measured deltas. Report them to the user. A large disagreement is a finding to discuss, not something to hide.

- [ ] **Step 7: Commit**

```bash
git add data/raw/battleReports.json src/data/powerModel.json
git add data/raw/powerChecks.json 2>/dev/null
git commit -m "feat: fit gear Power model from battle reports

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 5: ROI engine

**Prerequisites:** Task 1 (`gearStats.json`), Task 2 (`upgradeCosts.json`), Task 4 (`powerModel.json`) must exist, because `roi.js` imports them. Tests inject fixtures, so they do not depend on real numbers.

**Files:**
- Create: `src/gear/constants.js`, `src/gear/roi.js`, `src/gear/roi.test.js`

**Interfaces:**
- Consumes: `getStats`, `piecePower(stats, weights)`, `powerModel.json`, `upgradeCosts.json`.
- Produces:
  - `QUALITY_MAX_LEVEL = { legendary: 40, epic: 30, rare: 15, common: 10 }`
  - `RESOURCES: string[]` (from `upgradeCosts.json`)
  - `powerGain(piece, upgrade, deps?) → number | null`
  - `upgradeCost(upgrade, resource, deps?) → number | null` (returns `0` when the resource has no table for that upgrade type; `null` when the table exists but lacks that step)
  - `roiOf(gain, cost) → number | null` (`null` if either is `null` or `cost <= 0`)
  - `rankUpgrades(assigned, resource, deps?) → item[]` (a star promotion is offered only when `piece.level >= QUALITY_MAX_LEVEL[piece.quality]`, because promotions unlock at max level) where `item = { type: 'level'|'stars', slot, heroId, from, to, blueprintWarning, reason, score, roi, powerGain, cost, resource }`, sorted by `roi` descending with `roi === null` items last
  - `coverage(gear) → { covered, total }`
  - `piece = { slot, quality, level, stars }`, `upgrade = { type: 'level'|'stars', from, to }`, `deps = { getStats, weights, costs }`, `assigned = { [heroId]: { gun, chip, armor, radar } }` (pieces or `null`).

- [ ] **Step 1: Shared constant**

Create `src/gear/constants.js`:

```js
export const QUALITY_MAX_LEVEL = { legendary: 40, epic: 30, rare: 15, common: 10 }
```

- [ ] **Step 2: Write the failing tests**

Create `src/gear/roi.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { powerGain, upgradeCost, roiOf, rankUpgrades, coverage } from './roi.js'

// Fixture stats: gun attack rises 10/level with a +100 jump when reaching level 10; 1 star adds 5000 at level 40.
const getStats = (slot, level, stars) => {
  if (slot !== 'gun') return null
  if (level < 0 || level > 40) return null
  if (stars > 0 && level !== 40) return null
  if (stars === 2) return null // unknown in this fixture
  return { heroAttack: level * 10 + (level >= 10 ? 100 : 0) + stars * 5000 }
}
const costs = {
  resources: ['gold', 'blueprints'],
  level: { gold: Object.fromEntries(Array.from({ length: 40 }, (_, i) => [i + 1, 10])) },
  stars: { blueprints: { 1: 5, 2: 5, 3: 5, 4: 5, 5: 5 } },
}
const deps = { getStats, weights: { heroAttack: 1 }, costs }
const gun = (level, stars = 0, quality = 'legendary') => ({ slot: 'gun', quality, level, stars })

describe('powerGain', () => {
  it('is the Power difference between two known states', () => {
    expect(powerGain(gun(9), { type: 'level', from: 9, to: 10 }, deps)).toBe(110)
    expect(powerGain(gun(40), { type: 'stars', from: 0, to: 1 }, deps)).toBe(5000)
  })
  it('is null when either state has no stats', () => {
    expect(powerGain(gun(40, 1), { type: 'stars', from: 1, to: 2 }, deps)).toBeNull()
    expect(powerGain(gun(20), { type: 'stars', from: 0, to: 1 }, deps)).toBeNull()
    expect(powerGain({ slot: 'chip', quality: 'legendary', level: 1, stars: 0 }, { type: 'level', from: 1, to: 2 }, deps)).toBeNull()
  })
  it('is null for non-legendary pieces', () => {
    expect(powerGain(gun(9, 0, 'epic'), { type: 'level', from: 9, to: 10 }, deps)).toBeNull()
  })
})

describe('upgradeCost', () => {
  it('reads the step cost for the chosen resource', () => {
    expect(upgradeCost({ type: 'level', from: 9, to: 10 }, 'gold', deps)).toBe(10)
    expect(upgradeCost({ type: 'stars', from: 0, to: 1 }, 'blueprints', deps)).toBe(5)
  })
  it('is 0 when the resource has no table for that upgrade type, null when the step is missing', () => {
    expect(upgradeCost({ type: 'level', from: 9, to: 10 }, 'blueprints', deps)).toBe(0)
    const gappy = { ...costs, level: { gold: { 1: 10 } } }
    expect(upgradeCost({ type: 'level', from: 9, to: 10 }, 'gold', { ...deps, costs: gappy })).toBeNull()
  })
})

describe('roiOf', () => {
  it('divides gain by cost and refuses null or zero inputs', () => {
    expect(roiOf(110, 10)).toBe(11)
    expect(roiOf(null, 10)).toBeNull()
    expect(roiOf(110, null)).toBeNull()
    expect(roiOf(110, 0)).toBeNull()
  })
})

describe('rankUpgrades', () => {
  const assigned = { h1: { gun: gun(9), chip: null, armor: null, radar: null }, h2: { gun: gun(10), chip: null, armor: null, radar: null } }

  it('ranks the milestone step (level 9→10) above a smooth step', () => {
    const list = rankUpgrades(assigned, 'gold', deps)
    const levelItems = list.filter(i => i.type === 'level')
    expect(levelItems[0]).toMatchObject({ heroId: 'h1', from: 9, to: 10, roi: 11 })
    expect(levelItems[1]).toMatchObject({ heroId: 'h2', from: 10, to: 11, roi: 1 })
  })

  it('puts items without an ROI last and keeps them in the list', () => {
    const withNoRoi = { ...assigned, h3: { gun: gun(9, 0, 'epic'), chip: null, armor: null, radar: null } }
    const list = rankUpgrades(withNoRoi, 'gold', deps)
    const firstNull = list.findIndex(i => i.roi === null)
    expect(firstNull).toBeGreaterThan(0)
    expect(list.slice(firstNull).every(i => i.roi === null)).toBe(true)
  })

  it('switches ranking when the limiting resource changes', () => {
    const forty = { h: { gun: gun(40), chip: null, armor: null, radar: null } }
    const byBlueprints = rankUpgrades(forty, 'blueprints', deps)
    expect(byBlueprints[0]).toMatchObject({ type: 'stars', to: 1, roi: 1000, resource: 'blueprints' })
    expect(byBlueprints.every(i => i.type !== 'level' || i.roi === null)).toBe(true)
  })

  it('only offers a star promotion once the piece is at max level', () => {
    const list = rankUpgrades({ h: { gun: gun(20), chip: null, armor: null, radar: null } }, 'gold', deps)
    expect(list.every(i => i.type === 'level')).toBe(true)
    const atMax = rankUpgrades({ h: { gun: gun(40), chip: null, armor: null, radar: null } }, 'gold', deps)
    expect(atMax.some(i => i.type === 'stars')).toBe(true)
  })

  it('does not offer level steps past the quality max or star steps past 5', () => {
    const list = rankUpgrades({ h: { gun: gun(40, 5), chip: null, armor: null, radar: null } }, 'gold', deps)
    expect(list).toEqual([])
  })

  it('flags star upgrades with the blueprint warning', () => {
    const list = rankUpgrades({ h: { gun: gun(40), chip: null, armor: null, radar: null } }, 'blueprints', deps)
    expect(list.find(i => i.type === 'stars').blueprintWarning).toBe(true)
  })
})

describe('coverage', () => {
  it('counts legendary pieces whose current state has stats', () => {
    const gear = [gun(9), gun(20, 1), gun(9, 0, 'epic'), { slot: 'chip', quality: 'legendary', level: 1, stars: 0 }]
    expect(coverage(gear, deps)).toEqual({ covered: 1, total: 4 })
  })
})
```
Run: `npx vitest run src/gear/roi.test.js` — Expected: FAIL (no module).

- [ ] **Step 3: Implement `roi.js`**

Create `src/gear/roi.js`:

```js
import { getStats as defaultGetStats } from './stats.js'
import { piecePower } from './power.js'
import { QUALITY_MAX_LEVEL } from './constants.js'
import POWER_MODEL from '../data/powerModel.json'
import UPGRADE_COSTS from '../data/upgradeCosts.json'

export const RESOURCES = UPGRADE_COSTS.resources

const DEFAULT_DEPS = { getStats: defaultGetStats, weights: POWER_MODEL.weights, costs: UPGRADE_COSTS }

export function powerGain(piece, upgrade, deps = DEFAULT_DEPS) {
  if (piece.quality !== 'legendary') return null
  const at = (level, stars) => deps.getStats(piece.slot, level, stars)
  const before = upgrade.type === 'level' ? at(upgrade.from, piece.stars) : at(piece.level, upgrade.from)
  const after = upgrade.type === 'level' ? at(upgrade.to, piece.stars) : at(piece.level, upgrade.to)
  if (!before || !after) return null
  return piecePower(after, deps.weights) - piecePower(before, deps.weights)
}

// 0 = this resource is not consumed by this upgrade type; null = the table exists but lacks this step.
export function upgradeCost(upgrade, resource, deps = DEFAULT_DEPS) {
  const table = deps.costs[upgrade.type === 'level' ? 'level' : 'stars']?.[resource]
  if (!table) return 0
  const v = table[upgrade.to]
  return typeof v === 'number' ? v : null
}

export function roiOf(gain, cost) {
  if (gain === null || cost === null || cost <= 0) return null
  return gain / cost
}

function describe(upgrade) {
  if (upgrade.type === 'stars') return `${upgrade.to}★ promotion`
  return upgrade.to % 10 === 0 ? `Hits Lv ${upgrade.to} milestone` : 'Power per resource'
}

export function rankUpgrades(assigned, resource, deps = DEFAULT_DEPS) {
  const items = []
  for (const [heroId, slots] of Object.entries(assigned)) {
    for (const [slot, piece] of Object.entries(slots)) {
      if (!piece) continue
      const upgrades = []
      const maxLevel = QUALITY_MAX_LEVEL[piece.quality] ?? 40
      if (piece.level < maxLevel) upgrades.push({ type: 'level', from: piece.level, to: piece.level + 1 })
      // Star promotions only unlock once a piece is at its max level.
      if (piece.stars < 5 && piece.level >= maxLevel) upgrades.push({ type: 'stars', from: piece.stars, to: piece.stars + 1 })
      for (const upgrade of upgrades) {
        const gain = powerGain(piece, upgrade, deps)
        const cost = upgradeCost(upgrade, resource, deps)
        const roi = roiOf(gain, cost)
        items.push({
          type: upgrade.type, slot, heroId, from: upgrade.from, to: upgrade.to,
          blueprintWarning: upgrade.type === 'stars',
          reason: describe(upgrade), score: roi ?? 0,
          roi, powerGain: gain, cost, resource,
        })
      }
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
  const covered = gear.filter(p => p.quality === 'legendary' && deps.getStats(p.slot, p.level, p.stars) !== null).length
  return { covered, total: gear.length }
}
```

- [ ] **Step 4: Run tests and lint**

Run: `npm test && npm run lint`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/gear
git commit -m "feat: ROI engine ranking upgrades by Power per resource

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

### Task 6: Wire ROI into the app

**Files:**
- Modify: `src/App.jsx` (imports; `QUALITY_MAX_LEVEL` at line 136; `maxEfficiencyUpgrades` ~429–459; `computeUpgradePriority` ~506; initial state ~610–635; reducer ~675; `UpgradePriority` ~921; call site ~1811; help text near the `MAX EFF` row)

**Interfaces:**
- Consumes: `rankUpgrades(assigned, resource)`, `coverage(gear)`, `RESOURCES`, `QUALITY_MAX_LEVEL` from Task 5.
- Produces: state field `limitingResource` (UI state, not persisted in profiles) and reducer action `SET_LIMITING_RESOURCE`.

- [ ] **Step 1: Imports and shared constant**

Near the top of `src/App.jsx` with the other imports add:

```js
import { QUALITY_MAX_LEVEL } from './gear/constants.js'
import { RESOURCES, rankUpgrades, coverage } from './gear/roi.js'
```
Delete the local `const QUALITY_MAX_LEVEL = { legendary: 40, epic: 30, rare: 15, common: 10 }` (line 136); the imported one replaces it.

- [ ] **Step 2: Replace the invented max-efficiency ranking**

Delete the whole `maxEfficiencyUpgrades(assigned, heroScores)` function. In `computeUpgradePriority`, change the signature and first branch:

```js
function computeUpgradePriority(assigned, heroScores, mode, intent, hasEW5, resource) {
  let list = []
  if (mode === 'max_efficiency') list = rankUpgrades(assigned, resource)
  else if (mode === 'role_based') list = roleBasedUpgrades(assigned)
  else list = weakestLinkUpgrades(assigned, heroScores)
```
(`pieceScore`, `QUALITY_WEIGHTS` and `RARITY_WEIGHTS` stay: `assignGear` and `weakestLinkUpgrades` and `heroScore` still use them.)

- [ ] **Step 3: State and reducer**

In `buildInitialState`, add `limitingResource: RESOURCES[0],` next to **both** `upgradeMode: 'max_efficiency',` lines. In the reducer, after `case 'SET_UPGRADE_MODE'`:

```js
    case 'SET_LIMITING_RESOURCE':
      return { ...state, limitingResource: action.payload }
```

- [ ] **Step 4: Call site**

Replace the `upgradePriority` memo in the root component:

```js
  const upgradePriority = useMemo(
    () => computeUpgradePriority(gearAssignment.assigned, heroScores, state.upgradeMode, state.intent, hasSquadEW5, state.limitingResource),
    [gearAssignment.assigned, heroScores, state.upgradeMode, state.intent, hasSquadEW5, state.limitingResource]
  )
```

- [ ] **Step 5: Selector, coverage banner, ROI line**

Add above `UpgradePriority`:

```jsx
function RoiLine({ item }) {
  if (!('roi' in item)) return null
  if (item.roi === null) {
    return <p className="font-orbitron text-xs text-neutral-600">No ROI — missing data or doesn't use {item.resource}</p>
  }
  return (
    <p className="font-orbitron text-xs text-emerald-600">
      +{Math.round(item.powerGain).toLocaleString()} power · {item.cost.toLocaleString()} {item.resource} · {item.roi.toPrecision(3)} per {item.resource}
    </p>
  )
}
```

Inside `UpgradePriority`, directly after the closing `</div>` of the mode-button row (the `<div className="flex gap-1 mb-4">…</div>`), insert:

```jsx
      {state.upgradeMode === 'max_efficiency' && (() => {
        const cov = coverage(state.gear)
        return (
          <div className="mb-4">
            <p className="font-orbitron text-xs text-neutral-500 mb-1">LIMITING RESOURCE</p>
            <div className="flex gap-1 flex-wrap">
              {RESOURCES.map(r => (
                <button key={r} onClick={() => dispatch({ type: 'SET_LIMITING_RESOURCE', payload: r })}
                  className={`px-3 py-2 font-orbitron text-xs border min-h-[40px] uppercase transition-colors
                    ${state.limitingResource === r ? 'border-amber-600 text-amber-600 bg-amber-600/10' : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'}`}>
                  {r}
                </button>
              ))}
            </div>
            <p className="font-rajdhani text-xs text-neutral-600 mt-1">
              {cov.covered}/{cov.total} gear pieces have stat data. Pieces or upgrades without data show no ROI and sort last.
            </p>
          </div>
        )
      })()}
```

In the two item renderers (level and stars), add `<RoiLine item={item} />` right after each `<p className="font-orbitron text-xs text-neutral-500">{item.reason}</p>` line.

- [ ] **Step 6: Update the in-app help text**

Run `grep -n "MAX EFF" src/App.jsx`. In the help `Row` for `MAX EFF`, replace the description with: `Ranks each upgrade by Power gained per unit of the limiting resource you pick (gold, ore, ...). Uses real datamined stats; upgrades without data show no ROI.` Keep the existing `Row` element and props.

- [ ] **Step 7: Build and lint**

Run: `npm test && npm run lint && npm run build`
Expected: tests pass, no new lint errors, build succeeds.

- [ ] **Step 8: Verify in the running app**

Run `npm run dev` and open the printed URL. In the UI: own 5+ heroes, add a **Legendary** piece for each slot (one at Lv 9 with 0★, one at Lv 40 with 0★), go to the Upgrades section in MAX EFF mode.
Check: the LIMITING RESOURCE buttons match `upgradeCosts.json` resources; switching the resource re-sorts the list; covered upgrades show `+N power · cost · roi`; a level step with unknown data or a resource it doesn't consume shows "No ROI …" and sorts last; ROLE and W-LINK modes look and behave as before (no ROI line, no selector). State in the final report exactly what was exercised. If the app can't be opened here, say so instead of claiming it works.

- [ ] **Step 9: Update the research doc and commit**

In `docs/gear-roi-research-status.md`, add a short section "Implemented 2026-09-20" pointing to the spec and this plan and stating what data gaps still limit coverage (from the generator's `dropped` output).

```bash
git add src/App.jsx docs/gear-roi-research-status.md
git commit -m "feat: rank max-efficiency upgrades by Power per limiting resource

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Spec coverage check

| Spec requirement | Task |
|---|---|
| `gearStats` from CSV, unknown → null, fails on duplicates/unparsable | 1 |
| `upgradeCosts` per resource, sourced | 2 |
| Fitter, NNLS, proportional-column merge, quality gate, lineups dropped when stats missing | 3 |
| Transcription, in-game validation, open question (per-piece Power) | 4 |
| `roi.js`: gain ÷ cost, `null` on missing data, resource selection, milestone > smooth | 5 |
| UI selector, coverage banner, no-data rows last, max-efficiency only | 6 |
| Role-based / Weakest-link / `heroScore` untouched | 6 (Global Constraints) |
| Drone ROI, hero-role weighting | Out of scope |

**Deviation from the spec, on purpose:** the spec says the invented gear weights are "removed from gear scoring". `pieceScore` (which uses them) is still used by `assignGear` and Weakest-link to order pieces, and those are out of scope, so it stays. Only max-efficiency ranking stops using it.
