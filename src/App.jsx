import { useState, useReducer, useMemo, useEffect } from 'react'

// ═══════════════════════════════════════════════════════════════════
// SECTION 1: GAME DATA
// ═══════════════════════════════════════════════════════════════════

const HEROES = {
  // UR heroes
  kimberly: { id: 'kimberly', name: 'Kimberly', rarity: 'UR', unitType: 'tank', role: 'dps', defaultRow: 'front', promotionSeason: null },
  williams: { id: 'williams', name: 'Williams', rarity: 'UR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: null },
  murphy:   { id: 'murphy',   name: 'Murphy',   rarity: 'UR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: null },
  marshall: { id: 'marshall', name: 'Marshall', rarity: 'UR', unitType: 'tank', role: 'support', defaultRow: 'back', promotionSeason: null },
  stetmann: { id: 'stetmann', name: 'Stetmann', rarity: 'UR', unitType: 'tank', role: 'dps', defaultRow: 'back', promotionSeason: null },
  dva:      { id: 'dva',      name: 'DVA',      rarity: 'UR', unitType: 'missile', role: 'dps', defaultRow: 'back', promotionSeason: null },
  morrison: { id: 'morrison', name: 'Morrison', rarity: 'UR', unitType: 'aircraft', role: 'dps', defaultRow: 'back', promotionSeason: null },
  schuyler: { id: 'schuyler', name: 'Schuyler', rarity: 'UR', unitType: 'aircraft', role: 'dps', defaultRow: 'back', promotionSeason: null },
  lucius:   { id: 'lucius',   name: 'Lucius',   rarity: 'UR', unitType: 'aircraft', role: 'tank', defaultRow: 'front', promotionSeason: null },
  carlie:   { id: 'carlie',   name: 'Carlie',   rarity: 'UR', unitType: 'aircraft', role: 'tank', defaultRow: 'front', promotionSeason: null },
  tesla:    { id: 'tesla',    name: 'Tesla',    rarity: 'UR', unitType: 'missile', role: 'dps', defaultRow: 'back', promotionSeason: null },
  mcgregor: { id: 'mcgregor', name: 'McGregor', rarity: 'UR', unitType: 'missile', role: 'tank', defaultRow: 'front', promotionSeason: null },
  adam:     { id: 'adam',     name: 'Adam',     rarity: 'UR', unitType: 'missile', role: 'tank', defaultRow: 'front', promotionSeason: null },
  swift:    { id: 'swift',    name: 'Swift',    rarity: 'UR', unitType: 'missile', role: 'dps', defaultRow: 'back', promotionSeason: null },
  fiona:    { id: 'fiona',    name: 'Fiona',    rarity: 'UR', unitType: 'missile', role: 'dps', defaultRow: 'back', promotionSeason: null },
  
  // SSR heroes
  mason:    { id: 'mason',    name: 'Mason',    rarity: 'SSR', unitType: 'tank', role: 'dps', defaultRow: 'back', promotionSeason: 1 },
  violet:   { id: 'violet',   name: 'Violet',   rarity: 'SSR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: 2 },
  scarlett: { id: 'scarlett', name: 'Scarlett', rarity: 'SSR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: 3 },
  venom:    { id: 'venom',    name: 'Venom',    rarity: 'SSR', unitType: 'missile', role: 'dps', defaultRow: 'back', promotionSeason: 5 },
  sarah:    { id: 'sarah',    name: 'Sarah',    rarity: 'SSR', unitType: 'aircraft', role: 'support', defaultRow: 'back', promotionSeason: null },
  richard:  { id: 'richard',  name: 'Richard',  rarity: 'SSR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: null },
  elsa:     { id: 'elsa',     name: 'Elsa',     rarity: 'SSR', unitType: 'missile', role: 'support', defaultRow: 'back', promotionSeason: null },
  maxwell:  { id: 'maxwell',  name: 'Maxwell',  rarity: 'SSR', unitType: 'aircraft', role: 'dps', defaultRow: 'back', promotionSeason: null },
  braz:     { id: 'braz',    name: 'Braz',    rarity: 'SSR', unitType: 'aircraft', role: 'dps', defaultRow: 'back', promotionSeason: 6 },
  // SR heroes
  drake:    { id: 'drake',    name: 'Drake',    rarity: 'SR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: null },
  kane:     { id: 'kane',     name: 'Kane',     rarity: 'SR', unitType: 'missile', role: 'dps', defaultRow: 'back', promotionSeason: null },
  ambolt:   { id: 'ambolt',   name: 'Ambolt',   rarity: 'SR', unitType: 'aircraft', role: 'support', defaultRow: 'back', promotionSeason: null },
}

// Ordered for roster display: UR → SSR → SR
const HERO_ORDER = [
  // UR
  'kimberly','williams','murphy','marshall','stetmann',
  'dva','tesla','swift','fiona','mcgregor','adam',
  'morrison','schuyler','lucius','carlie',
  // SSR
  'mason','violet','scarlett','venom',
  'sarah','richard','elsa','maxwell','braz',
  // SR
  'drake','kane','ambolt',
]

// Actual in-game skill names per hero, ordered [skill1, skill2, skill3, skill4]
const HERO_SKILLS = {
  kimberly: ['Energy Assault',      'Energy Boost',          'Barrage Strike',        'Super Sensory'],
  dva:      ['Vortex Missile',      'Armament Upgrade',      'Steel Barrage',         'Super Sensory'],
  williams: ['Stun Bomb',           'All-Around Armor',      'Iron Will',             'Super Sensory'],
  murphy:   ['Cannon Fire',         'Stand Firm',            'Ironclad Barrier',      'Super Sensory'],
  marshall: ['Triad Harmony',       'Rapid Start',           'Command Strategy',      'Super Sensory'],
  tesla:    ['Lightning Chain',     'Electric Power Boost',  'Electric Grid Lockdown','Super Sensory'],
  morrison: ['Full-Auto MG',        'Full Firepower',        'Armor-Piercing Shot',   'Super Sensory'],
  mason:    ['Quick Reload',        'Zombie Purge',          'Fire Cover',            'Super Sensory'],
  violet:   ['Poison Frog Spray',   'Z-Armor',               'Poison Gas Corrosion',  'Special Tactics'],
  scarlett: ['Flame Burst',         'T-5 Armor',             'Bastion Guard',         'Super Sensory'],
  venom:    ['Energy Bullet',       'Core Surge',            'Energy Overload',       'Super Sensory'],
  schuyler: ['Power Barrage',       'Antimatter Armor',      'Blast Frenzy',          'Super Sensory'],
  fiona:    ['Double Trajectory',   'Ballistic Boost',       'Atomic Blast',          'Super Sensory'],
  sarah:    ['Gunfire Negotiation', 'Special Armor',         'MG Symphony',           'Super Sensory'],
  elsa:     ['Icicle Strike',       'Special Armor',         'Armor Boost',           'Special Tactics'],
  lucius:   ['Triple Strike',       'Silver Armor',          "Knight's Spirit",       'Super Sensory'],
  carlie:   ['Dual-string Rocket',  'Energy Adaption',       'Inferno Blaze',         'Super Sensory'],
  mcgregor: ['Forward Rush',        'HP Boost',              'Unyielding Heart',      'Super Sensory'],
  adam:     ['MK43 Machine Gun',    'Spike Armor',           'Counter Defense',       'Super Sensory'],
  richard:  ['Howitzer',            'Ballistic Boost',       'Multi-Load',            'Super Sensory'],
  stetmann: ['Orb Lightning',       'Critical Charge',       'Lightning Rush',        'Super Sensory'],
  swift:    ['Targeted Strike',     'Precise Guidance',      'Weakness Targeting',    'Super Sensory'],
  maxwell:  ['Missile Strike',      'Zombie Killer',         'Destructive Firepower', 'Special Tactics'],
  braz:     ['Rocket Spread',       'Zombie Killer',         'Intense Bombing',       'Special Tactics'],
  drake:    ['Cannon Fire',         'Hard Armor',            'Shield Bash',           'Special Tactics'],
  kane:     ['Blasting Grenade',    'Steady Aim',            'Grenade Barrage',       'Field Combat'],
  ambolt:   ['Missile Strikes',     'Rapid Fire',            'Missile Barrage',       'Field Combat'],
}

// Per-hero skill upgrade priority weights [skill1, skill2, skill3, skill4]
// Higher = more impactful to level. Derived from community skill priority guides.
const HERO_SKILL_WEIGHTS = {
  kimberly: [3, 2, 4, 1], // priority: 3>1>2>4
  dva:      [4, 2, 3, 1], // priority: 1>3>2>4
  williams: [1, 4, 3, 2], // priority: 2>3>4>1
  murphy:   [3, 1, 4, 2], // priority: 3>1>4>2
  marshall: [3, 2, 4, 1], // priority: 3>1>2>4
  tesla:    [3, 2, 4, 1], // priority: 3>1>2>4
  morrison: [3, 2, 4, 1], // priority: 3>1>2>4
  mason:    [2, 3, 4, 1], // priority: 3>2>1>4
  violet:   [1, 4, 3, 2], // priority: 2>3>4>1
  scarlett: [3, 2, 4, 1], // priority: 3>1>2>4
  venom:    [1, 3, 4, 2], // priority: 3>2>4>1
  schuyler: [3, 2, 4, 1], // priority: 3>1>2>4
  fiona:    [1, 2, 4, 3], // priority: 3>4>2>1
  sarah:    [1, 2, 4, 3], // priority: 3>4>2>1
  elsa:     [3, 1, 4, 2], // priority: 3>1>4>2
  lucius:   [1, 3, 4, 2], // priority: 3>2>4>1
  carlie:   [2, 4, 3, 1], // priority: 2>3>1>4
  mcgregor: [1, 3, 4, 2], // priority: 3>2>4>1
  adam:     [1, 3, 4, 2], // priority: 3>2>4>1
  richard:  [3, 1, 4, 2], // priority: 3>1>4>2
  stetmann: [3, 2, 4, 1], // priority: 3>1>2>4
  swift:    [3, 2, 4, 1], // priority: 3>1>2>4
  maxwell:  [1, 3, 4, 2], // priority: 3>2>4>1
  braz:     [3, 2, 4, 1], // priority: 3>1>2>4
  drake:    [1, 3, 4, 2], // priority: 3>2>4>1
  kane:     [3, 2, 4, 1], // priority: 3>1>2>4
  ambolt:   [3, 2, 4, 1], // priority: 3>1>2>4
}

// Skill names that change when an SSR hero promotes to UR — overrides HERO_SKILLS when promoted
const HERO_SKILLS_PROMOTED = {
  violet:   ['Frost Spray',      'Ice Armor',          'Chill Corrosion',    'Frost Buff'],
  venom:    ['Corrosive Shot',   'Promotion Synergy',  'Corrosive Barrage',  'Super Sensing'],
  // Mason and Scarlett keep the same skill names post-promotion
}

// Skill priority weights that change post-promotion — overrides HERO_SKILL_WEIGHTS when promoted
const HERO_SKILL_WEIGHTS_PROMOTED = {
  // Venom UR: Corrosive Barrage (SK3) > Promotion Synergy (SK2) > Corrosive Shot (SK1, applies stacks) > Super Sensing (SK4)
  venom: [2, 3, 4, 1],
  // Violet UR: Ice Armor (SK2) remains dominant, Frost Buff (SK4) gains value as squad-wide DR
  // priority unchanged: 2>3>4>1 → [1,4,3,2] same as SSR
}

const SLOTS = ['gun', 'chip', 'armor', 'radar']
const QUALITIES = ['legendary', 'epic', 'rare', 'common']
const QUALITY_WEIGHTS = { legendary: 4, epic: 2, rare: 1, common: 0.5 }
const QUALITY_MAX_LEVEL = { legendary: 40, epic: 30, rare: 15, common: 10 }
const QUALITY_META = {
  legendary: { label: 'Legendary', tag: 'GOLD',   hint: 'Max Lv40 · invest here', rowColor: 'text-amber-400 border-amber-700',   selected: 'border-amber-500 text-amber-400 bg-amber-900/20' },
  epic:      { label: 'Epic',      tag: 'PURPLE', hint: 'Max Lv30 · dismantle for mats', rowColor: 'text-purple-400 border-purple-800', selected: 'border-purple-600 text-purple-400 bg-purple-900/20' },
  rare:      { label: 'Rare',      tag: 'BLUE',   hint: 'Max Lv15 · early game only', rowColor: 'text-blue-400 border-blue-800',    selected: 'border-blue-600 text-blue-400 bg-blue-900/20' },
  common:    { label: 'Common',    tag: 'GREEN',  hint: 'Max Lv10 · dismantle immediately', rowColor: 'text-neutral-400 border-neutral-700', selected: 'border-neutral-500 text-neutral-300 bg-neutral-800' },
}
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
  code_battles: {}, // type bonus applied dynamically via codeType selector
  balanced:     {},
}

// Rock-paper-scissors counter table: key beats value
const BEATS = { tank: 'missile', missile: 'aircraft', aircraft: 'tank' }

// Returns per-hero goal multiplier
// codeType: for code_battles, which unit type gets the in-game +50% damage bonus this code
function getGoalMod(heroId, goal, codeType) {
  if (goal === 'code_battles') {
    if (codeType && HEROES[heroId].unitType === codeType) return 1.5
    return 1.0
  }
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

function heroScore(heroId, heroState, season, goal, codeType) {
  const { stars, skills, ewLevel } = heroState
  const effectiveRarity = isPromotedUR(heroId, season) ? 'UR' : HEROES[heroId].rarity
  const rarityWeight = RARITY_WEIGHTS[effectiveRarity]
  // UR skill cap starts at 30 and gains +1 per 3 EW levels (EW 30 = cap 40)
  const skillMax = effectiveRarity === 'UR' ? Math.min(40, 30 + Math.floor(ewLevel / 3)) : 30
  // Skills unlock by star: 0-1★=skill1 only, 2★=skills1-2, 3★=skills1-3, 4★+=all4
  const unlockedCount = stars <= 1 ? 1 : Math.min(stars, 4)
  const promoted = effectiveRarity === 'UR' && HEROES[heroId].rarity !== 'UR'
  const weights = (promoted && HERO_SKILL_WEIGHTS_PROMOTED[heroId])
    ? HERO_SKILL_WEIGHTS_PROMOTED[heroId]
    : (HERO_SKILL_WEIGHTS[heroId] ?? [1, 2, 3, 2])
  const activeWeights = weights.slice(0, unlockedCount)
  const weightSum = activeWeights.reduce((a, b) => a + b, 0)
  const weightedSkillSum = skills.slice(0, unlockedCount).reduce((sum, lvl, i) => sum + lvl * activeWeights[i], 0)
  const avgSkill = weightedSkillSum / weightSum
  const base = rarityWeight * (stars / 5) * (avgSkill / skillMax)
  const starBonus = stars >= 4 ? 1.4 : stars >= 3 ? 1.2 : 1.0
  // ewBonus: 5% per level across 0-30 range
  const ewBonus = effectiveRarity === 'UR' && ewLevel > 0 ? 1 + ewLevel * 0.05 : 1.0
  const goalMod = getGoalMod(heroId, goal, codeType)
  return base * starBonus * ewBonus * goalMod
}

function pieceScore(piece) {
  const maxLevel = QUALITY_MAX_LEVEL[piece.quality] ?? 40
  return QUALITY_WEIGHTS[piece.quality] * (piece.level / maxLevel) * (1 + piece.stars * 0.2)
}

// Returns { [heroId]: score } for all owned heroes
function computeAllHeroScores(heroes, season, goal, codeType) {
  const scores = {}
  for (const [id, state] of Object.entries(heroes)) {
    if (state.owned) scores[id] = heroScore(id, state, season, goal, codeType)
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

function computeSquadScore(combo, heroScores, heroes, intent, opponentType) {
  // EW level 20 squad-type buff: each hero with EW≥20 grants +7.5% to all same-type squad members
  const ewTypeBuff = {}
  for (const id of combo) {
    if ((heroes[id]?.ewLevel ?? 0) >= 20) {
      const t = HEROES[id].unitType
      ewTypeBuff[t] = (ewTypeBuff[t] || 0) + 1
    }
  }
  const base = combo.reduce((sum, id) => {
    const buffStacks = ewTypeBuff[HEROES[id].unitType] || 0
    return sum + (heroScores[id] ?? 0) * (1 + 0.075 * buffStacks)
  }, 0)

  // Graduated mono bonus — actual game mechanic (+20% max, graduated by majority count)
  const typeCounts = {}
  for (const id of combo) {
    const t = HEROES[id].unitType
    typeCounts[t] = (typeCounts[t] || 0) + 1
  }
  const counts = Object.values(typeCounts).sort((a, b) => b - a)
  let monoMult = 1.0
  if (counts[0] === 5) monoMult = 1.20
  else if (counts[0] === 4) monoMult = 1.15
  else if (counts[0] === 3 && counts[1] === 2) monoMult = 1.10
  else if (counts[0] === 3) monoMult = 1.05

  // Counter advantage: heroes whose type beats the opponent type get +20% damage
  let counterMult = 1.0
  if (opponentType && BEATS[opponentType] !== undefined) {
    // find which type counters the opponent
    const counterType = Object.keys(BEATS).find(t => BEATS[t] === opponentType)
    const counterCount = combo.filter(id => HEROES[id].unitType === counterType).length
    if (counterCount >= 4) counterMult = 1.20
    else if (counterCount >= 3) counterMult = 1.15
    else if (counterCount >= 1) counterMult = 1.08
  }

  const hasDPS = combo.some(id => HEROES[id].role === 'dps')
  let score = base * monoMult * counterMult
  if (!hasDPS) score *= 0.6
  return score
}

function computeSquadReasoning(combo, heroes, opponentType, ownedIds) {
  const active = []
  const opportunities = []

  // EW type buffs — one entry per EW≥20 hero in the squad
  for (const id of combo) {
    if ((heroes[id]?.ewLevel ?? 0) >= 20) {
      const t = HEROES[id].unitType
      const buffedCount = combo.filter(cid => HEROES[cid].unitType === t).length
      active.push(`${HEROES[id].name} EW20 buffs ${buffedCount} ${UNIT_COLORS[t].label} allies — +7.5% each`)
    }
  }

  // EW near-miss: squad hero with EW 15–19 (one level push away from buff)
  for (const id of combo) {
    const ew = heroes[id]?.ewLevel ?? 0
    if (ew >= 15 && ew < 20) {
      const t = HEROES[id].unitType
      const buffedCount = combo.filter(cid => HEROES[cid].unitType === t).length
      opportunities.push(`Level ${HEROES[id].name} EW to 20 — buff ${buffedCount} ${UNIT_COLORS[t].label} allies +7.5%`)
    }
  }

  // Mono bonus
  const typeCounts = {}
  for (const id of combo) {
    const t = HEROES[id].unitType
    typeCounts[t] = (typeCounts[t] || 0) + 1
  }
  const entries = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])
  const [dominantType, dominantCount] = entries[0]
  const secondCount = entries[1]?.[1] ?? 0
  let monoMult = 1.0
  const counts = entries.map(e => e[1])
  if (counts[0] === 5) monoMult = 1.20
  else if (counts[0] === 4) monoMult = 1.15
  else if (counts[0] === 3 && counts[1] === 2) monoMult = 1.10
  else if (counts[0] === 3) monoMult = 1.05
  const typeLabel = UNIT_COLORS[dominantType].label
  if (monoMult > 1.0) {
    active.push(`${dominantCount}/5 ${typeLabel} — +${Math.round((monoMult - 1) * 100)}% mono bonus`)
  }

  // Mono near-miss: 4/5 or 3+2 split — only if spare hero of dominant type is owned
  if (dominantCount === 4 || (dominantCount === 3 && secondCount === 2)) {
    const spareExists = ownedIds.some(id => !combo.includes(id) && HEROES[id].unitType === dominantType)
    if (spareExists) {
      const currentBonus = Math.round((monoMult - 1) * 100)
      const nextBonus = dominantCount === 4 ? 20 : 15
      opportunities.push(`Swap 1 hero for ${dominantCount + 1}/5 ${typeLabel} — unlock +${nextBonus - currentBonus}% more mono bonus`)
    }
  }

  // Counter advantage
  if (opponentType && BEATS[opponentType] !== undefined) {
    const counterType = Object.keys(BEATS).find(t => BEATS[t] === opponentType)
    const counterCount = combo.filter(id => HEROES[id].unitType === counterType).length
    const opponentLabel = UNIT_COLORS[opponentType].label
    const counterLabel = UNIT_COLORS[counterType].label
    let counterPct = 0
    if (counterCount >= 4) counterPct = 20
    else if (counterCount >= 3) counterPct = 15
    else if (counterCount >= 1) counterPct = 8
    if (counterPct > 0) {
      active.push(`${counterCount}/5 ${counterLabel} counter ${opponentLabel} enemy — +${counterPct}% counter bonus`)
    }
    // Near-miss: 1–2 counter heroes and a spare exists
    if (counterCount >= 1 && counterCount < 3) {
      const spareCount = ownedIds.filter(id => !combo.includes(id) && HEROES[id].unitType === counterType).length
      if (spareCount > 0) {
        const need = 3 - counterCount
        opportunities.push(`Add ${need} more ${counterLabel} hero${need > 1 ? 'es' : ''} — improve counter bonus to +15%`)
      }
    }
  }

  return { active, opportunities }
}

function hasFrontTank(combo) {
  return combo.some(id => HEROES[id].role === 'tank' && HEROES[id].defaultRow === 'front')
}

// Returns { squad: heroId[], alternates: {[heroId]: {heroId, scoreDiff}}, score, insufficient }
function findRecommendedSquad(ownedIds, heroScores, heroes, intent, opponentType) {
  if (ownedIds.length < 5) {
    return { squad: ownedIds, alternates: {}, score: 0, insufficient: true }
  }
  const combos = getCombinations(ownedIds, 5)
  const valid = combos.filter(hasFrontTank)
  const pool = valid.length > 0 ? valid : combos
  const scored = pool
    .map(combo => ({ combo, score: computeSquadScore(combo, heroScores, heroes, intent, opponentType) }))
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
      const s = computeSquadScore(swapped, heroScores, heroes, intent, opponentType)
      if (s > bestAltScore) { bestAltScore = s; bestAlt = altId }
    }
    if (bestAlt) alternates[heroId] = { heroId: bestAlt, scoreDiff: bestAltScore - best.score }
  }

  const reasoning = computeSquadReasoning(best.combo, heroes, opponentType, ownedIds)
  return { squad: best.combo, alternates, score: best.score, reasoning, insufficient: false }
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

function maxEfficiencyUpgrades(assigned, heroScores) {
  const upgrades = []
  for (const [heroId, slots] of Object.entries(assigned)) {
    const hScore = heroScores[heroId] ?? 1
    for (const [slot, piece] of Object.entries(slots)) {
      if (!piece) continue
      const maxLevel = QUALITY_MAX_LEVEL[piece.quality] ?? 40
      if (piece.level < maxLevel) {
        const next = piece.level + 1
        const isMilestone = next % 10 === 0 || next === maxLevel
        const mult = isMilestone ? 2 : 1
        const reason = next === maxLevel && next % 10 !== 0 ? `Hits quality max (Lv ${maxLevel})`
          : next === 40 ? 'Hits Lv 40 milestone' : next === 30 ? 'Hits Lv 30 milestone'
          : next === 20 ? 'Hits Lv 20 milestone' : next === 10 ? 'Hits Lv 10 milestone' : 'Max efficiency'
        upgrades.push({ type: 'level', slot, heroId, from: piece.level, to: next, blueprintWarning: false, reason,
          score: pieceScore({ ...piece, level: next }) * mult * hScore })
      }
      if (piece.stars < 5) {
        const next = piece.stars + 1
        const mult = (next === 2 || next === 4) ? 2 : 1
        const reason = next === 4 ? '4★ breakpoint — major power spike' : next === 2 ? '2★ breakpoint — significant bonus' : 'Blueprint spend justified here'
        upgrades.push({ type: 'stars', slot, heroId, from: piece.stars, to: next, blueprintWarning: true, reason,
          score: pieceScore({ ...piece, stars: next }) * mult * hScore })
      }
    }
  }
  return upgrades.sort((a, b) => b.score - a.score)
}

function roleBasedUpgrades(assigned) {
  const items = []
  for (const [heroId, slots] of Object.entries(assigned)) {
    const role = HEROES[heroId].role
    if (role === 'dps') {
      const gunLv = slots.gun?.level ?? 0
      const armorLv = slots.armor?.level ?? 0
      if (armorLv > gunLv && slots.gun) {
        items.push({ heroId, slot: 'gun', piece: slots.gun, gap: armorLv - gunLv, reason: 'Role misalignment — Gun should lead for DPS hero' })
      }
      if (slots.chip && (slots.chip.level < (slots.gun?.level ?? 0))) {
        items.push({ heroId, slot: 'chip', piece: slots.chip, gap: (slots.gun?.level ?? 0) - slots.chip.level, reason: 'Biggest DPS gap — Chip trails Gun' })
      }
    } else if (role === 'tank') {
      const armorLv = slots.armor?.level ?? 0
      const gunLv = slots.gun?.level ?? 0
      if (gunLv > armorLv && slots.armor) {
        items.push({ heroId, slot: 'armor', piece: slots.armor, gap: gunLv - armorLv, reason: 'Role misalignment — Armor should lead for Tank hero' })
      }
    } else if (role === 'support') {
      const radarLv = slots.radar?.level ?? 0
      const maxOther = Math.max(slots.gun?.level ?? 0, slots.chip?.level ?? 0, slots.armor?.level ?? 0)
      if (maxOther > radarLv && slots.radar) {
        items.push({ heroId, slot: 'radar', piece: slots.radar, gap: maxOther - radarLv, reason: 'Role misalignment — Radar should lead for Support hero' })
      }
    }
  }
  return items
    .sort((a, b) => b.gap - a.gap)
    .map(u => ({ type: 'level', slot: u.slot, heroId: u.heroId, from: u.piece.level, to: u.piece.level + 1, blueprintWarning: false, reason: u.reason, score: u.gap }))
}

function weakestLinkUpgrades(assigned, heroScores) {
  const all = []
  for (const [heroId, slots] of Object.entries(assigned)) {
    for (const [slot, piece] of Object.entries(slots)) {
      if (piece) all.push({ heroId, slot, piece, ps: pieceScore(piece) })
    }
  }
  if (all.length === 0) return []
  const avg = all.reduce((s, p) => s + p.ps, 0) / all.length
  return all
    .sort((a, b) => a.ps - b.ps)
    .slice(0, 10)
    .map(p => ({ type: 'level', slot: p.slot, heroId: p.heroId, from: p.piece.level, to: p.piece.level + 1, blueprintWarning: false, reason: 'Weakest link in squad', score: avg - p.ps }))
}

// hasEW5: boolean — true if any squad member has ewLevel >= 5
function computeUpgradePriority(assigned, heroScores, mode, intent, hasEW5) {
  let list = []
  if (mode === 'max_efficiency') list = maxEfficiencyUpgrades(assigned, heroScores)
  else if (mode === 'role_based') list = roleBasedUpgrades(assigned)
  else list = weakestLinkUpgrades(assigned, heroScores)

  const needsEWCallout = (intent === 'hybrid_progress') && !hasEW5
  const callout = needsEWCallout
    ? [{ type: 'callout', reason: 'Priority: Level an Exclusive Weapon to 5 before investing further in gear — hybrid formation is high-risk without it.', score: Infinity, blueprintWarning: false }]
    : []
  return [...callout, ...list]
}

// Returns { severity: 'danger'|'caution', message: string }[]
function computeWarnings(state, squad, season) {
  const { intent, heroes, gear } = state
  const warnings = []

  // Hybrid formation risk
  if (intent === 'hybrid_progress' || intent === 'full_hybrid') {
    const hasEW5 = Object.entries(heroes).some(([, h]) => h.owned && h.ewLevel >= 5)
    if (!hasEW5) {
      warnings.push({ severity: 'danger', message: 'Hybrid squad is high risk — no hero has EW 5+. Level an Exclusive Weapon to 5 before investing further in gear.' })
    }
  }

  // No Legendary gear
  if (!gear.some(g => g.quality === 'legendary')) {
    warnings.push({ severity: 'danger', message: 'You have no Legendary gear — prioritize crafting Legendary pieces before upgrading Epic or below.' })
  }

  // Per-squad-member warnings
  for (const heroId of squad) {
    const h = heroes[heroId]
    if (!h) continue
    const hero = HEROES[heroId]

    // Low star — skills offline
    if (h.stars < 3) {
      warnings.push({ severity: 'caution', message: `${hero.name} is ${h.stars}★ — core skills are offline. Starring up will outperform any gear upgrade right now.` })
    }

    // Season-gated UR promotion upcoming
    if (hero.promotionSeason && hero.promotionSeason > season) {
      warnings.push({ severity: 'caution', message: `${hero.name}'s gear investment has low ROI until UR promotion at Season ${hero.promotionSeason} — you are in Season ${season}.` })
    }
  }

  return warnings
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 3: STATE
// ═══════════════════════════════════════════════════════════════════

const INITIAL_HERO_STATE = { owned: false, stars: 0, level: 1, skills: [1, 1, 1, 1], ewLevel: 0 }

const INITIAL_HEROES_STATE = Object.fromEntries(
  Object.keys(HEROES).map(id => [id, { ...INITIAL_HERO_STATE }])
)

function getProfileData(state) {
  return {
    season: state.season,
    goal: state.goal,
    intent: state.intent,
    opponentType: state.opponentType,
    codeType: state.codeType,
    heroes: state.heroes,
    gear: state.gear,
  }
}

// Syncs profiles[activeProfile] from flat state fields — called in reducer after every profile-affecting action
function syncProfile(state) {
  return { ...state, profiles: { ...state.profiles, [state.activeProfile]: getProfileData(state) } }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem('lastwar_optimizer_v1')
    if (!raw) return null
    const saved = JSON.parse(raw)
    if (!saved.profiles || !saved.activeProfile) return null
    return saved
  } catch {
    return null
  }
}

const DEFAULT_PROFILE_NAME = 'Main Account'

const BLANK_PROFILE = {
  season: 1,
  goal: 'pvp_rally',
  intent: 'mono',
  opponentType: null,
  codeType: null,
  heroes: INITIAL_HEROES_STATE,
  gear: [],
}

// Merges any heroes added after a profile was saved so new heroes always exist in state
function mergeHeroes(saved) {
  return { ...INITIAL_HEROES_STATE, ...saved }
}

function buildInitialState() {
  const saved = loadFromLocalStorage()
  if (saved) {
    const profile = saved.profiles[saved.activeProfile] ?? BLANK_PROFILE
    return {
      ...profile,
      heroes: mergeHeroes(profile.heroes ?? {}),
      profiles: saved.profiles,
      activeProfile: saved.activeProfile,
      activeSection: 'roster',
      activeRecTab: 'loadout',
      upgradeMode: 'max_efficiency',
    }
  }
  return {
    ...BLANK_PROFILE,
    profiles: { [DEFAULT_PROFILE_NAME]: BLANK_PROFILE },
    activeProfile: DEFAULT_PROFILE_NAME,
    activeSection: 'roster',
    activeRecTab: 'loadout',
    upgradeMode: 'max_efficiency',
  }
}

function reducer(state, action) {
  switch (action.type) {
    // Global context
    case 'SET_SEASON':
      return syncProfile({ ...state, season: action.payload })
    case 'SET_GOAL':
      return syncProfile({ ...state, goal: action.payload })
    case 'SET_INTENT':
      return syncProfile({ ...state, intent: action.payload })
    case 'SET_OPPONENT_TYPE':
      return syncProfile({ ...state, opponentType: action.payload })
    case 'SET_CODE_TYPE':
      return syncProfile({ ...state, codeType: action.payload })

    // Hero mutations
    case 'TOGGLE_HERO_OWNED': {
      const current = state.heroes[action.heroId]
      return syncProfile({ ...state, heroes: { ...state.heroes, [action.heroId]: { ...current, owned: !current.owned } } })
    }
    case 'UPDATE_HERO': {
      const current = state.heroes[action.heroId]
      return syncProfile({ ...state, heroes: { ...state.heroes, [action.heroId]: { ...current, ...action.updates } } })
    }

    // Gear mutations
    case 'ADD_GEAR':
      return syncProfile({ ...state, gear: [...state.gear, { ...action.piece, id: crypto.randomUUID() }] })
    case 'UPDATE_GEAR':
      return syncProfile({ ...state, gear: state.gear.map(g => g.id === action.id ? { ...g, ...action.updates } : g) })
    case 'DELETE_GEAR':
      return syncProfile({ ...state, gear: state.gear.filter(g => g.id !== action.id) })

    // UI state (not synced to profile)
    case 'SET_SECTION':
      return { ...state, activeSection: action.payload }
    case 'SET_REC_TAB':
      return { ...state, activeRecTab: action.payload }
    case 'SET_UPGRADE_MODE':
      return { ...state, upgradeMode: action.payload }

    // Profile management
    case 'NEW_PROFILE': {
      const name = action.name
      const blank = { ...BLANK_PROFILE, heroes: { ...INITIAL_HEROES_STATE } }
      return { ...state, profiles: { ...state.profiles, [name]: blank }, activeProfile: name, ...blank }
    }
    case 'SWITCH_PROFILE': {
      const profile = state.profiles[action.name]
      if (!profile) return state
      return { ...state, activeProfile: action.name, ...profile, heroes: mergeHeroes(profile.heroes ?? {}) }
    }
    case 'RENAME_PROFILE': {
      const { oldName, newName } = action
      const { [oldName]: profile, ...rest } = state.profiles
      const nextActive = state.activeProfile === oldName ? newName : state.activeProfile
      return { ...state, profiles: { ...rest, [newName]: profile }, activeProfile: nextActive }
    }
    case 'DUPLICATE_PROFILE': {
      const src = state.profiles[action.name] ?? getProfileData(state)
      const newName = `${action.name} (copy)`
      return { ...state, profiles: { ...state.profiles, [newName]: src } }
    }
    case 'DELETE_PROFILE': {
      if (Object.keys(state.profiles).length <= 1) return state
      const { [action.name]: _, ...remaining } = state.profiles
      const nextActive = state.activeProfile === action.name ? Object.keys(remaining)[0] : state.activeProfile
      const nextProfile = remaining[nextActive]
      return { ...state, profiles: remaining, activeProfile: nextActive, ...nextProfile }
    }
    case 'IMPORT_PROFILE': {
      const { name, data } = action
      return { ...state, profiles: { ...state.profiles, [name]: data }, activeProfile: name, ...data }
    }

    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 4: UI
// ═══════════════════════════════════════════════════════════════════

function ProfileSwitcher({ state, dispatch }) {
  const [open, setOpen] = useState(false)
  const [importModal, setImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const handleExport = () => {
    const data = JSON.stringify({ _name: state.activeProfile, ...state.profiles[state.activeProfile] })
    navigator.clipboard.writeText(data)
      .then(() => showToast('Copied to clipboard!'))
      .catch(() => showToast('Copy failed — check browser permissions'))
    setOpen(false)
  }

  const handleImport = () => {
    try {
      const data = JSON.parse(importText)
      const { _name, ...profile } = data
      if (!profile.heroes || !profile.gear) { setImportError('Invalid format — missing heroes or gear fields.'); return }
      const name = _name ?? `Import ${Date.now()}`
      dispatch({ type: 'IMPORT_PROFILE', name, data: profile })
      setImportModal(false)
      setImportText('')
      setImportError('')
    } catch {
      setImportError('Invalid JSON — paste the exported string exactly.')
    }
  }

  const names = Object.keys(state.profiles)

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="font-orbitron text-xs text-neutral-400 border border-neutral-700 px-2 py-1 hover:border-amber-600 hover:text-amber-600 transition-colors min-h-[32px] max-w-[120px] truncate">
        {state.activeProfile}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-neutral-900 border border-amber-700 z-50 min-w-[180px]">
          {names.map(name => (
            <button key={name} onClick={() => { dispatch({ type: 'SWITCH_PROFILE', name }); setOpen(false) }}
              className={`w-full text-left px-3 py-2 font-rajdhani text-sm border-b border-neutral-800 min-h-[40px] transition-colors
                ${name === state.activeProfile ? 'text-amber-600 bg-amber-600/10' : 'text-gray-300 hover:bg-neutral-800'}`}>
              {name}
            </button>
          ))}
          <div className="border-t border-neutral-700">
            <button onClick={() => {
              const name = prompt('New profile name:')
              if (name?.trim()) dispatch({ type: 'NEW_PROFILE', name: name.trim() })
              setOpen(false)
            }} className="w-full text-left px-3 py-2 font-orbitron text-xs text-neutral-400 hover:text-gray-200 hover:bg-neutral-800 min-h-[40px]">
              + NEW PROFILE
            </button>
            <button onClick={() => {
              const newName = prompt('Rename to:', state.activeProfile)
              if (newName?.trim() && newName.trim() !== state.activeProfile) {
                dispatch({ type: 'RENAME_PROFILE', oldName: state.activeProfile, newName: newName.trim() })
              }
              setOpen(false)
            }} className="w-full text-left px-3 py-2 font-orbitron text-xs text-neutral-400 hover:text-gray-200 hover:bg-neutral-800 min-h-[40px]">
              RENAME
            </button>
            <button onClick={() => { dispatch({ type: 'DUPLICATE_PROFILE', name: state.activeProfile }); setOpen(false) }}
              className="w-full text-left px-3 py-2 font-orbitron text-xs text-neutral-400 hover:text-gray-200 hover:bg-neutral-800 min-h-[40px]">
              DUPLICATE
            </button>
            <button onClick={() => { dispatch({ type: 'DELETE_PROFILE', name: state.activeProfile }); setOpen(false) }}
              className="w-full text-left px-3 py-2 font-orbitron text-xs text-red-600 hover:bg-red-900/20 min-h-[40px]">
              DELETE
            </button>
            <div className="border-t border-neutral-700">
              <button onClick={handleExport}
                className="w-full text-left px-3 py-2 font-orbitron text-xs text-neutral-400 hover:text-gray-200 hover:bg-neutral-800 min-h-[40px]">
                EXPORT JSON
              </button>
              <button onClick={() => { setImportModal(true); setOpen(false) }}
                className="w-full text-left px-3 py-2 font-orbitron text-xs text-neutral-400 hover:text-gray-200 hover:bg-neutral-800 min-h-[40px]">
                IMPORT JSON
              </button>
            </div>
          </div>
        </div>
      )}

      {importModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-amber-600 w-full max-w-sm p-4 space-y-3">
            <p className="font-orbitron text-amber-600 text-xs tracking-widest">// IMPORT PROFILE</p>
            <textarea value={importText} onChange={e => { setImportText(e.target.value); setImportError('') }}
              placeholder="Paste exported JSON here..."
              className="w-full bg-neutral-800 border border-neutral-700 text-gray-200 font-mono text-xs p-2 h-32 resize-none" />
            {importError && <p className="font-rajdhani text-xs text-red-400">{importError}</p>}
            <div className="flex gap-2">
              <button onClick={handleImport}
                className="flex-1 py-2 font-orbitron text-xs bg-amber-600 text-black hover:bg-amber-500 min-h-[44px]">
                IMPORT
              </button>
              <button onClick={() => { setImportModal(false); setImportText(''); setImportError('') }}
                className="px-4 py-2 font-orbitron text-xs border border-neutral-700 text-neutral-400 hover:bg-neutral-800 min-h-[44px]">
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-48 left-1/2 -translate-x-1/2 bg-neutral-800 border border-amber-600 px-4 py-2 font-orbitron text-xs text-amber-600 z-50 pointer-events-none">
          {toast}
        </div>
      )}
    </div>
  )
}

function RecPanel({ state, dispatch, recommendedSquad, gearAssignment, upgradePriority, warnings }) {
  const slotLabels = { gun: 'GUN', chip: 'CHIP', armor: 'ARMOR', radar: 'RADAR' }

  const loadoutContent = recommendedSquad.insufficient ? (
    <p className="font-rajdhani text-xs text-neutral-600">Own 5+ heroes to generate loadout.</p>
  ) : (
    <div className="space-y-1">
      {recommendedSquad.squad.map(heroId => {
        const slots = gearAssignment.assigned[heroId] ?? {}
        return (
          <div key={heroId} className="flex items-center gap-1">
            <span className="font-rajdhani text-xs text-gray-300 w-20 truncate">{HEROES[heroId].name}</span>
            {SLOTS.map(slot => {
              const p = slots[slot]
              return (
                <span key={slot} className={`font-mono text-xs px-1 border ${p ? 'border-amber-800 text-amber-600' : 'border-neutral-800 text-neutral-700'}`}>
                  {p ? `${slot.slice(0,1).toUpperCase()}${p.level}` : '—'}
                </span>
              )
            })}
          </div>
        )
      })}
    </div>
  )

  const upgradesContent = (
    <div className="space-y-1">
      {upgradePriority.slice(0, 5).map((item, i) => (
        <p key={item.type === 'callout' ? `callout-${i}` : `${item.heroId}-${item.slot}-${item.type}-${i}`} className="font-rajdhani text-xs text-gray-300">
          {item.type === 'callout'
            ? `⚠ ${item.reason}`
            : item.type === 'level'
              ? `${i+1}. ${slotLabels[item.slot]} Lv${item.from}→${item.to} · ${HEROES[item.heroId]?.name}`
              : `${i+1}. ${slotLabels[item.slot]} → ${item.to}★ · ${HEROES[item.heroId]?.name}`}
        </p>
      ))}
      {upgradePriority.length === 0 && <p className="font-rajdhani text-xs text-neutral-600">No upgrade data — add heroes and gear.</p>}
    </div>
  )

  const warningsContent = (
    <div className="space-y-1">
      {warnings.length === 0 && <p className="font-rajdhani text-xs text-neutral-600">No warnings — squad looks good.</p>}
      {warnings.map((w, i) => (
        <p key={`${w.severity}-${i}`} className={`font-rajdhani text-xs ${w.severity === 'danger' ? 'text-red-400' : 'text-amber-400'}`}>
          {w.severity === 'danger' ? '⛔' : '⚠'} {w.message}
        </p>
      ))}
    </div>
  )

  const content = { loadout: loadoutContent, upgrades: upgradesContent, warnings: warningsContent }

  return (
    <div className="flex-none border-t-2 border-amber-600 bg-neutral-900">
      <div className="flex border-b border-neutral-800">
        {['loadout', 'upgrades', 'warnings'].map(tab => (
          <button key={tab} onClick={() => dispatch({ type: 'SET_REC_TAB', payload: tab })}
            className={`flex-1 py-2 font-orbitron text-xs tracking-widest transition-colors min-h-[40px]
              ${state.activeRecTab === tab ? 'text-amber-600 border-b-2 border-amber-600' : 'text-neutral-500 hover:text-gray-300'}`}>
            {tab.toUpperCase()}
            {tab === 'warnings' && warnings.length > 0 && (
              <span className="ml-1 text-red-500">({warnings.filter(w => w.severity === 'danger').length})</span>
            )}
          </button>
        ))}
      </div>
      <div className="p-2 h-28 overflow-y-auto">
        {content[state.activeRecTab]}
      </div>
    </div>
  )
}

function UpgradePriority({ state, dispatch, upgradePriority }) {
  const modes = [
    { key: 'max_efficiency', label: 'MAX EFF' },
    { key: 'role_based',     label: 'ROLE'    },
    { key: 'weakest_link',   label: 'W-LINK'  },
  ]
  const slotLabels = { gun: 'GUN', chip: 'CHIP', armor: 'ARMOR', radar: 'RADAR' }

  return (
    <div className="p-3 max-w-lg">
      <p className="font-orbitron text-amber-600 text-xs tracking-widest border-b border-dashed border-neutral-700 pb-2 mb-3">
        // UPGRADE PRIORITY ENGINE
      </p>

      <div className="flex gap-1 mb-4">
        {modes.map(({ key, label }) => (
          <button key={key} onClick={() => dispatch({ type: 'SET_UPGRADE_MODE', payload: key })}
            className={`flex-1 py-2 font-orbitron text-xs border min-h-[40px] transition-colors
              ${state.upgradeMode === key ? 'border-amber-600 text-amber-600 bg-amber-600/10' : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-1">
        {upgradePriority.length === 0 && (
          <p className="font-rajdhani text-sm text-neutral-600 py-4 text-center">
            Own heroes and add gear to generate upgrade recommendations.
          </p>
        )}
        {upgradePriority.map((item, i) => (
          <div key={item.type === 'callout' ? `callout-${i}` : `${item.heroId}-${item.slot}-${item.type}-${i}`} className={`flex items-start gap-2 p-2 border ${item.type === 'callout' ? 'border-amber-800 bg-amber-900/20' : 'border-neutral-800 bg-neutral-900'}`}>
            {item.type !== 'callout' && (
              <span className="font-mono text-xs text-neutral-600 w-5 flex-none pt-0.5">{i+1}.</span>
            )}
            <div className="flex-1 min-w-0">
              {item.type === 'callout' ? (
                <p className="font-rajdhani text-sm text-amber-500">⚠ {item.reason}</p>
              ) : item.type === 'level' ? (
                <>
                  <p className="font-rajdhani text-sm text-gray-200">
                    Upgrade <span className="text-amber-600">{slotLabels[item.slot]}</span> Lv {item.from} → {item.to}
                    <span className="text-neutral-500 ml-1 text-xs">— {HEROES[item.heroId]?.name}</span>
                  </p>
                  <p className="font-orbitron text-xs text-neutral-500">{item.reason}</p>
                </>
              ) : (
                <>
                  <p className="font-rajdhani text-sm text-gray-200">
                    Promote <span className="text-amber-600">{slotLabels[item.slot]}</span> to {item.to}★
                    <span className="text-neutral-500 ml-1 text-xs">— {HEROES[item.heroId]?.name}</span>
                  </p>
                  <p className="font-orbitron text-xs text-neutral-500">{item.reason}</p>
                  {item.blueprintWarning && <p className="font-orbitron text-xs text-amber-700">⚠ Blueprint cost — confirm availability</p>}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function HeroFormationCard({ heroId, state, heroScores, gearAssignment, alternates }) {
  const hero = HEROES[heroId]
  const colors = UNIT_COLORS[hero.unitType]
  const h = state.heroes[heroId]
  const slots = gearAssignment.assigned[heroId] ?? {}
  const alt = alternates[heroId]

  return (
    <div className={`border-t-4 ${colors.border} bg-neutral-900 border border-neutral-800 p-2 flex flex-col gap-1`}>
      {/* Hero identity */}
      <div>
        <p className="font-rajdhani font-semibold text-sm text-gray-200 truncate leading-tight">{hero.name}</p>
        <div className="flex items-center gap-1 flex-wrap">
          <span className={`font-orbitron text-xs ${colors.text}`}>{hero.rarity}</span>
          <span className="font-mono text-xs text-neutral-500">{h.stars}★</span>
          {h.ewLevel > 0 && <span className="font-mono text-xs text-sky-500">EW{h.ewLevel}</span>}
          <span className="font-mono text-xs text-amber-600 ml-auto">{heroScores[heroId]?.toFixed(1)}</span>
        </div>
      </div>

      {/* Gear slots — 2×2 grid */}
      <div className="grid grid-cols-2 gap-0.5">
        {SLOTS.map(slot => {
          const piece = slots[slot]
          const qColor = piece ? QUALITY_META[piece.quality]?.rowColor.split(' ')[0] : 'text-neutral-700'
          return (
            <div key={slot} className={`border ${piece ? 'border-neutral-700' : 'border-neutral-800 opacity-40'} px-1 py-0.5 text-center`}>
              <p className={`font-orbitron text-xs leading-tight ${piece ? qColor : 'text-neutral-600'}`}>{slot.toUpperCase()}</p>
              {piece
                ? <p className="font-mono text-xs text-gray-400 leading-tight">Lv{piece.level}{piece.stars > 0 ? ` ${piece.stars}★` : ''}</p>
                : <p className="font-orbitron text-xs text-neutral-800 leading-tight">—</p>
              }
            </div>
          )
        })}
      </div>

      {/* Alt hero */}
      {alt && (
        <p className="font-rajdhani text-xs text-neutral-600 leading-tight truncate">
          Alt: <span className="text-neutral-400">{HEROES[alt.heroId].name}</span>
          <span className="text-red-500 ml-1">({alt.scoreDiff.toFixed(1)})</span>
        </p>
      )}
    </div>
  )
}

function SquadOptimizer({ state, recommendedSquad, gearAssignment, heroScores }) {
  if (recommendedSquad.insufficient) {
    return (
      <div className="p-4">
        <p className="font-orbitron text-amber-600 text-xs tracking-widest border-b border-dashed border-neutral-700 pb-2 mb-3">
          // RECOMMENDED SQUAD
        </p>
        <p className="font-rajdhani text-sm text-neutral-500 py-4 text-center">
          Own at least 5 heroes to generate a squad recommendation.
        </p>
      </div>
    )
  }

  const { squad, alternates } = recommendedSquad
  const sorted = [...squad].sort((a, b) =>
    (HEROES[a].defaultRow === 'front' ? 0 : 1) - (HEROES[b].defaultRow === 'front' ? 0 : 1)
  )
  const frontRow = sorted.slice(0, 2)
  const backRow = sorted.slice(2)
  const cardProps = { state, heroScores, gearAssignment, alternates }

  return (
    <div className="p-3 max-w-lg">
      <p className="font-orbitron text-amber-600 text-xs tracking-widest border-b border-dashed border-neutral-700 pb-2 mb-4">
        // OPTIMAL SQUAD · SCORE {recommendedSquad.score.toFixed(1)}
      </p>

      {/* Enemy direction label */}
      <p className="font-orbitron text-xs text-neutral-600 tracking-widest text-center mb-1">▲ ENEMY ▲</p>

      {/* Front row — 2 cards side by side */}
      <div className="mb-1">
        <p className="font-orbitron text-xs text-neutral-500 tracking-widest mb-1">FRONT ROW</p>
        <div className="grid grid-cols-2 gap-2">
          {frontRow.map(id => <HeroFormationCard key={id} heroId={id} {...cardProps} />)}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-dashed border-neutral-700 my-2" />

      {/* Back row — 3 cards side by side */}
      <div className="mb-3">
        <p className="font-orbitron text-xs text-neutral-500 tracking-widest mb-1">BACK ROW</p>
        <div className="grid grid-cols-3 gap-2">
          {backRow.map(id => <HeroFormationCard key={id} heroId={id} {...cardProps} />)}
        </div>
      </div>

      <p className="font-orbitron text-xs text-neutral-600 tracking-widest text-center">▼ YOUR BASE ▼</p>
    </div>
  )
}

function GearSegBar({ level }) {
  return (
    <div className="flex gap-0.5 mt-1">
      {[0,10,20,30].map(start => {
        const segLevel = Math.min(10, Math.max(0, level - start))
        return (
          <div key={start} className="flex-1 h-1.5 bg-neutral-800 rounded-sm overflow-hidden">
            <div className="h-full bg-amber-600 transition-all" style={{ width: `${segLevel * 10}%` }} />
          </div>
        )
      })}
    </div>
  )
}

function StarPips({ stars }) {
  return (
    <div className="flex gap-0.5 mt-0.5">
      {[0,1,2,3,4].map(i => (
        <span key={i} className={`text-xs ${i < stars ? 'text-amber-500' : 'text-neutral-700'}`}>★</span>
      ))}
    </div>
  )
}

function GearPieceRow({ piece, onEdit }) {
  const slotLabels = { gun: 'GUN', chip: 'CHIP', armor: 'ARMOR', radar: 'RADAR' }
  const meta = QUALITY_META[piece.quality]

  return (
    <div className="flex items-center gap-2 px-2 py-2 border border-neutral-800 bg-neutral-900 mb-1 cursor-pointer hover:border-neutral-600 min-h-[44px]"
      onClick={onEdit}>
      <span className={`font-orbitron text-xs border px-1 flex-none ${meta.rowColor}`}>{meta.tag}</span>
      <span className="font-orbitron text-xs text-neutral-400 w-10 flex-none">{slotLabels[piece.slot]}</span>
      <div className="flex-1 min-w-0">
        <p className="font-mono text-xs text-gray-300">Lv {piece.level}</p>
        <GearSegBar level={piece.level} />
        <StarPips stars={piece.stars} />
      </div>
      <span className="font-mono text-xs text-amber-600 flex-none">{pieceScore(piece).toFixed(2)}</span>
    </div>
  )
}

function GearEditModal({ piece, onSave, onDelete, onClose }) {
  const [slot, setSlot] = useState(piece?.slot ?? 'gun')
  const [quality, setQuality] = useState(piece?.quality ?? 'legendary')
  const [level, setLevel] = useState(piece?.level ?? 0)
  const [stars, setStars] = useState(piece?.stars ?? 0)

  // Clamp level when quality changes
  const handleQualityChange = (q) => {
    setQuality(q)
    setLevel(l => Math.min(l, QUALITY_MAX_LEVEL[q]))
  }
  const isNew = !piece?.id

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-neutral-900 border border-amber-600 w-full max-w-sm p-4 space-y-4">
        <p className="font-orbitron text-amber-600 text-xs tracking-widest">{isNew ? '// ADD GEAR' : '// EDIT GEAR'}</p>

        {/* Slot */}
        <div>
          <p className="font-orbitron text-xs text-neutral-500 mb-1">SLOT</p>
          <div className="flex gap-1">
            {SLOTS.map(s => (
              <button key={s} onClick={() => setSlot(s)}
                className={`flex-1 py-2 font-orbitron text-xs border min-h-[40px] transition-colors
                  ${slot === s ? 'border-amber-600 text-amber-600 bg-amber-600/10' : 'border-neutral-700 text-neutral-500'}`}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Quality */}
        <div>
          <p className="font-orbitron text-xs text-neutral-500 mb-1">QUALITY — <span className="font-rajdhani normal-case text-neutral-600">match the color of your gear in-game</span></p>
          <div className="grid grid-cols-2 gap-1">
            {QUALITIES.map(q => {
              const meta = QUALITY_META[q]
              return (
                <button key={q} onClick={() => handleQualityChange(q)}
                  className={`flex flex-col items-start px-2 py-2 border text-left min-h-[44px] transition-colors
                    ${quality === q ? meta.selected : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'}`}>
                  <span className="font-orbitron text-xs">{meta.tag} — {meta.label}</span>
                  <span className="font-rajdhani text-xs text-neutral-500">{meta.hint}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Level */}
        <div>
          <p className="font-orbitron text-xs text-neutral-500 mb-1">
            LEVEL: <span className="text-amber-600">{level}</span>
            <span className="text-neutral-600 ml-1">/ {QUALITY_MAX_LEVEL[quality]}</span>
          </p>
          <input type="range" min="0" max={QUALITY_MAX_LEVEL[quality]} value={Math.min(level, QUALITY_MAX_LEVEL[quality])}
            onChange={e => setLevel(Number(e.target.value))} className="w-full" />
        </div>

        {/* Stars */}
        <div>
          <p className="font-orbitron text-xs text-neutral-500 mb-1">STARS</p>
          <div className="flex gap-1">
            {[0,1,2,3,4,5].map(s => (
              <button key={s} onClick={() => { setStars(s); if (s > 0) setLevel(QUALITY_MAX_LEVEL[quality]) }}
                className={`flex-1 py-1 font-orbitron text-xs border min-h-[36px] transition-colors
                  ${stars === s ? 'border-amber-600 text-amber-600 bg-amber-600/10' : 'border-neutral-700 text-neutral-500'}`}>
                {s}★
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button onClick={() => onSave({ slot, quality, level, stars })}
            className="flex-1 py-2 font-orbitron text-xs bg-amber-600 text-black hover:bg-amber-500 min-h-[44px]">
            {isNew ? 'ADD' : 'SAVE'}
          </button>
          {!isNew && (
            <button onClick={onDelete}
              className="px-4 py-2 font-orbitron text-xs border border-red-800 text-red-500 hover:bg-red-900/20 min-h-[44px]">
              DELETE
            </button>
          )}
          <button onClick={onClose}
            className="px-4 py-2 font-orbitron text-xs border border-neutral-700 text-neutral-400 hover:bg-neutral-800 min-h-[44px]">
            CANCEL
          </button>
        </div>
      </div>
    </div>
  )
}

function GearInventory({ state, dispatch }) {
  const [editPiece, setEditPiece] = useState(null)

  const counts = SLOTS.reduce((acc, slot) => {
    acc[slot] = state.gear.filter(g => g.slot === slot).length
    return acc
  }, {})

  return (
    <div className="p-3 max-w-lg">
      <p className="font-orbitron text-amber-600 text-xs tracking-widest border-b border-dashed border-neutral-700 pb-2 mb-3">
        // GEAR INVENTORY — FLAT LIST, NO HERO LOCK
      </p>

      {/* Summary + tooltip */}
      <div className="flex items-center gap-2 mb-3 flex-wrap" title="Moving gear between heroes costs a small gold fee in-game but is always worth it when the optimizer recommends it.">
        {SLOTS.map(s => (
          <span key={s} className="font-mono text-xs text-neutral-400 border border-neutral-700 px-2 py-0.5">
            {counts[s]}× {s.toUpperCase()}
          </span>
        ))}
        <span className="font-orbitron text-xs text-neutral-600 cursor-help">ⓘ</span>
      </div>

      {state.gear.length === 0 && (
        <p className="font-rajdhani text-sm text-neutral-600 py-4 text-center">No gear in inventory. Tap + ADD GEAR to begin.</p>
      )}
      {state.gear.map(piece => (
        <GearPieceRow key={piece.id} piece={piece} onEdit={() => setEditPiece(piece)} />
      ))}

      {/* FAB — positioned relative to avoid covering rec panel */}
      <button onClick={() => setEditPiece({})}
        className="fixed bottom-64 right-4 bg-amber-600 text-black font-orbitron text-xs px-4 py-3 hover:bg-amber-500 shadow-lg z-10 glow-amber min-h-[44px]">
        + ADD GEAR
      </button>

      {editPiece !== null && (
        <GearEditModal
          piece={Object.keys(editPiece).length > 0 ? editPiece : null}
          onSave={data => {
            if (editPiece.id) dispatch({ type: 'UPDATE_GEAR', id: editPiece.id, updates: data })
            else dispatch({ type: 'ADD_GEAR', piece: data })
            setEditPiece(null)
          }}
          onDelete={() => { dispatch({ type: 'DELETE_GEAR', id: editPiece.id }); setEditPiece(null) }}
          onClose={() => setEditPiece(null)}
        />
      )}
    </div>
  )
}

function HeroCard({ heroId, heroState: heroStateProp, heroScore, season, dispatch }) {
  const [expanded, setExpanded] = useState(false)
  const heroState = heroStateProp ?? { ...INITIAL_HERO_STATE }
  const hero = HEROES[heroId]
  const colors = UNIT_COLORS[hero.unitType]
  const isEffectiveUR = hero.rarity === 'UR' || isPromotedUR(heroId, season)
  const showEW = isEffectiveUR
  // Skill cap scales with EW: base 30, +1 per 3 EW levels, max 40
  const skillMax = isEffectiveUR ? Math.min(40, 30 + Math.floor(heroState.ewLevel / 3)) : 30
  const nearPromotion = hero.promotionSeason && hero.promotionSeason === season + 1

  return (
    <div className={`border-l-4 ${colors.border} bg-neutral-900 border border-neutral-800 mb-1 ${heroState.owned ? '' : 'opacity-50'}`}>
      {/* Compact row */}
      <div
        className="flex items-center gap-2 px-2 py-2 min-h-[44px] cursor-pointer select-none"
        onClick={() => {
          if (!heroState.owned) dispatch({ type: 'TOGGLE_HERO_OWNED', heroId })
          else setExpanded(e => !e)
        }}
      >
        {/* Rarity badge */}
        <span className={`font-orbitron text-xs px-1 py-0.5 border flex-none ${hero.rarity === 'UR' ? 'border-amber-500 text-amber-500' : hero.rarity === 'SSR' ? 'border-purple-500 text-purple-400' : 'border-neutral-600 text-neutral-500'}`}>
          {isPromotedUR(heroId, season) && hero.rarity === 'SSR' ? 'UR*' : hero.rarity}
        </span>

        {/* Name + role */}
        <div className="flex-1 min-w-0">
          <p className="font-rajdhani font-semibold text-sm text-gray-200 truncate">{hero.name}</p>
          <p className={`font-orbitron text-xs ${colors.text} opacity-70`}>{colors.label} · {hero.role.toUpperCase()}</p>
        </div>

        {/* Near-promotion badge */}
        {nearPromotion && (
          <span className="font-orbitron text-xs text-lime-500 border border-lime-600 px-1 flex-none">→UR S{hero.promotionSeason}</span>
        )}

        {/* Score */}
        {heroState.owned && (
          <span className="font-mono text-xs text-amber-600 ml-1">{heroScore?.toFixed(1) ?? '—'}</span>
        )}

        {/* Owned toggle + expand indicator */}
        <span className="font-orbitron text-xs text-neutral-600 flex-none">
          {heroState.owned ? (expanded ? '▲' : '▼') : '+ OWN'}
        </span>
      </div>

      {/* Expanded edit form */}
      {heroState.owned && expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-neutral-800 pt-2">
          {/* Stars */}
          <div>
            <p className="font-orbitron text-xs text-neutral-500 mb-1">STARS</p>
            <div className="flex gap-1">
              {[0,1,2,3,4,5].map(s => (
                <button key={s} onClick={() => dispatch({ type: 'UPDATE_HERO', heroId, updates: { stars: s } })}
                  className={`flex-1 py-1 font-rajdhani text-sm border min-h-[36px] transition-colors
                    ${heroState.stars === s ? 'border-amber-600 text-amber-600 bg-amber-600/10' : 'border-neutral-700 text-neutral-500'}`}>
                  {s}★
                </button>
              ))}
            </div>
          </div>

          {/* Level */}
          <div>
            <p className="font-orbitron text-xs text-neutral-500 mb-1">HERO LEVEL: <span className="text-amber-600">{heroState.level}</span></p>
            <input type="range" min="1" max="175" value={heroState.level}
              onChange={e => dispatch({ type: 'UPDATE_HERO', heroId, updates: { level: Number(e.target.value) } })}
              className="w-full" />
          </div>

          {/* Skills — unlock at each star: SK1@1★ SK2@2★ SK3@3★ SK4@4★ */}
          <div>
            <p className="font-orbitron text-xs text-neutral-500 mb-1">SKILL LEVELS <span className="text-neutral-600">(max {skillMax})</span></p>
            <div className="grid grid-cols-4 gap-1">
              {heroState.skills.map((lvl, i) => {
                const unlocked = i < (heroState.stars <= 1 ? 1 : Math.min(heroState.stars, 4))
                const promoted = isEffectiveUR && HEROES[heroId].rarity !== 'UR'
                const weights = (promoted && HERO_SKILL_WEIGHTS_PROMOTED[heroId])
                  ? HERO_SKILL_WEIGHTS_PROMOTED[heroId]
                  : (HERO_SKILL_WEIGHTS[heroId] ?? [1, 2, 3, 2])
                const skillNames = (promoted && HERO_SKILLS_PROMOTED[heroId])
                  ? HERO_SKILLS_PROMOTED[heroId]
                  : (HERO_SKILLS[heroId] ?? ['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4'])
                const isPriority = weights[i] === Math.max(...weights)
                const skillName = skillNames[i] ?? `Skill ${i + 1}`
                return (
                  <div key={i} className="text-center">
                    <p className={`font-orbitron text-xs mb-0.5 truncate ${unlocked ? (isPriority ? 'text-amber-500' : 'text-neutral-600') : 'text-neutral-800'}`}
                       title={skillName}>
                      {!unlocked ? '🔒' : isPriority ? '★' : ''} {skillName.length > 9 ? skillName.slice(0, 8) + '…' : skillName}
                    </p>
                    <input type="number" min="1" max={unlocked ? skillMax : 1} value={unlocked ? lvl : 1}
                      disabled={!unlocked}
                      onChange={e => {
                        if (!unlocked) return
                        const skills = [...heroState.skills]
                        skills[i] = Math.min(skillMax, Math.max(1, Number(e.target.value)))
                        dispatch({ type: 'UPDATE_HERO', heroId, updates: { skills } })
                      }}
                      className={`w-full bg-neutral-800 border text-center font-mono text-sm py-1 min-h-[36px]
                        ${unlocked ? 'border-neutral-700 text-gray-200' : 'border-neutral-800 text-neutral-700 cursor-not-allowed opacity-40'}`} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* EW Level (UR / promoted SSR only) */}
          {showEW && (
            <div>
              <p className="font-orbitron text-xs text-neutral-500 mb-1">EW LEVEL: <span className="text-amber-600">{heroState.ewLevel}</span> <span className="text-neutral-600">/ 30</span></p>
              <input type="range" min="0" max="30" value={heroState.ewLevel}
                onChange={e => dispatch({ type: 'UPDATE_HERO', heroId, updates: { ewLevel: Number(e.target.value) } })}
                className="w-full" />
              <div className="flex justify-between font-mono text-xs text-neutral-600 mt-0.5">
                <span>0</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
              </div>
            </div>
          )}

          {/* Unown button */}
          <button onClick={() => { setExpanded(false); dispatch({ type: 'TOGGLE_HERO_OWNED', heroId }) }}
            className="font-orbitron text-xs text-red-600 border border-red-900 px-3 py-1 hover:bg-red-900/20 min-h-[36px]">
            REMOVE FROM ROSTER
          </button>
        </div>
      )}
    </div>
  )
}

function RosterManager({ state, dispatch, heroScores, season }) {
  const RARITY_GROUPS = [
    { label: '// UR — ULTRA RARE', ids: ['kimberly','williams','murphy','marshall','stetmann','dva','tesla','swift','fiona','mcgregor','adam','morrison','schuyler','lucius','carlie'] },
    { label: '// SSR — SUPER RARE', ids: ['mason','violet','scarlett','venom','sarah','richard','elsa','maxwell','braz'] },
    { label: '// SR — RARE', ids: ['drake','kane','ambolt'] },
  ]

  return (
    <div className="p-3 max-w-lg">
      <p className="font-orbitron text-amber-600 text-xs tracking-widest border-b border-dashed border-neutral-700 pb-2 mb-3">
        // FIELD ROSTER — TAP HERO TO OWN · EXPAND FOR STATS
      </p>
      {RARITY_GROUPS.map(({ label, ids }) => (
        <div key={label} className="mb-4">
          <p className="font-orbitron text-xs text-neutral-500 tracking-widest mb-2">{label}</p>
          {ids.map(id => (
            <HeroCard
              key={id}
              heroId={id}
              heroState={state.heroes[id]}
              heroScore={heroScores[id]}
              season={state.season}
              dispatch={dispatch}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

function GoalSelector({ state, dispatch, ownedIds }) {
  const hasEW5 = ownedIds.some(id => (state.heroes[id]?.ewLevel ?? 0) >= 5)
  const showHybridWarning = (state.intent === 'hybrid_progress' || state.intent === 'full_hybrid') && !hasEW5

  return (
    <div className="p-4 space-y-6 max-w-lg">
      <p className="font-orbitron text-amber-600 text-xs tracking-widest border-b border-dashed border-neutral-700 pb-2">
        // MISSION PARAMETERS
      </p>

      {/* Season */}
      <div>
        <p className="font-orbitron text-xs text-neutral-400 tracking-widest mb-2">CURRENT SEASON</p>
        <div className="flex gap-1">
          {[1,2,3,4,5,6].map(s => (
            <button
              key={s}
              onClick={() => dispatch({ type: 'SET_SEASON', payload: s })}
              className={`flex-1 py-2 font-orbitron text-sm min-h-[44px] border transition-colors
                ${state.season === s
                  ? 'border-amber-600 text-amber-600 bg-amber-600/10 glow-amber'
                  : 'border-neutral-700 text-neutral-500 hover:border-neutral-500'
                }`}
            >
              S{s}
            </button>
          ))}
        </div>
      </div>

      {/* Goal */}
      <div>
        <p className="font-orbitron text-xs text-neutral-400 tracking-widest mb-2">OPTIMIZATION GOAL</p>
        <div className="space-y-1">
          {[
            { value: 'pvp_rally',    label: 'PvP Rally',    sub: 'Burst damage, alliance wars' },
            { value: 'world_boss',   label: 'World Boss',   sub: 'Sustained DPS, PvE' },
            { value: 'code_battles', label: 'Code Battles', sub: 'Specialized mode bonuses' },
            { value: 'balanced',     label: 'Balanced',     sub: 'No goal modifiers' },
          ].map(({ value, label, sub }) => (
            <button
              key={value}
              onClick={() => dispatch({ type: 'SET_GOAL', payload: value })}
              className={`w-full flex items-center justify-between px-3 py-2 border text-left min-h-[44px] transition-colors
                ${state.goal === value
                  ? 'border-amber-600 text-amber-600 bg-amber-600/10'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                }`}
            >
              <span className="font-orbitron text-sm">{label}</span>
              <span className="font-rajdhani text-xs text-neutral-500">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Intent */}
      <div>
        <p className="font-orbitron text-xs text-neutral-400 tracking-widest mb-2">SQUAD FORMATION INTENT</p>
        <div className="space-y-1">
          {[
            { value: 'mono',             label: 'Mono Type',          sub: '+25% bonus if all 5 same unit' },
            { value: 'hybrid_progress',  label: 'Hybrid In Progress', sub: 'Building toward full hybrid' },
            { value: 'full_hybrid',      label: 'Full Hybrid',        sub: 'EW 5+ present, mixed units' },
          ].map(({ value, label, sub }) => (
            <button
              key={value}
              onClick={() => dispatch({ type: 'SET_INTENT', payload: value })}
              className={`w-full flex items-center justify-between px-3 py-2 border text-left min-h-[44px] transition-colors
                ${state.intent === value
                  ? 'border-amber-600 text-amber-600 bg-amber-600/10'
                  : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                }`}
            >
              <span className="font-orbitron text-sm">{label}</span>
              <span className="font-rajdhani text-xs text-neutral-500">{sub}</span>
            </button>
          ))}
        </div>

        {showHybridWarning && (
          <div className="mt-3 p-3 border border-red-600 bg-red-600/10 font-rajdhani text-sm text-red-400">
            ⚠ Hybrid formation is high-risk — no owned hero has EW 5+. Level an Exclusive Weapon before switching intent.
          </div>
        )}
      </div>

      {/* Code type — unit type buffed this code (+50% damage) */}
      {state.goal === 'code_battles' && (
        <div>
          <p className="font-orbitron text-xs text-neutral-400 tracking-widest mb-1">
            CODE TYPE <span className="text-neutral-600 normal-case font-rajdhani">(+50% damage to buffed type)</span>
          </p>
          <p className="font-rajdhani text-xs text-neutral-600 mb-2">Which unit type does the current code buff?</p>
          <div className="grid grid-cols-2 gap-1">
            {[
              { value: null,       label: 'Unknown',  sub: 'No type modifier' },
              { value: 'tank',     label: 'Tank',     sub: '+50% tank hero damage' },
              { value: 'aircraft', label: 'Aircraft', sub: '+50% aircraft hero damage' },
              { value: 'missile',  label: 'Missile',  sub: '+50% missile hero damage' },
            ].map(({ value, label, sub }) => (
              <button
                key={String(value)}
                onClick={() => dispatch({ type: 'SET_CODE_TYPE', payload: value })}
                className={`flex flex-col items-start px-3 py-2 border text-left min-h-[44px] transition-colors
                  ${state.codeType === value
                    ? 'border-amber-600 text-amber-600 bg-amber-600/10'
                    : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                  }`}
              >
                <span className="font-orbitron text-xs">{label}</span>
                <span className="font-rajdhani text-xs text-neutral-500">{sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Opponent type — counter system (PvP only) */}
      {state.goal === 'pvp_rally' && (
        <div>
          <p className="font-orbitron text-xs text-neutral-400 tracking-widest mb-2">
            OPPONENT TYPE <span className="text-neutral-600 normal-case font-rajdhani">(+20% counter bonus)</span>
          </p>
          <div className="grid grid-cols-2 gap-1">
            {[
              { value: null,        label: 'Unknown / Mixed', sub: 'No counter modifier' },
              { value: 'tank',      label: 'Tank',            sub: 'Aircraft counters tanks' },
              { value: 'aircraft',  label: 'Aircraft',        sub: 'Missiles counter aircraft' },
              { value: 'missile',   label: 'Missile',         sub: 'Tanks counter missiles' },
            ].map(({ value, label, sub }) => (
              <button
                key={String(value)}
                onClick={() => dispatch({ type: 'SET_OPPONENT_TYPE', payload: value })}
                className={`flex flex-col items-start px-3 py-2 border text-left min-h-[44px] transition-colors
                  ${state.opponentType === value
                    ? 'border-amber-600 text-amber-600 bg-amber-600/10'
                    : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                  }`}
              >
                <span className="font-orbitron text-xs">{label}</span>
                <span className="font-rajdhani text-xs text-neutral-500">{sub}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function HelpGuide() {
  const Section = ({ title, children }) => (
    <div className="mb-6">
      <p className="font-orbitron text-amber-600 text-xs tracking-widest border-b border-dashed border-neutral-700 pb-1 mb-3">{title}</p>
      <div className="space-y-2 font-rajdhani text-sm text-neutral-300">{children}</div>
    </div>
  )
  const Row = ({ label, children }) => (
    <div className="flex gap-2">
      <span className="font-orbitron text-xs text-neutral-500 w-24 flex-none pt-0.5">{label}</span>
      <span className="flex-1">{children}</span>
    </div>
  )

  return (
    <div className="p-4 max-w-lg pb-8">
      <p className="font-orbitron text-amber-600 text-xs tracking-widest border-b border-dashed border-neutral-700 pb-2 mb-5">
        // FIELD MANUAL
      </p>

      <Section title="// QUICK START">
        <Row label="1. GOAL">Set your current season, optimization goal (PvP / World Boss / Code Battles), and squad intent (Mono or Hybrid).</Row>
        <Row label="2. ROSTER">Tap any hero to mark them as owned. Tap again to expand and enter their stars, hero level, skill levels, and EW level.</Row>
        <Row label="3. GEAR">Tap + ADD GEAR and enter each piece of gear you own. Select the color (Gold / Purple / Blue / Green) that matches the gear in-game.</Row>
        <Row label="4. SQUAD">The optimizer picks your best 5 heroes and assigns your gear. Check the bottom panel for your loadout, upgrade list, and warnings.</Row>
      </Section>

      <Section title="// ROSTER">
        <Row label="STARS">Each star unlocks a new skill. Starring up is usually more impactful than gear upgrades at low star counts.</Row>
        <Row label="SKILLS">Skills unlock by star: SK1 at 1★, SK2 at 2★, SK3 at 3★, SK4 at 4★. The ★ highlight shows the highest-priority skill to upgrade first.</Row>
        <Row label="EW LEVEL">Exclusive Weapon — only available to UR heroes and promoted SSRs. Every 3 EW levels raises the skill cap by 1 (base 30, max 40 at EW 30).</Row>
        <Row label="HERO LEVEL">Affects march size (how many troops a hero leads). Leveling heroes directly increases damage output and survivability.</Row>
      </Section>

      <Section title="// GEAR">
        <Row label="QUALITY">Match the color of your gear in-game — Gold (Legendary, max Lv40), Purple (Epic, max Lv30), Blue (Rare, max Lv15), Green (Common, max Lv10).</Row>
        <Row label="STARS">Gear must be at max level before it can be starred. Selecting any star automatically sets the level to max. Blueprints required for 1–4★, Mythic Blueprints for 5★.</Row>
        <Row label="NO HERO LOCK">Gear is never assigned to a specific hero. The optimizer re-solves the full assignment every time — just enter what you own.</Row>
        <Row label="INVEST">Focus all investment on Legendary (Gold) gear. Dismantle Epic and below for crafting materials.</Row>
      </Section>

      <Section title="// SQUAD OPTIMIZER">
        <Row label="FORMATION">Always 2 front row (tanks absorb damage), 3 back row (DPS and support deal damage from safety).</Row>
        <Row label="MONO BONUS">All 5 heroes same unit type: +20% HP/ATK/DEF. 4 same: +15%. 3+2 split: +10%. 3 same: +5%.</Row>
        <Row label="EW TYPE BUFF">Each hero with EW ≥ 20 grants +7.5% to all same-type squad members. Stack multiple EW 20+ heroes of the same type for compounding benefit.</Row>
        <Row label="COUNTER">In PvP, set Opponent Type to apply the +20% counter damage bonus. Tanks beat Missiles, Missiles beat Aircraft, Aircraft beat Tanks.</Row>
        <Row label="ALT HERO">Each hero slot shows the next-best swap and how many points you lose by using it.</Row>
      </Section>

      <Section title="// UPGRADE PRIORITY">
        <Row label="MAX EFF">Scores every possible next upgrade globally. Best absolute return on resources. Milestone levels (10/20/30/40) and star breakpoints (2★/4★) are weighted 2×.</Row>
        <Row label="ROLE">Flags misalignment between gear levels and hero role. DPS: Gun should lead. Tank: Armor should lead. Support: Radar should lead.</Row>
        <Row label="W-LINK">Finds the weakest gear piece in the squad and prioritizes closing the gap to squad average before pushing any leader higher.</Row>
        <Row label="BLUEPRINTS">Any star promotion shows a ⚠ Blueprint cost warning. Confirm you have the resources before spending — Blueprints are scarce.</Row>
      </Section>

      <Section title="// PROFILES & SHARING">
        <Row label="PROFILES">Tap your profile name (top right) to create, rename, duplicate, or delete profiles. Data saves automatically to your browser.</Row>
        <Row label="EXPORT">Tap EXPORT JSON to copy the current profile to your clipboard. Share it with alliance members so they can import it.</Row>
        <Row label="IMPORT">Tap IMPORT JSON and paste a shared profile string to load it as a new profile on your device.</Row>
        <Row label="BACKUP">To back up all profiles at once, open browser DevTools → Application → Local Storage → copy the value of <span className="font-mono text-xs text-amber-600">lastwar_optimizer_v1</span>.</Row>
      </Section>
    </div>
  )
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, buildInitialState)

  // Persist to localStorage on every state change
  useEffect(() => {
    try {
      localStorage.setItem('lastwar_optimizer_v1', JSON.stringify({
        profiles: state.profiles,
        activeProfile: state.activeProfile,
      }))
    } catch { /* quota exceeded — ignore */ }
  }, [state.profiles, state.activeProfile])

  // Derived / computed values — all optimizer results are pure functions of state
  const ownedIds = useMemo(
    () => Object.keys(state.heroes).filter(id => state.heroes[id].owned),
    [state.heroes]
  )

  const heroScores = useMemo(
    () => computeAllHeroScores(state.heroes, state.season, state.goal, state.codeType),
    [state.heroes, state.season, state.goal, state.codeType]
  )

  const recommendedSquad = useMemo(
    () => findRecommendedSquad(ownedIds, heroScores, state.heroes, state.intent, state.opponentType),
    [ownedIds, heroScores, state.heroes, state.intent, state.opponentType]
  )

  const gearAssignment = useMemo(
    () => assignGear(recommendedSquad.squad, state.gear, heroScores),
    [recommendedSquad.squad, state.gear, heroScores]
  )

  const hasSquadEW5 = useMemo(
    () => recommendedSquad.squad.some(id => (state.heroes[id]?.ewLevel ?? 0) >= 5),
    [recommendedSquad.squad, state.heroes]
  )

  const upgradePriority = useMemo(
    () => computeUpgradePriority(gearAssignment.assigned, heroScores, state.upgradeMode, state.intent, hasSquadEW5),
    [gearAssignment.assigned, heroScores, state.upgradeMode, state.intent, hasSquadEW5]
  )

  const warnings = useMemo(
    () => computeWarnings(state, recommendedSquad.squad, state.season),
    [state.intent, state.heroes, state.gear, recommendedSquad.squad, state.season]
  )

  const sections = {
    goal:     <GoalSelector state={state} dispatch={dispatch} ownedIds={ownedIds} />,
    roster:   <RosterManager state={state} dispatch={dispatch} heroScores={heroScores} season={state.season} />,
    gear:     <GearInventory state={state} dispatch={dispatch} />,
    squad:    <SquadOptimizer state={state} recommendedSquad={recommendedSquad} gearAssignment={gearAssignment} heroScores={heroScores} />,
    upgrades: <UpgradePriority state={state} dispatch={dispatch} upgradePriority={upgradePriority} />,
    help:     <HelpGuide />,
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-950 text-gray-200 overflow-hidden">
      {/* Top bar */}
      <div className="flex-none h-12 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-3 z-10">
        <span className="font-orbitron text-amber-600 text-sm tracking-widest">LAST WAR OPS</span>
        <ProfileSwitcher state={state} dispatch={dispatch} />
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Icon rail */}
        <nav className="flex-none w-10 md:w-40 bg-neutral-900 border-r border-neutral-800 flex flex-col py-2 overflow-y-auto">
          {[
            { key: 'goal',     icon: '🎯', label: 'GOAL'     },
            { key: 'roster',   icon: '👥', label: 'ROSTER'   },
            { key: 'gear',     icon: '⚙️', label: 'GEAR'     },
            { key: 'squad',    icon: '📊', label: 'SQUAD'    },
            { key: 'upgrades', icon: '📈', label: 'UPGRADES' },
            { key: 'help',     icon: '❓', label: 'HELP'     },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => dispatch({ type: 'SET_SECTION', payload: key })}
              className={`flex items-center gap-2 px-2 py-3 text-left border-l-2 transition-colors min-h-[44px]
                ${state.activeSection === key
                  ? 'border-amber-600 bg-amber-600/10 text-amber-600'
                  : 'border-transparent text-neutral-500 hover:text-gray-300 hover:bg-neutral-800'
                }`}
            >
              <span className="text-base flex-none w-6 text-center">{icon}</span>
              <span className="hidden md:block font-orbitron text-xs tracking-widest">{label}</span>
            </button>
          ))}
        </nav>

        {/* Section content */}
        <main className="flex-1 overflow-y-auto">
          {sections[state.activeSection]}
        </main>
      </div>

      <RecPanel
        state={state}
        dispatch={dispatch}
        recommendedSquad={recommendedSquad}
        gearAssignment={gearAssignment}
        upgradePriority={upgradePriority}
        warnings={warnings}
      />
    </div>
  )
}
