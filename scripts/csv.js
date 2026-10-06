import { stateKey } from '../src/gear/state.js'

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
// Same, with an optional Sub column (sub-upgrade step 0-4; blank = 4, the top of the tier).
const EXPECTED_HEADER_SUB = ['Equipment', 'Level', 'Stars', 'Sub', ...EXPECTED_HEADER.slice(3)]

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
  const hasSub = header.join('|') === EXPECTED_HEADER_SUB.join('|')
  if (!hasSub && header.join('|') !== EXPECTED_HEADER.join('|')) {
    throw new Error(`Unexpected CSV header: ${header.join(',')}`)
  }
  const first = hasSub ? 4 : 3 // index of the first stat column
  const statKeys = Object.values(STAT_COLUMNS)

  const stats = {}
  const dropped = []
  const seen = new Set()
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue
    const lineNo = i + 1
    const f = lines[i].split(',')
    if (f.length < header.length) throw new Error(`Line ${lineNo}: expected ${header.length} columns, got ${f.length}`)
    const equipment = f[0].trim()
    const slot = SLOT_BY_EQUIPMENT[equipment]
    if (!slot) throw new Error(`Line ${lineNo}: unknown equipment "${equipment}"`)
    const level = Number(f[1]), stars = Number(f[2])
    if (!Number.isInteger(level) || !Number.isInteger(stars)) throw new Error(`Line ${lineNo}: bad level/stars`)
    const subRaw = hasSub ? f[3].trim() : ''
    const sub = subRaw === '' ? 4 : Number(subRaw)
    if (subRaw !== '' && level < 40) throw new Error(`Line ${lineNo}: sub-upgrades only exist at level 40`)
    let key
    try { key = stateKey(level, stars, sub) } catch (e) { throw new Error(`Line ${lineNo}: ${e.message}`) }
    if (seen.has(`${slot}|${key}`)) throw new Error(`Line ${lineNo}: duplicate ${slot} ${key}`)
    seen.add(`${slot}|${key}`)

    const row = {}
    statKeys.forEach((k, idx) => {
      const v = parseValue(f[first + idx], lineNo)
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
