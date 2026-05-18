import { useState, useReducer, useMemo, useEffect } from 'react'

// ═══════════════════════════════════════════════════════════════════
// SECTION 1: GAME DATA
// ═══════════════════════════════════════════════════════════════════

const HEROES = {
  // UR heroes
  kimberly: { id: 'kimberly', name: 'Kimberly', rarity: 'UR', unitType: 'tank', role: 'dps', defaultRow: 'front', promotionSeason: null },
  dva:      { id: 'dva',      name: 'DVA',      rarity: 'UR', unitType: 'missile', role: 'dps', defaultRow: 'back', promotionSeason: null },
  williams: { id: 'williams', name: 'Williams', rarity: 'UR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: null },
  murphy:   { id: 'murphy',   name: 'Murphy',   rarity: 'UR', unitType: 'tank', role: 'tank', defaultRow: 'back', promotionSeason: null },
  marshall: { id: 'marshall', name: 'Marshall', rarity: 'UR', unitType: 'tank', role: 'support', defaultRow: 'back', promotionSeason: null },
  tesla:    { id: 'tesla',    name: 'Tesla',    rarity: 'UR', unitType: 'missile', role: 'dps', defaultRow: 'back', promotionSeason: null },
  morrison: { id: 'morrison', name: 'Morrison', rarity: 'UR', unitType: 'aircraft', role: 'dps', defaultRow: 'back', promotionSeason: null },
  // SSR heroes
  mason:    { id: 'mason',    name: 'Mason',    rarity: 'SSR', unitType: 'tank', role: 'dps', defaultRow: 'back', promotionSeason: 1 },
  violet:   { id: 'violet',   name: 'Violet',   rarity: 'SSR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: 2 },
  scarlett: { id: 'scarlett', name: 'Scarlett', rarity: 'SSR', unitType: 'aircraft', role: 'dps', defaultRow: 'back', promotionSeason: 3 },
  venom:    { id: 'venom',    name: 'Venom',    rarity: 'SSR', unitType: 'missile', role: 'dps', defaultRow: 'back', promotionSeason: 4 },
  schuyler: { id: 'schuyler', name: 'Schuyler', rarity: 'SSR', unitType: 'aircraft', role: 'dps', defaultRow: 'back', promotionSeason: null },
  fiona:    { id: 'fiona',    name: 'Fiona',    rarity: 'SSR', unitType: 'missile', role: 'dps', defaultRow: 'back', promotionSeason: null },
  sarah:    { id: 'sarah',    name: 'Sarah',    rarity: 'SSR', unitType: 'aircraft', role: 'support', defaultRow: 'back', promotionSeason: null },
  lucius:   { id: 'lucius',   name: 'Lucius',   rarity: 'SSR', unitType: 'aircraft', role: 'tank', defaultRow: 'front', promotionSeason: null },
  carlie:   { id: 'carlie',   name: 'Carlie',   rarity: 'SSR', unitType: 'aircraft', role: 'tank', defaultRow: 'front', promotionSeason: null },
  stetmann: { id: 'stetmann', name: 'Stetmann', rarity: 'SSR', unitType: 'tank', role: 'dps', defaultRow: 'front', promotionSeason: null },
  mcgregor: { id: 'mcgregor', name: 'McGregor', rarity: 'SSR', unitType: 'missile', role: 'tank', defaultRow: 'front', promotionSeason: null },
  adam:     { id: 'adam',     name: 'Adam',     rarity: 'SSR', unitType: 'missile', role: 'tank', defaultRow: 'front', promotionSeason: null },
  swift:    { id: 'swift',    name: 'Swift',    rarity: 'SSR', unitType: 'missile', role: 'dps', defaultRow: 'back', promotionSeason: null },
  richard:  { id: 'richard',  name: 'Richard',  rarity: 'SSR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: null },
  elsa:     { id: 'elsa',     name: 'Elsa',     rarity: 'SSR', unitType: 'missile', role: 'support', defaultRow: 'back', promotionSeason: null },
  maxwell:  { id: 'maxwell',  name: 'Maxwell',  rarity: 'SSR', unitType: 'aircraft', role: 'dps', defaultRow: 'back', promotionSeason: null },
  // SR heroes
  drake:    { id: 'drake',    name: 'Drake',    rarity: 'SR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: null },
  kane:     { id: 'kane',     name: 'Kane',     rarity: 'SR', unitType: 'missile', role: 'dps', defaultRow: 'back', promotionSeason: null },
  ambolt:   { id: 'ambolt',   name: 'Ambolt',   rarity: 'SR', unitType: 'aircraft', role: 'support', defaultRow: 'back', promotionSeason: null },
}

// Ordered for roster display: UR → SSR → SR
const HERO_ORDER = [
  'kimberly','dva','williams','murphy','marshall','tesla','morrison',
  'mason','violet','scarlett','venom','schuyler','fiona','sarah',
  'lucius','carlie','stetmann','mcgregor','adam','swift','richard','elsa','maxwell',
  'drake','kane','ambolt',
]

const SLOTS = ['gun', 'chip', 'armor', 'radar']
const QUALITIES = ['legendary', 'epic', 'rare', 'common']
const QUALITY_WEIGHTS = { legendary: 4, epic: 2, rare: 1, common: 0.5 }
const RARITY_WEIGHTS = { UR: 3, SSR: 2, SR: 1 }

// Slot priority order by hero role for gear assignment
const SLOT_PRIORITY = {
  dps:     ['gun', 'chip', 'radar', 'armor'],
  tank:    ['armor', 'radar', 'gun', 'chip'],
  support: ['radar', 'chip', 'armor', 'gun'],
}

// Unit type → Tailwind color tokens
const UNIT_COLORS = {
  tank:     { border: 'border-amber-600',    bg: 'bg-amber-600',    text: 'text-amber-600',    label: 'TANK VEH' },
  aircraft: { border: 'border-sky-500',      bg: 'bg-sky-500',      text: 'text-sky-500',      label: 'AIRCRAFT' },
  missile:  { border: 'border-lime-600',     bg: 'bg-lime-600',     text: 'text-lime-600',     label: 'MISSILE'  },
}

// Explicit per-hero goal modifiers (named heroes from spec)
const GOAL_WEIGHTS = {
  pvp_rally:    { schuyler: 1.3, dva: 1.2, kimberly: 1.2 },
  world_boss:   { mason: 1.3, sarah: 1.25, elsa: 1.2, swift: 1.2 },
  code_battles: { kimberly: 1.25, stetmann: 1.2, williams: 1.2, murphy: 1.2 },
  balanced:     {},
}

// Returns per-hero goal multiplier; unnamed back-row DPS get 1.15 in pvp/wb
function getGoalMod(heroId, goal) {
  const explicit = GOAL_WEIGHTS[goal][heroId]
  if (explicit !== undefined) return explicit
  const hero = HEROES[heroId]
  if ((goal === 'pvp_rally' || goal === 'world_boss') && hero.role === 'dps' && hero.defaultRow === 'back') {
    return 1.15
  }
  return 1.0
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 2: OPTIMIZER ENGINE
// ═══════════════════════════════════════════════════════════════════

function isPromotedUR(heroId, season) {
  const h = HEROES[heroId]
  return h.promotionSeason !== null && h.promotionSeason <= season
}

function heroScore(heroId, heroState, season, goal) {
  const { stars, skills, ewLevel } = heroState
  const effectiveRarity = isPromotedUR(heroId, season) ? 'UR' : HEROES[heroId].rarity
  const rarityWeight = RARITY_WEIGHTS[effectiveRarity]
  const avgSkill = skills.reduce((a, b) => a + b, 0) / skills.length
  const base = rarityWeight * (stars / 5) * avgSkill
  const starBonus = stars >= 4 ? 1.4 : stars >= 3 ? 1.2 : 1.0
  // ewBonus applies to native UR and promoted SSRs (both resolve to effectiveRarity==='UR')
  const ewBonus = effectiveRarity === 'UR' && ewLevel > 0 ? 1 + ewLevel * 0.15 : 1.0
  const goalMod = getGoalMod(heroId, goal)
  return base * starBonus * ewBonus * goalMod
}

function pieceScore(piece) {
  return QUALITY_WEIGHTS[piece.quality] * (piece.level / 40) * (1 + piece.stars * 0.2)
}

// Returns { [heroId]: score } for all owned heroes
function computeAllHeroScores(heroes, season, goal) {
  const scores = {}
  for (const [id, state] of Object.entries(heroes)) {
    if (state.owned) scores[id] = heroScore(id, state, season, goal)
  }
  return scores
}

// Generates all k-element combinations of arr
function getCombinations(arr, k) {
  const result = []
  function recurse(start, combo) {
    if (combo.length === k) { result.push([...combo]); return }
    for (let i = start; i <= arr.length - (k - combo.length); i++) {
      combo.push(arr[i])
      recurse(i + 1, combo)
      combo.pop()
    }
  }
  recurse(0, [])
  return result
}

function computeSquadScore(combo, heroScores, heroes, intent) {
  const base = combo.reduce((sum, id) => sum + (heroScores[id] ?? 0), 0)
  const unitTypes = new Set(combo.map(id => HEROES[id].unitType))
  const isMonotype = unitTypes.size === 1
  const hasDPS = combo.some(id => HEROES[id].role === 'dps')
  const hasEW5 = combo.some(id => (heroes[id]?.ewLevel ?? 0) >= 5)
  let score = base
  if (isMonotype) score *= 1.25
  else if (!hasEW5) score *= 0.8
  if (!hasDPS) score *= 0.6
  return score
}

function hasFrontTank(combo) {
  return combo.some(id => HEROES[id].role === 'tank' && HEROES[id].defaultRow === 'front')
}

// Returns { squad: heroId[], alternates: {[heroId]: {heroId, scoreDiff}}, score, insufficient }
function findRecommendedSquad(ownedIds, heroScores, heroes, intent) {
  if (ownedIds.length < 5) {
    return { squad: ownedIds, alternates: {}, score: 0, insufficient: true }
  }
  const combos = getCombinations(ownedIds, 5)
  const valid = combos.filter(hasFrontTank)
  const pool = valid.length > 0 ? valid : combos
  const scored = pool
    .map(combo => ({ combo, score: computeSquadScore(combo, heroScores, heroes, intent) }))
    .sort((a, b) => b.score - a.score)
  const best = scored[0]

  // Per-slot alternates: best single-hero swap for each member of the squad
  const alternates = {}
  for (const heroId of best.combo) {
    let bestAlt = null, bestAltScore = -Infinity
    for (const altId of ownedIds) {
      if (best.combo.includes(altId)) continue
      const swapped = best.combo.map(id => id === heroId ? altId : id)
      if (valid.length > 0 && !hasFrontTank(swapped)) continue
      const s = computeSquadScore(swapped, heroScores, heroes, intent)
      if (s > bestAltScore) { bestAltScore = s; bestAlt = altId }
    }
    if (bestAlt) alternates[heroId] = { heroId: bestAlt, scoreDiff: bestAltScore - best.score }
  }

  return { squad: best.combo, alternates, score: best.score, insufficient: false }
}

// Returns { assigned: {[heroId]: {gun,chip,armor,radar}}, unassigned: piece[] }
function assignGear(squadIds, gear, heroScores) {
  // Best heroes pick first
  const sortedSquad = [...squadIds].sort((a, b) => (heroScores[b] ?? 0) - (heroScores[a] ?? 0))
  // Sort available gear by score descending for fast best-first lookup
  const available = [...gear].sort((a, b) => pieceScore(b) - pieceScore(a))
  const usedIds = new Set()
  const assigned = {}

  for (const heroId of sortedSquad) {
    const role = HEROES[heroId].role
    const priority = SLOT_PRIORITY[role] ?? SLOT_PRIORITY.dps
    assigned[heroId] = { gun: null, chip: null, armor: null, radar: null }
    for (const slot of priority) {
      const best = available.find(p => p.slot === slot && !usedIds.has(p.id))
      if (best) { assigned[heroId][slot] = best; usedIds.add(best.id) }
    }
  }

  const unassigned = gear.filter(p => !usedIds.has(p.id))
  return { assigned, unassigned }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 3: STATE
// ═══════════════════════════════════════════════════════════════════

// (placeholder — filled in Tasks 10–11)

// ═══════════════════════════════════════════════════════════════════
// SECTION 4: UI
// ═══════════════════════════════════════════════════════════════════

export default function App() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-orbitron text-amber-600 text-xl tracking-widest">
        LAST WAR · OPS TERMINAL
      </p>
    </div>
  )
}
