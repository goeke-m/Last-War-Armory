import { useState, useReducer, useMemo, useEffect } from 'react'
import { QUALITY_MAX_LEVEL } from './gear/constants.js'
import { RESOURCES, rankUpgrades, coverage } from './gear/roi.js'
import { assignGear as placeGear, releaseClashingPins } from './squad/assign.js'
import { rowOf, arrangeFormation, swapRows } from './squad/rows.js'

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
  dva:      { id: 'dva',      name: 'DVA',      rarity: 'UR', unitType: 'aircraft', role: 'dps', defaultRow: 'back', promotionSeason: null },
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
  farhad:   { id: 'farhad',   name: 'Farhad',   rarity: 'SSR', unitType: 'tank', role: 'dps', defaultRow: 'back', promotionSeason: null },
  monica:   { id: 'monica',   name: 'Monica',   rarity: 'SSR', unitType: 'tank', role: 'support', defaultRow: 'back', promotionSeason: null },
  venom:    { id: 'venom',    name: 'Venom',    rarity: 'SSR', unitType: 'missile', role: 'dps', defaultRow: 'back', promotionSeason: 5 },
  sarah:    { id: 'sarah',    name: 'Sarah',    rarity: 'SSR', unitType: 'aircraft', role: 'support', defaultRow: 'back', promotionSeason: 4 },
  richard:  { id: 'richard',  name: 'Richard',  rarity: 'SSR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: null },
  elsa:     { id: 'elsa',     name: 'Elsa',     rarity: 'SSR', unitType: 'missile', role: 'support', defaultRow: 'back', promotionSeason: null },
  maxwell:  { id: 'maxwell',  name: 'Maxwell',  rarity: 'SSR', unitType: 'aircraft', role: 'dps', defaultRow: 'back', promotionSeason: null },
  cage:     { id: 'cage',     name: 'Cage',     rarity: 'SSR', unitType: 'aircraft', role: 'tank', defaultRow: 'front', promotionSeason: null },
  braz:     { id: 'braz',     name: 'Braz',     rarity: 'SSR', unitType: 'aircraft', role: 'dps', defaultRow: 'back', promotionSeason: 6 },

  // SR heroes
  //drake:    { id: 'drake',    name: 'Drake',    rarity: 'SR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: null },
  gump:     { id: 'gump',     name: 'Gump',     rarity: 'SR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: null },
  loki:     { id: 'loki',     name: 'Loki',     rarity: 'SR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: null },
  kane:     { id: 'kane',     name: 'Kane',     rarity: 'SR', unitType: 'missile', role: 'dps', defaultRow: 'back', promotionSeason: null },
  ambolt:   { id: 'ambolt',   name: 'Ambolt',   rarity: 'SR', unitType: 'aircraft', role: 'support', defaultRow: 'back', promotionSeason: null },
}

// Ordered for roster display: UR → SSR → SR
const HERO_ORDER = [
  // UR
  'kimberly','williams','murphy','marshall','stetmann',
  'tesla','swift','fiona','mcgregor','adam',
  'dva', 'morrison','schuyler','lucius','carlie',
  // SSR
  'mason','violet','scarlett','farhad','monica','venom',
  'sarah','richard','elsa','maxwell','cage','braz',
  // SR
  //drake:    { id: 'drake',    name: 'Drake',    rarity: 'SR', unitType: 'tank', role: 'tank', defaultRow: 'front', promotionSeason: null },
  'gump','loki','kane','ambolt',
]

/* v1: skills are switched off. Skills have stats that raise a hero's effectiveness;
   bring these back when the hero score models those stats.

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
  //drake:    ['Cannon Fire',         'Hard Armor',            'Shield Bash',           'Special Tactics'],
  kane:     ['Blasting Grenade',    'Steady Aim',            'Grenade Barrage',       'Field Combat'],
  ambolt:   ['Missile Strikes',     'Rapid Fire',            'Missile Barrage',       'Field Combat'],
  monica:   ['Dual Fire Cannon',    'Treasure Hunter',       'Weak Spot Scan',        'Special Tactics'],
  farhad:   ['Missile Strike',      'Precision Aim',         'Missile Volley',        'Special Tactics'],
  cage:     ['Energy Bullet',       'Z-Armor',               'Defense Boost',         'Special Tactics'],
  gump:     ['Flame Burst',         'Field Combat',          'Flame Boost',           'Special Tactics'],
  loki:     ['Shotgun',             'Field Combat',          'Grapeshot Burst',       'Special Tactics'],
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
  //drake:    [1, 3, 4, 2], // priority: 3>2>4>1
  kane:     [3, 2, 4, 1], // priority: 3>1>2>4
  ambolt:   [3, 2, 4, 1], // priority: 3>1>2>4
}

// Skill names that change when an SSR hero promotes to UR — overrides HERO_SKILLS when promoted
const HERO_SKILLS_PROMOTED = {
  mason:    ['Rampage Shot',     'Zombie Cleaner',     'Firepower Overload', 'Super Sensing'],
  violet:   ['Frost Spray',      'Ice Armor',          'Chill Corrosion',    'Frost Buff'],
  scarlett: ['Inferno Strike',   'Armored Shell',      'Flame Barrier',      'Super Sensing'],
  venom:    ['Corrosive Shot',   'Promotion Synergy',  'Corrosive Barrage',  'Super Sensing'],
  sarah:    ['Phantom Shot',     'Falcon Strike',      'Airspace Supremacy', 'Super Sensing'],
}

// Skill priority weights that change post-promotion — overrides HERO_SKILL_WEIGHTS when promoted
const HERO_SKILL_WEIGHTS_PROMOTED = {
  // Venom UR: Corrosive Barrage (SK3) > Promotion Synergy (SK2) > Corrosive Shot (SK1, applies stacks) > Super Sensing (SK4)
  venom: [2, 3, 4, 1],
  // Violet UR: Ice Armor (SK2) remains dominant, Frost Buff (SK4) gains value as squad-wide DR
  // priority unchanged: 2>3>4>1 → [1,4,3,2] same as SSR
}
*/

const SLOTS = ['gun', 'chip', 'armor', 'radar']
const QUALITIES = ['legendary', 'epic', 'rare', 'common']
// v1 covers end-game gear only: Gold is the one quality offered when adding gear (no stat data mined for the others yet).
const QUALITIES_V1 = ['legendary']
const QUALITY_WEIGHTS = { legendary: 4, epic: 2, rare: 1, common: 0.5 }
const QUALITY_META = {
  legendary: { label: 'Legendary', tag: 'Gold',   hint: 'Max Lv 40, invest here',        text: 'text-q-gold',   swatch: 'bg-q-gold' },
  epic:      { label: 'Epic',      tag: 'Purple', hint: 'Max Lv 30, dismantle for mats', text: 'text-q-purple', swatch: 'bg-q-purple' },
  rare:      { label: 'Rare',      tag: 'Blue',   hint: 'Max Lv 15, early game only',    text: 'text-q-blue',   swatch: 'bg-q-blue' },
  common:    { label: 'Common',    tag: 'Green',  hint: 'Max Lv 10, dismantle now',      text: 'text-q-green',  swatch: 'bg-q-green' },
}
const RARITY_WEIGHTS = { UR: 3, SSR: 2, SR: 1 }

// Slot priority order by hero role for gear assignment
const SLOT_PRIORITY = {
  dps:     ['gun', 'chip', 'radar', 'armor'],
  tank:    ['armor', 'radar', 'gun', 'chip'],
  support: ['radar', 'chip', 'armor', 'gun'],
}

// Unit type → Tailwind color tokens. label is used inside sentences, name on its own.
const UNIT_COLORS = {
  tank:     { border: 'border-tank',    bg: 'bg-tank',    text: 'text-tank',    label: 'tank',     name: 'Tank'     },
  aircraft: { border: 'border-air',     bg: 'bg-air',     text: 'text-air',     label: 'aircraft', name: 'Aircraft' },
  missile:  { border: 'border-missile', bg: 'bg-missile', text: 'text-missile', label: 'missile',  name: 'Missile'  },
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
// row: the hero's effective row (the player's placement, else the hero's default)
function getGoalMod(heroId, goal, codeType, row = HEROES[heroId].defaultRow) {
  if (goal === 'code_battles') {
    if (codeType && HEROES[heroId].unitType === codeType) return 1.5
    return 1.0
  }
  const explicit = GOAL_WEIGHTS[goal][heroId]
  if (explicit !== undefined) return explicit
  const hero = HEROES[heroId]
  if ((goal === 'pvp_rally' || goal === 'world_boss') && hero.role === 'dps' && row === 'back') {
    return 1.15
  }
  return 1.0
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 2: OPTIMIZER ENGINE
// ═══════════════════════════════════════════════════════════════════

function isPromotedUR(heroId, heroState, season) {
  const h = HEROES[heroId]
  return h.promotionSeason !== null && h.promotionSeason <= season && (heroState?.promoted ?? false)
}

function heroScore(heroId, heroState, season, goal, codeType, rows) {
  const { stars, ewLevel } = heroState // v1: heroState.skills is kept but not scored
  const effectiveRarity = isPromotedUR(heroId, heroState, season) ? 'UR' : HEROES[heroId].rarity
  const rarityWeight = RARITY_WEIGHTS[effectiveRarity]
  /* v1: skills are switched off. Skills have stats that raise a hero's effectiveness;
     bring this back when the hero score models those stats.
  // UR skill cap starts at 30 and gains +1 per 3 EW levels (EW 30 = cap 40)
  const skillMax = effectiveRarity === 'UR' ? Math.min(40, 30 + Math.floor(ewLevel / 3)) : 30
  // Skills unlock by star: 0-1★=skill1 only, 2★=skills1-2, 3★=skills1-3, 4★+=all4.
  // Skill 4 can't be leveled: it is at max as soon as it unlocks.
  const unlockedCount = stars <= 1 ? 1 : Math.min(stars, 4)
  const promoted = effectiveRarity === 'UR' && HEROES[heroId].rarity !== 'UR'
  const weights = (promoted && HERO_SKILL_WEIGHTS_PROMOTED[heroId])
    ? HERO_SKILL_WEIGHTS_PROMOTED[heroId]
    : (HERO_SKILL_WEIGHTS[heroId] ?? [1, 2, 3, 2])
  const activeWeights = weights.slice(0, unlockedCount)
  const weightSum = activeWeights.reduce((a, b) => a + b, 0)
  const weightedSkillSum = skills.slice(0, unlockedCount).reduce((sum, lvl, i) => sum + (i === 3 ? skillMax : lvl) * activeWeights[i], 0)
  const avgSkill = weightedSkillSum / weightSum
  */
  const base = rarityWeight * (stars / 5) // with skills: rarityWeight * (stars / 5) * (avgSkill / skillMax)
  const starBonus = stars >= 4 ? 1.4 : stars >= 3 ? 1.2 : 1.0
  // ewBonus: 5% per level across 0-30 range
  const ewBonus = effectiveRarity === 'UR' && ewLevel > 0 ? 1 + ewLevel * 0.05 : 1.0
  const goalMod = getGoalMod(heroId, goal, codeType, rowOf(heroId, rows, HEROES[heroId].defaultRow))
  return base * starBonus * ewBonus * goalMod
}

function pieceScore(piece) {
  const maxLevel = QUALITY_MAX_LEVEL[piece.quality] ?? 40
  return QUALITY_WEIGHTS[piece.quality] * (piece.level / maxLevel) * (1 + piece.stars * 0.2)
}

// Returns { [heroId]: score } for all owned heroes
function computeAllHeroScores(heroes, season, goal, codeType, rows) {
  const scores = {}
  for (const [id, state] of Object.entries(heroes)) {
    if (state.owned) scores[id] = heroScore(id, state, season, goal, codeType, rows)
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
      active.push(`${HEROES[id].name} EW20 buffs ${buffedCount} ${UNIT_COLORS[t].label} squad members — +7.5% each`)
    }
  }

  // EW near-miss: squad hero with EW 15–19 (within striking distance of EW20 buff)
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

function hasFrontTank(combo, rows) {
  return combo.some(id => HEROES[id].role === 'tank' && rowOf(id, rows, HEROES[id].defaultRow) === 'front')
}

// Returns { squad: heroId[], alternates: {[heroId]: {heroId, scoreDiff}}, score, insufficient }
function findRecommendedSquad(ownedIds, heroScores, heroes, intent, opponentType, rows) {
  if (ownedIds.length < 5) {
    return { squad: ownedIds, alternates: {}, score: 0, insufficient: true }
  }
  const combos = getCombinations(ownedIds, 5)
  const valid = combos.filter(c => hasFrontTank(c, rows))
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
      if (valid.length > 0 && !hasFrontTank(swapped, rows)) continue
      const s = computeSquadScore(swapped, heroScores, heroes, intent, opponentType)
      if (s > bestAltScore) { bestAltScore = s; bestAlt = altId }
    }
    if (bestAlt) alternates[heroId] = { heroId: bestAlt, scoreDiff: bestAltScore - best.score }
  }

  const reasoning = computeSquadReasoning(best.combo, heroes, opponentType, ownedIds)
  return { squad: best.combo, alternates, score: best.score, reasoning, insufficient: false }
}

// Pinned pieces stay on their hero; the rest goes best-first by hero score and role slot priority.
function assignGear(squadIds, gear, heroScores) {
  return placeGear(squadIds, gear, {
    rank: heroScores,
    pieceScore,
    slotPriority: id => SLOT_PRIORITY[HEROES[id].role] ?? SLOT_PRIORITY.dps,
  })
}

// The squad in use: the player's locked 5 when set and all still owned, else the recommendation.
function activeSquad(recommended, squadLock, ownedIds, heroScores, heroes, intent, opponentType) {
  const locked = Array.isArray(squadLock) && squadLock.length === 5 && squadLock.every(id => ownedIds.includes(id))
  if (!locked) return { ...recommended, locked: false, recommended }
  return {
    squad: squadLock, alternates: {}, insufficient: false, locked: true, recommended,
    score: computeSquadScore(squadLock, heroScores, heroes, intent, opponentType),
    reasoning: computeSquadReasoning(squadLock, heroes, opponentType, ownedIds),
  }
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
function computeUpgradePriority(assigned, heroScores, mode, intent, hasEW5, resource) {
  let list = []
  if (mode === 'max_efficiency') list = rankUpgrades(assigned, resource)
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

const INITIAL_HERO_STATE = { owned: false, stars: 0, level: 1, skills: [1, 1, 1, 1], ewLevel: 0, promoted: false }

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
    squadLock: state.squadLock,
    rows: state.rows,
  }
}

// Syncs profiles[activeProfile] from flat state fields — called in reducer after every profile-affecting action
function syncProfile(state) {
  return { ...state, profiles: { ...state.profiles, [state.activeProfile]: getProfileData(state) } }
}

function loadFromLocalStorage() {
  try {
    // The key predates the Armory name; kept so existing saved profiles still load.
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
  squadLock: null, // the player's own 5 heroes, or null to use the recommended squad
  rows: {},        // { [heroId]: 'front' | 'back' }, the player's row placement
}

// Profiles saved before squadLock/rows existed load with the defaults.
const PROFILE_DEFAULTS = { squadLock: null, rows: {} }

// Merges any heroes added after a profile was saved so new heroes always exist in state
// Heroes no longer in HEROES (e.g. Drake) are dropped so old profiles still load.
function mergeHeroes(saved) {
  const known = Object.fromEntries(Object.entries(saved).filter(([id]) => HEROES[id]))
  return { ...INITIAL_HEROES_STATE, ...known }
}

function buildInitialState() {
  const saved = loadFromLocalStorage()
  if (saved) {
    const profile = saved.profiles[saved.activeProfile] ?? BLANK_PROFILE
    return {
      ...PROFILE_DEFAULTS,
      ...profile,
      heroes: mergeHeroes(profile.heroes ?? {}),
      profiles: saved.profiles,
      activeProfile: saved.activeProfile,
      activeSection: 'roster',
      upgradeMode: 'max_efficiency',
      limitingResource: RESOURCES[0],
    }
  }
  return {
    ...BLANK_PROFILE,
    profiles: { [DEFAULT_PROFILE_NAME]: BLANK_PROFILE },
    activeProfile: DEFAULT_PROFILE_NAME,
    activeSection: 'roster',
    upgradeMode: 'max_efficiency',
    limitingResource: RESOURCES[0],
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
    case 'ADD_GEAR': {
      const id = crypto.randomUUID()
      return syncProfile({ ...state, gear: releaseClashingPins([...state.gear, { ...action.piece, id }], id) })
    }
    case 'UPDATE_GEAR': {
      const gear = state.gear.map(g => g.id === action.id ? { ...g, ...action.updates } : g)
      return syncProfile({ ...state, gear: releaseClashingPins(gear, action.id) })
    }
    case 'SET_SQUAD_LOCK':
      return syncProfile({ ...state, squadLock: action.payload })
    case 'SET_ROWS':
      return syncProfile({ ...state, rows: action.payload })
    case 'DELETE_GEAR':
      return syncProfile({ ...state, gear: state.gear.filter(g => g.id !== action.id) })

    // UI state (not synced to profile)
    case 'SET_SECTION':
      return { ...state, activeSection: action.payload }
    case 'SET_UPGRADE_MODE':
      return { ...state, upgradeMode: action.payload }
    case 'SET_LIMITING_RESOURCE':
      return { ...state, limitingResource: action.payload }

    // Profile management
    case 'NEW_PROFILE': {
      const name = action.name
      const blank = { ...BLANK_PROFILE, heroes: { ...INITIAL_HEROES_STATE } }
      return { ...state, profiles: { ...state.profiles, [name]: blank }, activeProfile: name, ...blank }
    }
    case 'SWITCH_PROFILE': {
      const profile = state.profiles[action.name]
      if (!profile) return state
      return { ...state, activeProfile: action.name, ...PROFILE_DEFAULTS, ...profile, heroes: mergeHeroes(profile.heroes ?? {}) }
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
      return { ...state, profiles: remaining, activeProfile: nextActive, ...PROFILE_DEFAULTS, ...nextProfile, heroes: mergeHeroes(nextProfile.heroes ?? {}) }
    }
    case 'IMPORT_PROFILE': {
      const { name, data } = action
      return { ...state, profiles: { ...state.profiles, [name]: data }, activeProfile: name, ...PROFILE_DEFAULTS, ...data, heroes: mergeHeroes(data.heroes ?? {}) }
    }

    default:
      return state
  }
}

// ═══════════════════════════════════════════════════════════════════
// SECTION 4: UI
// ═══════════════════════════════════════════════════════════════════

const SLOT_NAMES = { gun: 'Gun', chip: 'Chip', armor: 'Armor', radar: 'Radar' }
const ROLE_NAMES = { dps: 'DPS', tank: 'Tank', support: 'Support' }

// Shared control styles. Selected choices get a yellow tint; the solid yellow fill is kept for each screen's main action.
const choice = on => `border rounded-xs transition-colors ${on
  ? 'border-accent bg-signal/15 text-ink'
  : 'border-line text-ink-2 hover:border-ink-3 hover:text-ink'}`
const btnPrimary = 'rounded-xs bg-signal text-on-signal font-semibold px-4 min-h-[44px] hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed'
const btnSecondary = 'rounded-xs border border-line text-ink-2 px-3 min-h-[40px] hover:border-ink-3 hover:text-ink'
const btnDanger = 'rounded-xs border border-danger/50 text-danger px-3 min-h-[40px] hover:bg-danger/10'

function Title({ children, note, action }) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="stencil-title">{children}</h1>
        {note && <p className="text-sm text-ink-2 mt-2 max-w-[60ch]">{note}</p>}
      </div>
      {action}
    </header>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-2 mb-1.5">
        {label}{hint && <span className="font-normal text-ink-3"> ({hint})</span>}
      </p>
      {children}
    </div>
  )
}

function Chevron({ open }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className={`flex-none transition-transform ${open ? 'rotate-180' : ''}`}>
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Centered dialog on wide screens, bottom sheet on phones. Escape or a tap outside closes it.
function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <button aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 bg-black/55 cursor-default" />
      <div role="dialog" aria-modal="true" aria-label={title}
        className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto bg-raised border border-line rounded-t-md sm:rounded-xs p-5 space-y-5 shadow-2xl">
        <h2 className="font-stencil text-2xl leading-none">{title}</h2>
        {children}
      </div>
    </div>
  )
}

function ProfileSwitcher({ state, dispatch }) {
  const [open, setOpen] = useState(false)
  const [importModal, setImportModal] = useState(false)
  const [importText, setImportText] = useState('')
  const [importFile, setImportFile] = useState('') // name of the file loaded into importText, if any
  const [importError, setImportError] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2400) }

  // Saves the current profile as a .json file named after it, e.g. lastwar-main-account.json.
  const handleExport = () => {
    const data = JSON.stringify({ _name: state.activeProfile, ...state.profiles[state.activeProfile] }, null, 2)
    const slug = state.activeProfile.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'profile'
    const fileName = `lastwar-${slug}.json`
    const url = URL.createObjectURL(new Blob([data], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    showToast(`Downloaded ${fileName}`)
    setOpen(false)
  }

  // A chosen file is read into the text box, so a file and pasted JSON import the same way.
  const handleFile = async e => {
    const file = e.target.files?.[0]
    e.target.value = '' // lets the same file be chosen again
    if (!file) return
    try {
      setImportText(await file.text())
      setImportFile(file.name)
      setImportError('')
    } catch {
      setImportError(`Couldn’t read ${file.name}. Choose the file again, or paste its contents below.`)
    }
  }

  const handleImport = () => {
    try {
      const data = JSON.parse(importText)
      const { _name, ...profile } = data
      if (!profile.heroes || !profile.gear) { setImportError('This JSON has no heroes or gear. Use a profile downloaded from this app.'); return }
      const name = _name ?? `Import ${Date.now()}`
      dispatch({ type: 'IMPORT_PROFILE', name, data: profile })
      closeImport()
    } catch {
      setImportError(importFile
        ? `${importFile} isn’t valid JSON. Choose a profile file downloaded from this app.`
        : 'That isn’t valid JSON. Paste the profile exactly as it is.')
    }
  }
  const closeImport = () => { setImportModal(false); setImportText(''); setImportFile(''); setImportError('') }

  const names = Object.keys(state.profiles)
  const itemBase = 'w-full text-left px-3 min-h-[40px] text-sm'
  const item = `${itemBase} text-ink-2 hover:bg-panel hover:text-ink`

  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} aria-expanded={open} aria-haspopup="menu"
        className="flex items-center gap-2 text-sm text-ink border border-line rounded-xs px-3 min-h-[36px] max-w-[180px] hover:border-ink-3">
        <span className="truncate">{state.activeProfile}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <>
          <button aria-label="Close menu" tabIndex={-1} className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
          <div role="menu" className="absolute right-0 top-full mt-1 bg-raised border border-line rounded-xs z-50 min-w-[220px] py-1 shadow-xl">
            <p className="px-3 pt-1 pb-1 text-xs text-ink-3">Profiles</p>
            {names.map(name => (
              <button key={name} role="menuitemradio" aria-checked={name === state.activeProfile}
                onClick={() => { dispatch({ type: 'SWITCH_PROFILE', name }); setOpen(false) }}
                className={`${name === state.activeProfile ? `${itemBase} text-ink font-semibold hover:bg-panel` : item} flex items-center gap-2`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-none ${name === state.activeProfile ? 'bg-signal' : 'bg-transparent'}`} />
                <span className="truncate">{name}</span>
              </button>
            ))}
            <div className="border-t border-line-soft my-1" />
            <button role="menuitem" className={item} onClick={() => {
              const name = prompt('New profile name:')
              if (name?.trim()) dispatch({ type: 'NEW_PROFILE', name: name.trim() })
              setOpen(false)
            }}>New profile</button>
            <button role="menuitem" className={item} onClick={() => {
              const newName = prompt('Rename to:', state.activeProfile)
              if (newName?.trim() && newName.trim() !== state.activeProfile) {
                dispatch({ type: 'RENAME_PROFILE', oldName: state.activeProfile, newName: newName.trim() })
              }
              setOpen(false)
            }}>Rename</button>
            <button role="menuitem" className={item} onClick={() => { dispatch({ type: 'DUPLICATE_PROFILE', name: state.activeProfile }); setOpen(false) }}>
              Duplicate
            </button>
            <div className="border-t border-line-soft my-1" />
            <button role="menuitem" className={item} onClick={handleExport}>Download as JSON</button>
            <button role="menuitem" className={item} onClick={() => { setImportModal(true); setOpen(false) }}>Import profile</button>
            <div className="border-t border-line-soft my-1" />
            <button role="menuitem" className={`${itemBase} text-danger hover:bg-danger/10`}
              onClick={() => { dispatch({ type: 'DELETE_PROFILE', name: state.activeProfile }); setOpen(false) }}>
              Delete this profile
            </button>
          </div>
        </>
      )}

      {importModal && (
        <Sheet title="Import profile" onClose={closeImport}>
          <Field label="Profile file" hint="from Download as JSON">
            <label className={`${btnSecondary} inline-flex items-center gap-2 text-sm cursor-pointer focus-within:outline-solid focus-within:outline-2 focus-within:outline-accent`}>
              <input type="file" accept=".json,application/json" onChange={handleFile} className="sr-only" />
              Choose a file
            </label>
            {importFile && <span className="ml-3 text-sm text-ink">{importFile}</span>}
          </Field>
          <Field label="Or paste the JSON">
            <textarea value={importText} aria-label="Profile JSON"
              onChange={e => { setImportText(e.target.value); setImportFile(''); setImportError('') }}
              placeholder="Paste a profile here"
              className="w-full bg-panel border border-line rounded-xs text-ink text-xs p-2 h-36 resize-none" />
          </Field>
          {importError && <p className="text-sm text-danger">{importError}</p>}
          <div className="flex gap-2">
            <button onClick={handleImport} disabled={!importText.trim()} className={`${btnPrimary} flex-1`}>Import profile</button>
            <button onClick={closeImport} className={btnSecondary}>Cancel</button>
          </div>
        </Sheet>
      )}

      {toast && (
        <div role="status" className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-ink text-ground rounded-xs px-4 py-2 text-sm z-50 pointer-events-none shadow-lg">
          {toast}
        </div>
      )}
    </div>
  )
}

// Star pips, filled up to the piece's stars. small fits the squad cards and the loadout table.
function StarPips({ stars, small = false }) {
  return (
    <span className={`inline-flex gap-px leading-none ${small ? 'text-[0.625rem] sm:text-xs' : 'text-sm'}`} aria-label={`${stars} of 5 stars`}>
      {[0,1,2,3,4].map(i => (
        <span key={i} aria-hidden="true" className={i < stars ? 'text-accent' : 'text-line'}>★</span>
      ))}
    </span>
  )
}

// Sub-upgrade progress inside a star tier: 4 segments, like the bar on the in-game upgrade screen.
// A full bar means the next step is the star promotion, so it says that instead.
function SubTicks({ sub, stars }) {
  if (sub >= 4) return <span className="text-xs text-ok">Ready for {stars + 1}★</span>
  return (
    <span className="inline-flex gap-0.5" aria-label={`Sub-upgrade ${sub} of 4`}>
      {[0,1,2,3].map(i => (
        <span key={i} aria-hidden="true" className={`w-2.5 h-1 rounded-full ${i < sub ? 'bg-accent' : 'bg-line'}`} />
      ))}
    </span>
  )
}

const isMaxed = piece => piece.level >= (QUALITY_MAX_LEVEL[piece.quality] ?? 40)

// What's worth knowing about a piece at a glance: its level until it's maxed, then its stars.
function PieceStatus({ piece, small = false }) {
  if (!piece) return <span className="text-ink-3">–</span>
  if (!isMaxed(piece)) return <span className="text-ink-2">Lv {piece.level}</span>
  return <StarPips stars={piece.stars} small={small} />
}

// Full description of a piece for tooltips, e.g. "Chip Lv 40, 4★, sub-upgrade 4 of 4".
function pieceSummary(slot, piece) {
  if (!piece) return `No ${SLOT_NAMES[slot].toLowerCase()}`
  const parts = [`${SLOT_NAMES[slot]} Lv ${piece.level}`, `${piece.stars}★`]
  if (isMaxed(piece) && piece.stars < 5 && piece.sub != null) parts.push(`sub-upgrade ${piece.sub} of 4`)
  return parts.join(', ')
}

// One upgrade step, without the hero: "Promote Armor to 5★".
function upgradeAction(item) {
  const slot = SLOT_NAMES[item.slot]
  if (item.type === 'level') return `Level up ${slot}, Lv ${item.from} → ${item.to}`
  if (item.type === 'sub') return `Sub-upgrade ${slot} ${item.stars}★${item.from !== null ? `, ${item.from} → ${item.to} of 4` : ''}`
  return `Promote ${slot} to ${item.to}★`
}

const RESOURCE_LABELS = { gold: 'Gold', ore: 'Ore', dielectric_ceramic: 'Ceramic', blueprints: 'Blueprints' }

// ROI is shown per a unit that keeps the number readable: per 1M gold, per 1K ore, per ceramic, per blueprint.
const RESOURCE_PER = { gold: [1e6, '1M'], ore: [1e3, '1K'] }

// The resource as the player names it. The 5th star is paid in mythic blueprints, a different item from the legendary ones for 1★-4★.
function resourceName(item) {
  const mythic = item.resource === 'blueprints' && item.type === 'stars' && item.to === 5
  return mythic ? 'mythic blueprints' : RESOURCE_LABELS[item.resource]?.toLowerCase() ?? item.resource
}

function roiFigure(item) {
  const per = RESOURCE_PER[item.resource]
  const res = resourceName(item)
  return { value: Math.round(item.roi * (per?.[0] ?? 1)).toLocaleString(), unit: per ? `${per[1]} ${res}` : res.replace(/s$/, '') }
}

function noRoiReason(item) {
  if (item.from === null) return 'Set this piece’s sub-upgrade on the Gear screen to rank it.'
  if (item.powerGain === null) return 'No stat data for this step yet.'
  return `Doesn’t use ${resourceName(item)}.`
}

const hasRoi = item => 'roi' in item && item.roi !== null

// Max efficiency: steps with an ROI for the chosen resource, kept apart from the ones without.
function splitByRoi(list) {
  return { ranked: list.filter(i => !('roi' in i) || i.roi !== null), unranked: list.filter(i => 'roi' in i && i.roi === null) }
}

// Shown when none of the squad's next steps use the chosen resource, with a way out.
function SwitchResource({ state, dispatch, rankable }) {
  const res = RESOURCE_LABELS[state.limitingResource]?.toLowerCase() ?? state.limitingResource
  return (
    <div className="border border-dashed border-line rounded-xs p-4 space-y-3 mb-4">
      <p className="text-sm text-ink">
        None of your squad’s next steps use {res}.
        {rankable.length > 0 ? ' Rank them by what they do cost:' : ' Add stat data for your gear to rank them.'}
      </p>
      {rankable.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {rankable.map(r => (
            <button key={r} onClick={() => dispatch({ type: 'SET_LIMITING_RESOURCE', payload: r })} className={`${btnSecondary} text-sm`}>
              Rank by {RESOURCE_LABELS[r]?.toLowerCase() ?? r}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

const UPGRADE_MODES = [
  { key: 'max_efficiency', label: 'Max efficiency', note: 'Power gained for each unit of the resource you’re shortest on.' },
  { key: 'role_based',     label: 'By role',        note: 'Gear that doesn’t fit the hero’s role, like a DPS whose Gun trails their Armor.' },
  { key: 'weakest_link',   label: 'Weakest link',   note: 'The squad’s weakest pieces, brought up to its average first.' },
]

// rank: the step's place in the list, or null for steps that can't be ranked.
function UpgradeRow({ rank, item }) {
  const roi = hasRoi(item) && roiFigure(item)
  return (
    <li className="flex gap-3 py-3 border-b border-line-soft">
      <span className="w-6 flex-none text-right text-base font-semibold text-ink-3 leading-6">{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-base leading-6">
          <span className="font-semibold text-ink">{HEROES[item.heroId]?.name}</span> <span className="text-ink-2">{upgradeAction(item)}</span>
        </p>
        {roi
          ? <p className="text-xs text-ink-2"><span className="text-ok font-semibold">+{Math.round(item.powerGain).toLocaleString()} Power</span> for {Math.round(item.cost).toLocaleString()} {resourceName(item)}</p>
          : <p className="text-xs text-ink-3">{'roi' in item ? noRoiReason(item) : item.reason}</p>}
      </div>
      {roi && (
        <div className="flex-none text-right max-w-[8rem] sm:max-w-[12rem]">
          <p className="text-lg font-semibold text-ink leading-6">{roi.value}</p>
          <p className="text-xs text-ink-3 leading-tight">Power per {roi.unit}</p>
        </div>
      )}
    </li>
  )
}

function UpgradePriority({ state, dispatch, upgradePriority, rankable }) {
  const [showUnranked, setShowUnranked] = useState(false)
  const mode = UPGRADE_MODES.find(m => m.key === state.upgradeMode) ?? UPGRADE_MODES[0]
  const maxEff = state.upgradeMode === 'max_efficiency'
  const { ranked, unranked } = maxEff ? splitByRoi(upgradePriority) : { ranked: upgradePriority, unranked: [] }
  const nothingRanked = maxEff && upgradePriority.length > 0 && !ranked.some(i => i.type !== 'callout')
  const res = RESOURCE_LABELS[state.limitingResource]?.toLowerCase() ?? state.limitingResource
  let rank = 0

  return (
    <div>
      <Title note="What to spend on next for your squad, best first.">Upgrades</Title>

      <div className="space-y-4 mb-6">
        <Field label="Rank by">
          <div className="grid grid-cols-3 gap-1">
            {UPGRADE_MODES.map(({ key, label }) => (
              <button key={key} aria-pressed={state.upgradeMode === key} onClick={() => dispatch({ type: 'SET_UPGRADE_MODE', payload: key })}
                className={`${choice(state.upgradeMode === key)} min-h-[44px] px-2 text-sm`}>
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-3 mt-1.5">{mode.note}</p>
        </Field>

        {maxEff && (() => {
          const cov = coverage(state.gear)
          return (
            <Field label="Resource you’re shortest on">
              <div className="flex gap-1 flex-wrap">
                {RESOURCES.map(r => (
                  <button key={r} aria-pressed={state.limitingResource === r} onClick={() => dispatch({ type: 'SET_LIMITING_RESOURCE', payload: r })}
                    className={`${choice(state.limitingResource === r)} px-3 min-h-[40px] text-sm`}>
                    {RESOURCE_LABELS[r] ?? r}
                  </button>
                ))}
              </div>
              {cov.covered < cov.total && (
                <p className="text-xs text-ink-3 mt-1.5">
                  {cov.covered} of {cov.total} gear pieces have stat data. Steps without it can’t be ranked.
                </p>
              )}
            </Field>
          )
        })()}
      </div>

      {upgradePriority.length === 0 && (
        <p className="text-sm text-ink-2 py-8 text-center border border-dashed border-line rounded-xs">
          Add heroes to your roster and gear to your inventory to see upgrade advice.
        </p>
      )}
      {nothingRanked && <SwitchResource state={state} dispatch={dispatch} rankable={rankable} />}
      {ranked.some(i => i.blueprintWarning) && (
        <p className="text-xs text-accent mb-2">Star promotions cost blueprints, which are scarce. Check you have enough before you spend.</p>
      )}

      {ranked.length > 0 && (
        <ol className="border-t border-line">
          {ranked.map((item, i) => {
            if (item.type === 'callout') {
              return <li key={`callout-${i}`} className="my-3 border-l-4 border-signal bg-signal/10 px-3 py-2 text-sm text-ink">{item.reason}</li>
            }
            rank += 1
            return <UpgradeRow key={`${item.heroId}-${item.slot}-${item.type}-${i}`} rank={rank} item={item} />
          })}
        </ol>
      )}

      {unranked.length > 0 && (
        <div className={ranked.length > 0 ? 'mt-4' : ''}>
          <button onClick={() => setShowUnranked(o => !o)} aria-expanded={showUnranked}
            className="w-full flex items-center justify-between gap-2 py-3 text-sm text-ink-2 hover:text-ink border-t border-line">
            {unranked.length} {unranked.length === 1 ? 'step' : 'steps'} with no ROI for {res}
            <Chevron open={showUnranked} />
          </button>
          {showUnranked && (
            <ol>
              {unranked.map((item, i) => <UpgradeRow key={`${item.heroId}-${item.slot}-${item.type}-${i}`} rank={null} item={item} />)}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}

function SwapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 1.5v10M2 9l2.5 2.5L7 9M9.5 12.5v-10M7 5l2.5-2.5L12 5" />
    </svg>
  )
}

// swap: { selected, target, onClick } for moving heroes between rows (tap swap, then a hero in the other row)
function HeroFormationCard({ heroId, state, heroScores, gearAssignment, alternates, swap }) {
  const hero = HEROES[heroId]
  const colors = UNIT_COLORS[hero.unitType]
  const h = state.heroes[heroId]
  const slots = gearAssignment.assigned[heroId] ?? {}
  const alt = alternates[heroId]

  return (
    <div data-hero={heroId}
      className={`border-t-[3px] ${colors.border} bg-raised border-x border-b rounded-xs p-2 flex flex-col gap-1.5 min-w-0 transition-shadow
        ${swap.selected ? 'border-x-accent border-b-accent ring-2 ring-accent' : swap.target ? 'border-x-accent border-b-accent border-dashed cursor-pointer hover:ring-1 hover:ring-accent' : 'border-x-line border-b-line'}`}
      {...(swap.target ? { role: 'button', tabIndex: 0, onClick: swap.onClick, onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); swap.onClick() } } } : {})}>
      <div className="min-w-0">
        <p className="font-semibold text-sm text-ink truncate leading-tight">{hero.name}</p>
        <p className="text-xs text-ink-3 leading-tight">
          <span className={colors.text}>{hero.rarity}</span> {h.stars}★
          {h.ewLevel > 0 && <span className="text-air"> EW {h.ewLevel}</span>}
        </p>
      </div>

      <ul className="space-y-px">
        {SLOTS.map(slot => (
          <li key={slot} title={pieceSummary(slot, slots[slot])} className="flex items-center justify-between gap-1 text-[0.6875rem] sm:text-xs leading-5">
            <span className="text-ink-2">{SLOT_NAMES[slot]}</span>
            <PieceStatus piece={slots[slot]} small />
          </li>
        ))}
      </ul>

      {alt && (
        <p className="text-xs text-ink-3 truncate">Alt <span className="text-ink-2">{HEROES[alt.heroId].name}</span> <span className="text-danger">{alt.scoreDiff.toFixed(1)}</span></p>
      )}
      <div className="flex items-center justify-between gap-1 text-xs">
        <span className="text-ink" title="Hero score"><span className="hidden sm:inline text-ink-3">Score </span>{heroScores[heroId]?.toFixed(1)}</span>
        <button onClick={e => { e.stopPropagation(); swap.onClick() }} aria-pressed={swap.selected}
          aria-label={`Move ${hero.name} to the other row`} title="Move to the other row"
          className={`flex-none w-8 h-7 flex items-center justify-center rounded-xs border ${swap.selected ? 'border-accent bg-signal text-on-signal' : 'border-line text-ink-2 hover:text-ink hover:border-ink-3'}`}>
          <SwapIcon />
        </button>
      </div>
    </div>
  )
}

function SquadPicker({ state, dispatch, ownedIds, onDone }) {
  const [picked, setPicked] = useState(state.squadLock ?? [])
  const toggle = id => setPicked(p => p.includes(id) ? p.filter(x => x !== id) : p.length < 5 ? [...p, id] : p)
  return (
    <div className="mb-5 border border-line rounded-xs bg-panel p-3 space-y-3">
      <p className="text-sm text-ink">Pick 5 heroes <span className="text-ink-3">({picked.length} of 5)</span></p>
      <div className="flex flex-wrap gap-1">
        {ownedIds.map(id => (
          <button key={id} onClick={() => toggle(id)} aria-pressed={picked.includes(id)}
            className={`${choice(picked.includes(id))} px-3 text-sm min-h-[36px]`}>
            {HEROES[id].name}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button disabled={picked.length !== 5} onClick={() => { dispatch({ type: 'SET_SQUAD_LOCK', payload: picked }); onDone() }}
          className={`${btnPrimary} flex-1`}>Use these 5</button>
        <button onClick={onDone} className={btnSecondary}>Cancel</button>
      </div>
    </div>
  )
}

function ReasonList({ title, lines, gainClass }) {
  if (lines.length === 0) return null
  return (
    <div>
      <p className="text-xs font-semibold text-ink-2 mb-1">{title}</p>
      <ul className="space-y-1">
        {lines.map((line, i) => {
          const [what, gain] = line.split(' — ')
          return (
            <li key={i} className="text-sm text-ink">
              {what}{gain && <span className={`${gainClass} ml-1.5`}>{gain}</span>}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// The squad's warnings, danger first. Nothing is shown when there are none.
function SquadWarnings({ warnings }) {
  if (warnings.length === 0) return null
  const sorted = [...warnings].sort((a, b) => (a.severity === 'danger' ? 0 : 1) - (b.severity === 'danger' ? 0 : 1))
  return (
    <section aria-label="Warnings" className="mb-5 space-y-1.5">
      {sorted.map((w, i) => (
        <p key={`${w.severity}-${i}`} className={`text-sm text-ink border-l-4 px-3 py-2 ${w.severity === 'danger' ? 'border-danger bg-danger/10' : 'border-signal bg-signal/10'}`}>
          {w.message}
        </p>
      ))}
    </section>
  )
}

function SquadOptimizer({ state, dispatch, recommendedSquad, gearAssignment, heroScores, ownedIds, warnings }) {
  const [open, setOpen] = useState(false) // must be before early return — hooks must run unconditionally
  const [picking, setPicking] = useState(false)
  const [swapFrom, setSwapFrom] = useState(null)
  if (recommendedSquad.insufficient) {
    return (
      <div>
        <Title>Squad</Title>
        <SquadWarnings warnings={warnings} />
        <p className="text-sm text-ink-2 py-8 text-center border border-dashed border-line rounded-xs">
          Add at least 5 heroes to your roster to get a squad.
        </p>
      </div>
    )
  }

  const { squad, alternates, locked, recommended } = recommendedSquad
  const formation = arrangeFormation(squad, id => rowOf(id, state.rows, HEROES[id].defaultRow))
  const frontRow = formation.front
  const backRow = formation.back
  const rowOfCard = id => (frontRow.includes(id) ? 'front' : 'back')
  // Tap swap on one hero, then any hero in the other row: the two swap rows.
  const swapFor = id => ({
    selected: swapFrom === id,
    target: swapFrom !== null && rowOfCard(swapFrom) !== rowOfCard(id),
    onClick: () => {
      if (swapFrom !== null && rowOfCard(swapFrom) !== rowOfCard(id)) {
        dispatch({ type: 'SET_ROWS', payload: swapRows(state.rows, formation, swapFrom, id) })
        setSwapFrom(null)
      } else setSwapFrom(swapFrom === id ? null : id)
    },
  })
  const cardProps = { state, heroScores, gearAssignment, alternates }
  const { active, opportunities } = recommendedSquad.reasoning

  return (
    <div>
      <Title note={<>Squad score <span className="text-ink font-semibold">{recommendedSquad.score.toFixed(1)}</span>{locked ? ', picked by you' : ', the optimizer’s pick'}</>}>
        {locked ? 'My squad' : 'Best squad'}
      </Title>
      <SquadWarnings warnings={warnings} />

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={() => setPicking(p => !p)} aria-expanded={picking} className={`${btnSecondary} text-sm`}>
          {locked ? 'Change my squad' : 'Pick my own squad'}
        </button>
        {locked && (
          <button onClick={() => dispatch({ type: 'SET_SQUAD_LOCK', payload: null })} className={`${btnSecondary} text-sm`}>
            Use the optimizer’s pick
          </button>
        )}
        {locked && !recommended.insufficient && (
          <p className="text-xs text-ink-3 w-full">
            The optimizer would field {recommended.squad.map(id => HEROES[id].name).join(', ')} (score {recommended.score.toFixed(1)}, yours {recommendedSquad.score.toFixed(1)}).
          </p>
        )}
      </div>
      {picking && <SquadPicker state={state} dispatch={dispatch} ownedIds={ownedIds} onDone={() => setPicking(false)} />}

      {/* Formation board, enemy at the top as in the game's battle view */}
      <section aria-label="Formation" className="bg-panel border border-line rounded-xs p-2 sm:p-3">
        <p className="text-xs text-ink-3 text-center mb-2">Enemy ▲</p>
        <p className="text-xs font-semibold text-ink-2 mb-1.5">Front row</p>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {frontRow.map(id => <HeroFormationCard key={id} heroId={id} {...cardProps} swap={swapFor(id)} />)}
        </div>
        <div className="lane my-3" aria-hidden="true" />
        <p className="text-xs font-semibold text-ink-2 mb-1.5">Back row</p>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {backRow.map(id => <HeroFormationCard key={id} heroId={id} {...cardProps} swap={swapFor(id)} />)}
        </div>
        <p className="text-xs text-ink-3 text-center mt-2">▼ Your base</p>
      </section>
      <p role="status" className="text-xs text-accent mt-2 min-h-[1.15rem]">
        {swapFrom && <>Now tap a hero in the other row to swap with {HEROES[swapFrom].name}.</>}
      </p>

      {(active.length > 0 || opportunities.length > 0) && (
        <div className="mt-3 border-t border-line">
          <button onClick={() => setOpen(o => !o)} aria-expanded={open}
            className="w-full flex items-center justify-between gap-2 py-3 text-sm font-semibold text-ink hover:text-accent">
            Why this squad
            <Chevron open={open} />
          </button>
          {open && (
            <div className="pb-3 space-y-3">
              <ReasonList title="Bonuses in effect" lines={active} gainClass="text-ok" />
              <ReasonList title="Could be better" lines={opportunities} gainClass="text-accent" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// heroOptions: owned hero ids the piece can be put on
function GearEditModal({ piece, heroOptions, onSave, onDelete, onClose }) {
  const [slot, setSlot] = useState(piece?.slot ?? 'gun')
  const [quality, setQuality] = useState(piece?.quality ?? 'legendary')
  const [level, setLevel] = useState(piece?.level ?? 0)
  const [stars, setStars] = useState(piece?.stars ?? 0)
  const [sub, setSub] = useState(piece?.sub ?? null)
  const [heroId, setHeroId] = useState(piece?.heroId ?? '')
  // Sub-upgrades (4 per star tier) only exist on legendary gear at level 40.
  const hasSub = quality === 'legendary' && level === QUALITY_MAX_LEVEL[quality] && stars < 5

  // Clamp level when quality changes
  const handleQualityChange = (q) => {
    setQuality(q)
    setLevel(l => Math.min(l, QUALITY_MAX_LEVEL[q]))
  }
  const isNew = !piece?.id
  // A piece saved earlier as Purple, Blue or Green keeps its quality on show so it can be switched to Gold.
  const qualityChoices = QUALITIES.filter(q => QUALITIES_V1.includes(q) || q === piece?.quality)

  return (
    <Sheet title={isNew ? 'Add gear' : 'Edit gear'} onClose={onClose}>
      <Field label="Slot">
        <div className="grid grid-cols-4 gap-1">
          {SLOTS.map(s => (
            <button key={s} aria-pressed={slot === s} onClick={() => setSlot(s)} className={`${choice(slot === s)} min-h-[40px] text-sm`}>
              {SLOT_NAMES[s]}
            </button>
          ))}
        </div>
      </Field>

      {qualityChoices.length > 1 && (
      <Field label="Quality" hint="this version only tracks Gold gear">
        <div className="grid grid-cols-2 gap-1">
          {qualityChoices.map(q => {
            const meta = QUALITY_META[q]
            return (
              <button key={q} aria-pressed={quality === q} onClick={() => handleQualityChange(q)}
                className={`${choice(quality === q)} flex items-center gap-2 px-2 py-1.5 text-left min-h-[48px]`}>
                <span className={`w-3 h-3 rounded-full flex-none ${meta.swatch}`} aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm text-ink">{meta.tag} <span className="text-ink-3">{meta.label}</span></span>
                  <span className="block text-xs text-ink-3">{meta.hint}</span>
                </span>
              </button>
            )
          })}
        </div>
      </Field>
      )}

      <Field label={<>Level <span className="text-ink font-semibold">{level}</span> <span className="font-normal text-ink-3">of {QUALITY_MAX_LEVEL[quality]}</span></>}>
        <input type="range" min="0" max={QUALITY_MAX_LEVEL[quality]} value={Math.min(level, QUALITY_MAX_LEVEL[quality])}
          aria-label="Level" onChange={e => setLevel(Number(e.target.value))} className="w-full" />
      </Field>

      <Field label="Stars" hint="picking a star sets the level to max">
        <div className="grid grid-cols-6 gap-1">
          {[0,1,2,3,4,5].map(s => (
            <button key={s} aria-pressed={stars === s} onClick={() => { setStars(s); if (s > 0) setLevel(QUALITY_MAX_LEVEL[quality]) }}
              className={`${choice(stars === s)} min-h-[40px] text-sm`}>
              {s}★
            </button>
          ))}
        </div>
      </Field>

      {hasSub && (
        <Field label="Sub-upgrade" hint="filled segments of the bar on the upgrade screen">
          <div className="grid grid-cols-5 gap-1">
            {[0,1,2,3,4].map(k => (
              <button key={k} aria-pressed={sub === k} onClick={() => setSub(k)} className={`${choice(sub === k)} min-h-[40px] text-sm`}>
                {k} of 4
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field label="Equipped on" hint="Auto lets the optimizer choose">
        <select value={heroId} onChange={e => setHeroId(e.target.value)} aria-label="Equipped on"
          className="w-full bg-panel border border-line rounded-xs text-ink text-sm px-2 min-h-[44px]">
          <option value="">Auto</option>
          {heroOptions.map(id => <option key={id} value={id}>{HEROES[id].name}</option>)}
        </select>
      </Field>

      <div className="flex gap-2 pt-1">
        <button onClick={() => onSave({ slot, quality, level, stars, sub: hasSub ? sub : stars === 5 ? 0 : null, heroId: heroId || undefined })}
          className={`${btnPrimary} flex-1`}>
          {isNew ? 'Add gear' : 'Save changes'}
        </button>
        {!isNew && <button onClick={onDelete} className={btnDanger}>Delete</button>}
        <button onClick={onClose} className={btnSecondary}>Cancel</button>
      </div>
    </Sheet>
  )
}

// One slot of a hero's loadout on the Gear screen. Empty slots add a piece for that hero and slot.
function GearSlot({ slot, piece, auto = false, caption, onClick }) {
  const meta = piece && QUALITY_META[piece.quality]
  const maxed = piece && isMaxed(piece)
  const subUnset = piece && piece.quality === 'legendary' && maxed && piece.stars < 5 && piece.sub == null
  return (
    <button type="button" data-piece={piece?.id} onClick={onClick} title={piece ? `${pieceSummary(slot, piece)}. Tap to edit.` : undefined}
      className={`text-left rounded-xs border px-2.5 py-2 min-h-[64px] flex flex-col justify-start gap-1.5 min-w-0
        ${piece ? 'bg-raised border-line-soft hover:border-ink-3' : 'border-dashed border-line text-ink-3 hover:border-ink-3 hover:text-ink'}`}>
      <span className="flex items-baseline justify-between gap-2 text-sm">
        <span className={piece ? 'font-semibold text-ink' : ''}>{SLOT_NAMES[slot]}</span>
        {piece && piece.quality !== 'legendary' && <span className={`text-xs ${meta.text}`}>{meta.tag}</span>}
        {auto && <span className="text-xs text-ink-3" title="Placed by the optimizer">Auto</span>}
      </span>
      {piece ? (
        <span className="flex items-center gap-2 flex-wrap">
          <PieceStatus piece={piece} />
          {maxed && piece.stars < 5 && piece.sub > 0 && <SubTicks sub={piece.sub} stars={piece.stars} />}
          {subUnset && <span className="text-xs text-accent">Set sub-upgrade</span>}
        </span>
      ) : (
        <span className="text-xs">Add</span>
      )}
      {caption && <span className="text-xs text-ink-3 truncate">{caption}</span>}
    </button>
  )
}

// squad: hero ids in the squad; assigned: what each squad hero is wearing, pinned or placed by the optimizer.
function GearInventory({ state, dispatch, ownedIds, squad, assigned }) {
  const [editPiece, setEditPiece] = useState(null)

  const counts = SLOTS.reduce((acc, slot) => {
    acc[slot] = state.gear.filter(g => g.slot === slot).length
    return acc
  }, {})

  // Squad heroes show what they actually wear; other heroes show the pieces set to them.
  const inSquad = new Set(squad)
  const shown = new Set()
  const loadout = heroId => {
    const slots = {}
    for (const slot of SLOTS) {
      const piece = inSquad.has(heroId)
        ? assigned[heroId]?.[slot] ?? null
        : state.gear.find(p => p.heroId === heroId && p.slot === slot && !shown.has(p.id)) ?? null
      if (piece) shown.add(piece.id)
      slots[slot] = piece
    }
    return slots
  }
  const squadGroups = squad.map(id => ({ id, slots: loadout(id) }))
  const otherGroups = HERO_ORDER.filter(id => !inSquad.has(id) && state.gear.some(p => p.heroId === id)).map(id => ({ id, slots: loadout(id) }))
  // Left over: Auto pieces the optimizer didn't place, and extra pieces set to a hero whose slot is already filled.
  const spare = state.gear.filter(p => !shown.has(p.id)).sort((a, b) => SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot))

  const group = ({ id, slots }) => {
    const colors = UNIT_COLORS[HEROES[id].unitType]
    return (
      <section key={id} className="mb-4">
        <h3 className="flex items-center gap-2 mb-1.5 text-sm font-semibold text-ink">
          <span className={`w-2 h-2 rounded-full ${colors.bg}`} aria-hidden="true" />
          {HEROES[id].name}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
          {SLOTS.map(slot => (
            <GearSlot key={slot} slot={slot} piece={slots[slot]} auto={!!slots[slot] && !slots[slot].heroId}
              onClick={() => setEditPiece(slots[slot] ?? { slot, heroId: id })} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div>
      <Title note="Your gear, hero by hero. Tap a piece to edit it, or an empty slot to add one."
        action={<button onClick={() => setEditPiece({})} className={`${btnPrimary} flex-none`}>Add gear</button>}>
        Gear
      </Title>

      {state.gear.length > 0 && (
        <p className="text-sm text-ink-2 mb-5">
          {SLOTS.map((s, i) => (
            <span key={s}>{i > 0 && ', '}<span className="text-ink font-semibold">{counts[s]}</span> {SLOT_NAMES[s].toLowerCase()}{counts[s] === 1 ? '' : 's'}</span>
          ))}
        </p>
      )}

      {state.gear.length === 0 && (
        <p className="text-sm text-ink-2 py-8 text-center border border-dashed border-line rounded-xs mb-6">
          No gear yet. Add your first piece to get upgrade advice.
        </p>
      )}

      {squadGroups.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-ink border-b border-line pb-1.5 mb-3">Your squad</h2>
          {squadGroups.map(group)}
        </div>
      )}
      {otherGroups.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-ink border-b border-line pb-1.5 mb-3">Other heroes</h2>
          {otherGroups.map(group)}
        </div>
      )}
      {spare.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-ink border-b border-line pb-1.5 mb-1">Not equipped</h2>
          <p className="text-xs text-ink-3 mb-3">Pieces left on Auto that the optimizer didn’t need, or a second piece set to a hero’s filled slot.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
            {spare.map(p => (
              <GearSlot key={p.id} slot={p.slot} piece={p}
                caption={p.heroId && HEROES[p.heroId] ? `Set to ${HEROES[p.heroId].name}` : 'Auto'}
                onClick={() => setEditPiece(p)} />
            ))}
          </div>
        </div>
      )}

      {state.gear.length > 0 && (
        <p className="text-xs text-ink-3 max-w-[60ch]">
          Moving gear between heroes costs a little gold in-game. It’s worth it whenever the optimizer suggests it.
        </p>
      )}

      {editPiece !== null && (
        <GearEditModal
          piece={Object.keys(editPiece).length > 0 ? editPiece : null}
          heroOptions={ownedIds}
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
  const showEW = hero.rarity === 'UR'
  /* v1: skills are switched off.
  const isEffectiveUR = hero.rarity === 'UR' || isPromotedUR(heroId, heroState, season)
  // Skill cap scales with EW: base 30, +1 per 3 EW levels, max 40
  const skillMax = isEffectiveUR ? Math.min(40, 30 + Math.floor(heroState.ewLevel / 3)) : 30
  */
  const nearPromotion = hero.promotionSeason && hero.promotionSeason === season + 1
  const promotedSSR = isPromotedUR(heroId, heroState, season) && hero.rarity === 'SSR'
  const open = heroState.owned && expanded

  return (
    <div data-hero={heroId} className={`bg-raised border rounded-xs overflow-hidden ${heroState.owned ? 'border-line-soft' : 'border-transparent bg-raised/50'}`}>
      <button type="button" aria-expanded={heroState.owned ? open : undefined}
        className="w-full flex items-center gap-3 pr-3 min-h-[52px] text-left select-none"
        onClick={() => {
          if (!heroState.owned) dispatch({ type: 'TOGGLE_HERO_OWNED', heroId })
          else setExpanded(e => !e)
        }}>
        <span className={`self-stretch w-1 flex-none ${heroState.owned ? colors.bg : 'bg-line-soft'}`} aria-hidden="true" />
        <span className="flex-1 min-w-0 py-1.5">
          <span className={`block font-semibold text-sm truncate ${heroState.owned ? 'text-ink' : 'text-ink-2'}`}>{hero.name}</span>
          <span className="block text-xs text-ink-3">
            <span className={heroState.owned ? colors.text : ''}>{colors.name}</span> unit, {ROLE_NAMES[hero.role]} role
            {heroState.owned && <>, {heroState.stars}★</>}
          </span>
        </span>

        {promotedSSR && (
          <span className="text-xs text-q-gold border border-q-gold/50 rounded-xs px-1.5 flex-none" title="Promoted from SSR, counts as UR">Promoted</span>
        )}
        {heroState.owned && heroState.ewLevel > 0 && (
          <span className="text-xs text-air border border-air/50 rounded-xs px-1.5 flex-none" title="Exclusive Weapon level">EW {heroState.ewLevel}</span>
        )}
        {nearPromotion && (
          <span className="text-xs text-ok border border-ok/50 rounded-xs px-1.5 flex-none">UR in S{hero.promotionSeason}</span>
        )}
        {heroState.owned && <span className="text-sm text-ink w-9 text-right flex-none" title="Hero score">{heroScore?.toFixed(1) ?? '–'}</span>}
        {heroState.owned
          ? <span className="text-ink-3"><Chevron open={open} /></span>
          : <span className="text-xs font-semibold text-accent flex-none">Add</span>}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-3 space-y-4 border-t border-line-soft">
          <Field label="Stars">
            <div className="grid grid-cols-6 gap-1">
              {[0,1,2,3,4,5].map(s => (
                <button key={s} aria-pressed={heroState.stars === s} onClick={() => dispatch({ type: 'UPDATE_HERO', heroId, updates: { stars: s } })}
                  className={`${choice(heroState.stars === s)} text-sm min-h-[40px]`}>
                  {s}★
                </button>
              ))}
            </div>
          </Field>

          <Field label={<>Hero level <span className="text-ink font-semibold">{heroState.level}</span></>}>
            <input type="range" min="1" max="175" value={heroState.level} aria-label="Hero level"
              onChange={e => dispatch({ type: 'UPDATE_HERO', heroId, updates: { level: Number(e.target.value) } })}
              className="w-full" />
          </Field>

          {/* Promotion toggle — SSR heroes eligible in current or past season */}
          {hero.rarity === 'SSR' && hero.promotionSeason !== null && hero.promotionSeason <= season && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink">Promoted to UR</p>
              <button role="switch" aria-checked={heroState.promoted} aria-label="Promoted to UR"
                onClick={() => dispatch({ type: 'UPDATE_HERO', heroId, updates: { promoted: !heroState.promoted } })}
                className={`relative inline-flex h-6 w-11 flex-none items-center rounded-full transition-colors ${heroState.promoted ? 'bg-signal' : 'bg-line'}`}>
                <span className={`inline-block h-4 w-4 rounded-full bg-raised shadow-sm transition-transform ${heroState.promoted ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          )}

          {/* v1: skills are switched off. Skills have stats that raise a hero's effectiveness;
              bring this back when the hero score models those stats.
              Skills unlock at each star: SK1@1★ SK2@2★ SK3@3★ SK4@4★
          <Field label="Skill levels" hint={`max ${skillMax}, ★ marks the one to level first, skill 4 is maxed when it unlocks`}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {heroState.skills.map((lvl, i) => {
                const unlocked = i < (heroState.stars <= 1 ? 1 : Math.min(heroState.stars, 4))
                const promoted = isEffectiveUR && HEROES[heroId].rarity !== 'UR'
                const weights = (promoted && HERO_SKILL_WEIGHTS_PROMOTED[heroId])
                  ? HERO_SKILL_WEIGHTS_PROMOTED[heroId]
                  : (HERO_SKILL_WEIGHTS[heroId] ?? [1, 2, 3, 2])
                const skillNames = (promoted && HERO_SKILLS_PROMOTED[heroId])
                  ? HERO_SKILLS_PROMOTED[heroId]
                  : (HERO_SKILLS[heroId] ?? ['Skill 1', 'Skill 2', 'Skill 3', 'Skill 4'])
                // Only skills 1-3 level up, so the one to level first is among them; skill 4 is maxed on unlock.
                const levelable = i < 3
                const isPriority = levelable && weights[i] === Math.max(...weights.slice(0, 3))
                const skillName = skillNames[i] ?? `Skill ${i + 1}`
                return (
                  <label key={i} className="block min-w-0">
                    <span className={`block text-xs mb-0.5 truncate ${unlocked ? (isPriority ? 'text-accent font-semibold' : 'text-ink-2') : 'text-ink-3'}`} title={skillName}>
                      {unlocked && isPriority && '★ '}{skillName}
                    </span>
                    {unlocked && !levelable ? (
                      <span className="flex items-center justify-center w-full bg-panel border border-line-soft rounded-xs text-sm text-ink-2 min-h-[40px]">
                        Max
                      </span>
                    ) : (
                    <input type="number" min="1" max={unlocked ? skillMax : 1} value={unlocked ? lvl : 1}
                      disabled={!unlocked}
                      onChange={e => {
                        if (!unlocked) return
                        const skills = [...heroState.skills]
                        skills[i] = Math.min(skillMax, Math.max(1, Number(e.target.value)))
                        dispatch({ type: 'UPDATE_HERO', heroId, updates: { skills } })
                      }}
                      className={`w-full bg-panel border rounded-xs text-center text-sm min-h-[40px]
                        ${unlocked ? 'border-line text-ink' : 'border-line-soft text-ink-3 cursor-not-allowed'}`} />
                    )}
                    {!unlocked && <span className="block text-xs text-ink-3 mt-0.5">Unlocks at {i + 1}★</span>}
                  </label>
                )
              })}
            </div>
          </Field> */}

          {/* EW Level (native UR only) */}
          {showEW && (
            <Field label={<>Exclusive Weapon level <span className="text-ink font-semibold">{heroState.ewLevel}</span> <span className="font-normal text-ink-3">of 30</span></>}>
              <input type="range" min="0" max="30" value={heroState.ewLevel} aria-label="Exclusive Weapon level"
                onChange={e => dispatch({ type: 'UPDATE_HERO', heroId, updates: { ewLevel: Number(e.target.value) } })}
                className="w-full" />
              <div className="flex justify-between text-xs text-ink-3 mt-0.5" aria-hidden="true">
                <span>0</span><span>5</span><span>10</span><span>15</span><span>20</span><span>25</span><span>30</span>
              </div>
            </Field>
          )}

          <button onClick={() => { setExpanded(false); dispatch({ type: 'TOGGLE_HERO_OWNED', heroId }) }} className={`${btnDanger} text-sm`}>
            Remove from roster
          </button>
        </div>
      )}
    </div>
  )
}

function RosterManager({ state, dispatch, heroScores, season }) {
  const RARITY_GROUPS = ['UR', 'SSR', 'SR'].map(r => ({ label: `${r} heroes`, ids: HERO_ORDER.filter(id => HEROES[id].rarity === r) }))

  return (
    <div>
      <Title note="Tap a hero you own to add them. Tap again to enter their stars, level and Exclusive Weapon.">Roster</Title>
      {RARITY_GROUPS.map(({ label, ids }) => {
        const owned = ids.filter(id => state.heroes[id]?.owned).length
        return (
          <section key={label} className="mb-6">
            <h2 className="flex items-baseline justify-between text-sm font-semibold text-ink mb-2 pr-9">
              <span>{label} <span className="text-xs font-normal text-ink-3 ml-1.5">{owned} of {ids.length} owned</span></span>
              <span className="text-xs font-normal text-ink-3">Score</span>
            </h2>
            <div className="space-y-1">
              {ids.map(id => (
                <HeroCard key={id} heroId={id} heroState={state.heroes[id]} heroScore={heroScores[id]} season={state.season} dispatch={dispatch} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function OptionList({ options, value, onPick, columns = 1 }) {
  return (
    <div className={columns === 2 ? 'grid grid-cols-1 sm:grid-cols-2 gap-1' : 'space-y-1'}>
      {options.map(({ value: v, label, sub }) => (
        <button key={String(v)} aria-pressed={value === v} onClick={() => onPick(v)}
          className={`${choice(value === v)} w-full flex items-baseline justify-between gap-3 px-3 py-2 text-left min-h-[48px]`}>
          <span className={`text-sm ${value === v ? 'font-semibold' : ''}`}>{label}</span>
          <span className="text-xs text-ink-3 text-right">{sub}</span>
        </button>
      ))}
    </div>
  )
}

function GoalSelector({ state, dispatch, ownedIds }) {
  const hasEW5 = ownedIds.some(id => (state.heroes[id]?.ewLevel ?? 0) >= 5)
  const showHybridWarning = (state.intent === 'hybrid_progress' || state.intent === 'full_hybrid') && !hasEW5

  return (
    <div>
      <Title note="Tell the optimizer what you’re playing for. Squad and upgrade advice follow from this.">Goal</Title>
      <div className="space-y-7">
        <Field label="Current season">
          <div className="grid grid-cols-6 gap-1">
            {[1,2,3,4,5,6].map(s => (
              <button key={s} aria-pressed={state.season === s} onClick={() => dispatch({ type: 'SET_SEASON', payload: s })}
                className={`${choice(state.season === s)} min-h-[44px] text-sm ${state.season === s ? 'font-semibold' : ''}`}>
                S{s}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Optimize for">
          {/* v1: Code battles is hidden. A profile saved with it still shows it, so it can be switched off. */}
          <OptionList value={state.goal} onPick={v => dispatch({ type: 'SET_GOAL', payload: v })} options={[
            { value: 'pvp_rally',    label: 'PvP rally',    sub: 'Burst damage, alliance wars' },
            { value: 'world_boss',   label: 'World boss',   sub: 'Sustained DPS, PvE' },
            { value: 'code_battles', label: 'Code battles', sub: 'Mode-specific bonuses' },
            { value: 'balanced',     label: 'Balanced',     sub: 'No goal modifiers' },
          ].filter(o => o.value !== 'code_battles' || state.goal === 'code_battles')} />
        </Field>

        {/* Code type — unit type buffed this code (+50% damage) */}
        {state.goal === 'code_battles' && (
          <Field label="Unit type this code buffs" hint="+50% damage to that type">
            <OptionList columns={2} value={state.codeType} onPick={v => dispatch({ type: 'SET_CODE_TYPE', payload: v })} options={[
              { value: null,       label: 'Not sure', sub: 'No type modifier' },
              { value: 'tank',     label: 'Tank',     sub: '+50% tank damage' },
              { value: 'aircraft', label: 'Aircraft', sub: '+50% aircraft damage' },
              { value: 'missile',  label: 'Missile',  sub: '+50% missile damage' },
            ]} />
          </Field>
        )}

        {/* Opponent type — counter system (PvP only) */}
        {state.goal === 'pvp_rally' && (
          <Field label="Opponent’s main unit type" hint="up to +20% counter bonus">
            <OptionList columns={2} value={state.opponentType} onPick={v => dispatch({ type: 'SET_OPPONENT_TYPE', payload: v })} options={[
              { value: null,       label: 'Unknown or mixed', sub: 'No counter modifier' },
              { value: 'tank',     label: 'Tank',             sub: 'Aircraft counter tanks' },
              { value: 'aircraft', label: 'Aircraft',         sub: 'Missiles counter aircraft' },
              { value: 'missile',  label: 'Missile',          sub: 'Tanks counter missiles' },
            ]} />
          </Field>
        )}

        <Field label="Squad makeup">
          <OptionList value={state.intent} onPick={v => dispatch({ type: 'SET_INTENT', payload: v })} options={[
            { value: 'mono',            label: 'One unit type',      sub: 'Bonus of up to +20% when all 5 match' },
            { value: 'hybrid_progress', label: 'Building to hybrid', sub: 'Working toward mixed types' },
            { value: 'full_hybrid',     label: 'Full hybrid',        sub: 'Mixed types, an EW 5+ hero in place' },
          ]} />
          {showHybridWarning && (
            <p className="mt-3 border-l-4 border-danger bg-danger/10 px-3 py-2 text-sm text-ink">
              No hero you own has Exclusive Weapon 5 or higher, so a hybrid squad is high risk. Level one Exclusive Weapon to 5 before switching.
            </p>
          )}
        </Field>
      </div>
    </div>
  )
}

function HelpGuide() {
  // v1: the scoring section below is hidden. Restore this with it.
  // const [showScoring, setShowScoring] = useState(false)
  const Section = ({ title, children }) => (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-ink border-b border-line pb-1.5 mb-3">{title}</h2>
      <dl className="space-y-3 text-sm">{children}</dl>
    </section>
  )
  const Row = ({ label, children }) => (
    <div className="sm:grid sm:grid-cols-[9rem_1fr] sm:gap-4">
      <dt className="font-semibold text-ink">{label}</dt>
      <dd className="text-ink-2 max-w-[62ch]">{children}</dd>
    </div>
  )

  return (
    <div className="pb-8">
      <Title note="What each screen does and how to read it.">Help</Title>

      <p className="mb-8 border-l-4 border-signal bg-signal/10 px-3 py-2 text-sm text-ink max-w-[62ch]">
        This is a beta. It covers Gold (Legendary) gear only.
      </p>

      <section className="mb-8">
        <h2 className="text-base font-semibold text-ink border-b border-line pb-1.5 mb-3">Getting started</h2>
        <ol className="space-y-3 text-sm">
          {[
            ['Goal', 'Pick your current season and what you’re playing for.'],
            ['Roster', 'Add each hero you own, with their stars and Exclusive Weapon level.'],
            ['Gear', 'Add each Gold piece you own, and the hero wearing it.'],
            ['Squad and Upgrades', 'See your best 5 heroes, then what to upgrade next.'],
          ].map(([label, text], i) => (
            <li key={label} className="flex gap-3">
              <span className="w-6 h-6 flex-none rounded-full bg-signal text-on-signal text-xs font-semibold flex items-center justify-center">{i + 1}</span>
              <p className="text-ink-2 max-w-[62ch]"><span className="font-semibold text-ink">{label}.</span> {text}</p>
            </li>
          ))}
        </ol>
      </section>

      <Section title="Roster">
        <Row label="Hero score">The number beside each hero. It’s the app’s own rating for choosing squads and handing out gear, not in-game Power. Rarity, stars, Exclusive Weapon level and your goal raise it.</Row>
        <Row label="Promotion">SSR heroes that can become UR show a “UR in S…” badge the season before. From that season on, their card has a Promoted to UR switch.</Row>
      </Section>

      <Section title="Gear">
        <Row label="Layout">Grouped by hero, your squad first. Tap a piece to edit it, or an empty slot to add a piece for that hero.</Row>
        <Row label="Stars">Gear must reach Lv 40 before it can be starred. 1★ to 4★ cost blueprints; 5★ costs mythic blueprints.</Row>
        <Row label="Sub-upgrades">Each star tier below 5★ has 4. Enter how many segments of the bar are filled on the in-game upgrade screen. “Ready for 4★” means they’re done and the star is next.</Row>
        <Row label="Auto">Pieces left on Auto go wherever the optimizer puts them and are tagged Auto. A piece set to a hero stays there; giving that hero another piece in the same slot moves the old one back to Auto, as in-game.</Row>
        <Row label="Not equipped">Auto pieces your squad doesn’t need, and extra pieces set to a hero whose slot is already filled.</Row>
      </Section>

      <Section title="Squad">
        <Row label="Your squad">Once you own 5 heroes, the optimizer picks the best 5 and hands out your gear. Pick my own squad locks in yours, and the optimizer’s pick stays listed for comparison.</Row>
        <Row label="Rows">Tap the swap button on a hero, then a hero in the other row, to switch them. Rows change the score: DPS heroes get their goal bonus in the back row.</Row>
        <Row label="Alt">On the optimizer’s pick, each hero shows the best hero to swap in and how many points the squad would lose.</Row>
        <Row label="Warnings">Shown at the top, most serious first. Red: you have no Gold gear, or you chose a hybrid squad and none of your heroes is at Exclusive Weapon 5. Yellow: a hero below 3★, or an SSR whose promotion season hasn’t come yet.</Row>
      </Section>

      <Section title="Upgrades">
        <Row label="Max efficiency">Ranks each piece’s next step by Power gained per unit of the resource you’re shortest on. If none of the steps use it, you’ll be offered the resources they do use. Steps it can’t rank are listed below the ranking.</Row>
        <Row label="By role">Gear that doesn’t fit the hero’s role: Gun should lead on DPS heroes, Armor on tanks, Radar on support.</Row>
        <Row label="Weakest link">The squad’s 10 weakest pieces, weakest first.</Row>
        <Row label="What’s included">Only the gear your squad is wearing.</Row>
      </Section>

      <Section title="Profiles">
        <Row label="Profiles">Tap your profile name at the top right to add, rename, duplicate or delete one. Everything saves in this browser.</Row>
        <Row label="Share and back up">Download as JSON saves the profile as a file. Import profile takes that file or its pasted contents, and replaces any profile with the same name.</Row>
      </Section>

      {/* v1: "How scores are calculated" is hidden.
      <section className="border-t border-line">
        <button onClick={() => setShowScoring(o => !o)} aria-expanded={showScoring}
          className="w-full flex items-center justify-between gap-2 py-3 text-base font-semibold text-ink hover:text-accent">
          How scores are calculated
          <Chevron open={showScoring} />
        </button>
        {showScoring && (
          <dl className="space-y-3 text-sm pb-2">
            <Row label="Hero score">Rarity (UR 3, SSR 2, SR 1) × stars ÷ 5, then ×1.2 at 3★ or ×1.4 at 4★ and above, +5% per Exclusive Weapon level (UR only), and the goal modifier. A promoted SSR counts as UR.</Row>
            <Row label="PvP rally">Schuyler ×1.3, DVA and Kimberly ×1.2, any other DPS hero in the back row ×1.15.</Row>
            <Row label="World boss">Mason ×1.3, Sarah ×1.25, Elsa and Swift ×1.2, any other DPS hero in the back row ×1.15.</Row>
            v1: Code battles is hidden.
            <Row label="Code battles">Heroes of the unit type the current code buffs count ×1.5.</Row>
            <Row label="One unit type">All 5 the same type +20%, 4 the same +15%, a 3 and 2 split +10%, 3 the same +5%. Squad makeup on the Goal screen doesn’t change this; it only adds warnings.</Row>
            <Row label="EW type buff">Each hero at Exclusive Weapon 20 or higher gives +7.5% to every squad member of the same type, and they stack.</Row>
            <Row label="Counters">PvP rally only, once you set the opponent’s type: +8% with 1 or 2 heroes of the counter type, +15% with 3, +20% with 4 or 5. Tanks beat missiles, missiles beat aircraft, aircraft beat tanks.</Row>
            <Row label="Squad rules">The optimizer picks squads with a tank-role hero in the front row when it can. A squad with no DPS hero scores ×0.6.</Row>
            <Row label="Gear Power">Max efficiency uses in-game Power from a model fitted to real Gear Details screens.</Row>
          </dl>
        )}
      </section>
      */}
    </div>
  )
}

const NAV_ICONS = {
  goal: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5"/>
      <circle cx="8" cy="8" r="3"/>
      <line x1="8" y1="1.5" x2="8" y2="5"/>
      <line x1="8" y1="11" x2="8" y2="14.5"/>
      <line x1="1.5" y1="8" x2="5" y2="8"/>
      <line x1="11" y1="8" x2="14.5" y2="8"/>
    </svg>
  ),
  roster: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="5.5" cy="5" r="2"/>
      <circle cx="10.5" cy="5" r="2"/>
      <path d="M1.5 14c0-2.2 1.8-3.5 4-3.5s4 1.3 4 3.5"/>
      <path d="M9 14c0-1.8 1.1-3 2.5-3s2.5 1.2 2.5 3"/>
    </svg>
  ),
  gear: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="2.5"/>
      <path d="M8 1.5V4M8 12v2.5M1.5 8H4M12 8h2.5M3.4 3.4l1.8 1.8M10.8 10.8l1.8 1.8M3.4 12.6l1.8-1.8M10.8 5.2l1.8-1.8"/>
    </svg>
  ),
  squad: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="9.5" width="4" height="5" rx="0.5"/>
      <rect x="6" y="9.5" width="4" height="5" rx="0.5"/>
      <rect x="11" y="9.5" width="4" height="5" rx="0.5"/>
      <rect x="3" y="1.5" width="4" height="5" rx="0.5"/>
      <rect x="9" y="1.5" width="4" height="5" rx="0.5"/>
    </svg>
  ),
  upgrades: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1.5,11.5 5,7.5 8.5,9.5 14.5,3"/>
      <polyline points="11,3 14.5,3 14.5,6.5"/>
    </svg>
  ),
  help: (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6.5"/>
      <path d="M6 6.5a2 2 0 1 1 2.5 1.9C7.5 8.8 8 9.4 8 10.5"/>
      <circle cx="8" cy="12.5" r="0.6" fill="currentColor" stroke="none"/>
    </svg>
  ),
}

const NAV = [
  { key: 'goal',     label: 'Goal'     },
  { key: 'roster',   label: 'Roster'   },
  { key: 'gear',     label: 'Gear'     },
  { key: 'squad',    label: 'Squad'    },
  { key: 'upgrades', label: 'Upgrades' },
  { key: 'help',     label: 'Help'     },
]

// The app never changes its URL, so each screen is sent to GoatCounter (index.html) as its own page.
// The script loads async, so a count made before it is ready waits for it. Ad blockers may stop it; that's fine.
function countScreen(key) {
  const send = () => window.goatcounter?.count?.({
    path: `/${key}`,
    title: NAV.find(n => n.key === key)?.label ?? key,
  })
  if (window.goatcounter?.count) send()
  else document.getElementById('goatcounter')?.addEventListener('load', send, { once: true })
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

  useEffect(() => countScreen(state.activeSection), [state.activeSection])

  // Derived / computed values — all optimizer results are pure functions of state
  const ownedIds = useMemo(
    () => Object.keys(state.heroes).filter(id => state.heroes[id].owned),
    [state.heroes]
  )

  const heroScores = useMemo(
    () => computeAllHeroScores(state.heroes, state.season, state.goal, state.codeType, state.rows),
    [state.heroes, state.season, state.goal, state.codeType, state.rows]
  )

  const recommendedSquad = useMemo(
    () => findRecommendedSquad(ownedIds, heroScores, state.heroes, state.intent, state.opponentType, state.rows),
    [ownedIds, heroScores, state.heroes, state.intent, state.opponentType, state.rows]
  )

  // From here on, "squad" is the one in use: the player's locked 5 if set, else the recommendation.
  const squadInfo = useMemo(
    () => activeSquad(recommendedSquad, state.squadLock, ownedIds, heroScores, state.heroes, state.intent, state.opponentType),
    [recommendedSquad, state.squadLock, ownedIds, heroScores, state.heroes, state.intent, state.opponentType]
  )

  const gearAssignment = useMemo(
    () => assignGear(squadInfo.squad, state.gear, heroScores),
    [squadInfo.squad, state.gear, heroScores]
  )

  const hasSquadEW5 = useMemo(
    () => squadInfo.squad.some(id => (state.heroes[id]?.ewLevel ?? 0) >= 5),
    [squadInfo.squad, state.heroes]
  )

  const upgradePriority = useMemo(
    () => computeUpgradePriority(gearAssignment.assigned, heroScores, state.upgradeMode, state.intent, hasSquadEW5, state.limitingResource),
    [gearAssignment.assigned, heroScores, state.upgradeMode, state.intent, hasSquadEW5, state.limitingResource]
  )

  // Resources that rank at least one of the squad's next steps, offered when the chosen one ranks none.
  const rankable = useMemo(
    () => RESOURCES.filter(r => rankUpgrades(gearAssignment.assigned, r).some(i => i.roi !== null)),
    [gearAssignment.assigned]
  )

  const warnings = useMemo(
    () => computeWarnings(state, squadInfo.squad, state.season),
    [state.intent, state.heroes, state.gear, squadInfo.squad, state.season]
  )

  const sections = {
    goal:     <GoalSelector state={state} dispatch={dispatch} ownedIds={ownedIds} />,
    roster:   <RosterManager state={state} dispatch={dispatch} heroScores={heroScores} season={state.season} />,
    gear:     <GearInventory state={state} dispatch={dispatch} ownedIds={ownedIds} squad={squadInfo.insufficient ? [] : squadInfo.squad} assigned={gearAssignment.assigned} />,
    squad:    <SquadOptimizer state={state} dispatch={dispatch} recommendedSquad={squadInfo} gearAssignment={gearAssignment} heroScores={heroScores} ownedIds={ownedIds} warnings={warnings} />,
    upgrades: <UpgradePriority state={state} dispatch={dispatch} upgradePriority={upgradePriority} rankable={rankable} />,
    help:     <HelpGuide />,
  }

  return (
    <div className="h-screen flex flex-col bg-ground text-ink overflow-hidden">
      <header className="flex-none h-14 bg-panel border-b border-line flex items-center justify-between gap-3 px-3 md:px-5 z-10">
        <p className="flex items-baseline gap-2 min-w-0">
          <span className="font-stencil text-2xl leading-none whitespace-nowrap">Last War Armory</span>
          <span className="self-center text-xs font-semibold text-on-signal bg-signal rounded-xs px-1.5 leading-5" title="Beta: some features are limited, see Help">Beta</span>
          <span className="hidden md:inline text-sm text-ink-2 truncate">Squad and gear planner</span>
        </p>
        <ProfileSwitcher state={state} dispatch={dispatch} />
      </header>

      <div className="flex flex-1 min-h-0">
        <nav aria-label="Sections" className="flex-none w-12 md:w-44 bg-panel border-r border-line flex flex-col py-2 gap-0.5 overflow-y-auto">
          {NAV.map(({ key, label }) => {
            const on = state.activeSection === key
            return (
              <button key={key} aria-label={label} aria-current={on ? 'page' : undefined}
                onClick={() => dispatch({ type: 'SET_SECTION', payload: key })}
                className={`flex items-center gap-3 px-3 md:px-4 min-h-[44px] text-left border-l-[3px] transition-colors
                  ${on ? 'border-signal bg-signal/15 text-ink font-semibold' : 'border-transparent text-ink-2 hover:text-ink hover:bg-raised'}`}>
                <span className="flex-none w-[18px] flex items-center justify-center">{NAV_ICONS[key]}</span>
                <span className="hidden md:block text-sm">{label}</span>
              </button>
            )
          })}
        </nav>

        <main className="flex-1 min-w-0 overflow-y-auto">
          <div key={state.activeSection} className="section-enter px-3 py-6 sm:px-4 md:px-8 md:py-8 max-w-2xl">
            {sections[state.activeSection]}
          </div>
        </main>
      </div>
    </div>
  )
}
