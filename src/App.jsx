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

function maxEfficiencyUpgrades(assigned, heroScores) {
  const upgrades = []
  for (const [heroId, slots] of Object.entries(assigned)) {
    const hScore = heroScores[heroId] ?? 1
    for (const [slot, piece] of Object.entries(slots)) {
      if (!piece) continue
      if (piece.level < 40) {
        const next = piece.level + 1
        const mult = (next === 10 || next === 40) ? 2 : 1
        const reason = next === 40 ? 'Hits Lv 40 milestone' : next === 10 ? 'Hits Lv 10 milestone' : 'Max efficiency'
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
  heroes: INITIAL_HEROES_STATE,
  gear: [],
}

function buildInitialState() {
  const saved = loadFromLocalStorage()
  if (saved) {
    const profile = saved.profiles[saved.activeProfile] ?? BLANK_PROFILE
    return {
      ...profile,
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
      return { ...state, activeProfile: action.name, ...profile }
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
  const frontRow = squad.filter(id => HEROES[id].defaultRow === 'front')
  const backRow = squad.filter(id => HEROES[id].defaultRow === 'back')
  const rows = [{ label: 'FRONT ROW', ids: frontRow }, { label: 'BACK ROW', ids: backRow }]

  return (
    <div className="p-3 max-w-lg">
      <p className="font-orbitron text-amber-600 text-xs tracking-widest border-b border-dashed border-neutral-700 pb-2 mb-3">
        // OPTIMAL SQUAD · SCORE {recommendedSquad.score.toFixed(1)}
      </p>

      {rows.map(({ label, ids }) => (
        <div key={label} className="mb-4">
          <p className="font-orbitron text-xs text-neutral-500 tracking-widest mb-2">{label}</p>
          <div className="space-y-2">
            {ids.map(heroId => {
              const hero = HEROES[heroId]
              const colors = UNIT_COLORS[hero.unitType]
              const h = state.heroes[heroId]
              const slots = gearAssignment.assigned[heroId] ?? {}
              const alt = alternates[heroId]

              return (
                <div key={heroId} className={`border-l-4 ${colors.border} bg-neutral-900 border border-neutral-800 p-2`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`font-orbitron text-xs ${colors.text}`}>{hero.rarity}</span>
                    <span className="font-rajdhani font-semibold text-sm text-gray-200 flex-1">{hero.name}</span>
                    <span className="font-mono text-xs text-neutral-500">{h.stars}★</span>
                    {h.ewLevel > 0 && <span className="font-mono text-xs text-sky-500">EW{h.ewLevel}</span>}
                    <span className="font-mono text-xs text-amber-600">{heroScores[heroId]?.toFixed(1)}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-1 mb-2">
                    {SLOTS.map(slot => {
                      const piece = slots[slot]
                      return (
                        <div key={slot} className={`border ${piece ? 'border-neutral-700' : 'border-neutral-800 opacity-40'} p-1 text-center`}>
                          <p className="font-orbitron text-xs text-neutral-500">{slot.toUpperCase()}</p>
                          {piece ? (
                            <>
                              <p className="font-mono text-xs text-amber-600">Lv{piece.level}</p>
                              <p className="font-mono text-xs text-neutral-400">{piece.stars}★</p>
                              <p className="font-orbitron text-xs text-neutral-600">{piece.quality.slice(0,3).toUpperCase()}</p>
                            </>
                          ) : (
                            <p className="font-orbitron text-xs text-neutral-700">—</p>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {alt && (
                    <p className="font-rajdhani text-xs text-neutral-600">
                      Alt: <span className="text-neutral-400">{HEROES[alt.heroId].name}</span>
                      <span className="text-red-500 ml-1">({alt.scoreDiff.toFixed(1)} pts)</span>
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
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
  const qualityColors = {
    legendary: 'text-amber-400 border-amber-700',
    epic: 'text-purple-400 border-purple-800',
    rare: 'text-blue-400 border-blue-800',
    common: 'text-neutral-400 border-neutral-700'
  }
  const slotLabels = { gun: 'GUN', chip: 'CHIP', armor: 'ARMOR', radar: 'RADAR' }

  return (
    <div className="flex items-center gap-2 px-2 py-2 border border-neutral-800 bg-neutral-900 mb-1 cursor-pointer hover:border-neutral-600 min-h-[44px]"
      onClick={onEdit}>
      <span className={`font-orbitron text-xs border px-1 flex-none ${qualityColors[piece.quality]}`}>{piece.quality.slice(0,3).toUpperCase()}</span>
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
          <p className="font-orbitron text-xs text-neutral-500 mb-1">QUALITY</p>
          <div className="flex gap-1">
            {QUALITIES.map(q => (
              <button key={q} onClick={() => setQuality(q)}
                className={`flex-1 py-2 font-orbitron text-xs border min-h-[40px] transition-colors
                  ${quality === q ? 'border-amber-600 text-amber-600 bg-amber-600/10' : 'border-neutral-700 text-neutral-500'}`}>
                {q.slice(0,3).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Level */}
        <div>
          <p className="font-orbitron text-xs text-neutral-500 mb-1">LEVEL: <span className="text-amber-600">{level}</span></p>
          <input type="range" min="0" max="40" value={level} onChange={e => setLevel(Number(e.target.value))} className="w-full" />
        </div>

        {/* Stars */}
        <div>
          <p className="font-orbitron text-xs text-neutral-500 mb-1">STARS</p>
          <div className="flex gap-1">
            {[0,1,2,3,4,5].map(s => (
              <button key={s} onClick={() => setStars(s)}
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

function HeroCard({ heroId, heroState, heroScore, season, dispatch }) {
  const [expanded, setExpanded] = useState(false)
  const hero = HEROES[heroId]
  const colors = UNIT_COLORS[hero.unitType]
  const isEffectiveUR = hero.rarity === 'UR' || isPromotedUR(heroId, season)
  const showEW = isEffectiveUR
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
            <input type="range" min="1" max="60" value={heroState.level}
              onChange={e => dispatch({ type: 'UPDATE_HERO', heroId, updates: { level: Number(e.target.value) } })}
              className="w-full" />
          </div>

          {/* Skills */}
          <div>
            <p className="font-orbitron text-xs text-neutral-500 mb-1">SKILL LEVELS</p>
            <div className="grid grid-cols-4 gap-1">
              {heroState.skills.map((lvl, i) => (
                <div key={i} className="text-center">
                  <p className="font-orbitron text-xs text-neutral-600 mb-0.5">SK{i+1}</p>
                  <input type="number" min="1" max="10" value={lvl}
                    onChange={e => {
                      const skills = [...heroState.skills]
                      skills[i] = Math.min(10, Math.max(1, Number(e.target.value)))
                      dispatch({ type: 'UPDATE_HERO', heroId, updates: { skills } })
                    }}
                    className="w-full bg-neutral-800 border border-neutral-700 text-center font-mono text-sm text-gray-200 py-1 min-h-[36px]" />
                </div>
              ))}
            </div>
          </div>

          {/* EW Level (UR / promoted SSR only) */}
          {showEW && (
            <div>
              <p className="font-orbitron text-xs text-neutral-500 mb-1">EW LEVEL: <span className="text-amber-600">{heroState.ewLevel}</span></p>
              <div className="flex gap-1 flex-wrap">
                {[0,1,2,3,4,5,6,7,8,9,10].map(lvl => (
                  <button key={lvl} onClick={() => dispatch({ type: 'UPDATE_HERO', heroId, updates: { ewLevel: lvl } })}
                    className={`px-2 py-1 font-mono text-xs border min-h-[32px] transition-colors
                      ${heroState.ewLevel === lvl ? 'border-amber-600 text-amber-600 bg-amber-600/10' : 'border-neutral-700 text-neutral-500'}`}>
                    {lvl}
                  </button>
                ))}
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
    { label: '// UR — ULTRA RARE', ids: ['kimberly','dva','williams','murphy','marshall','tesla','morrison'] },
    { label: '// SSR — SUPER RARE', ids: ['mason','violet','scarlett','venom','schuyler','fiona','sarah','lucius','carlie','stetmann','mcgregor','adam','swift','richard','elsa','maxwell'] },
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
    () => computeAllHeroScores(state.heroes, state.season, state.goal),
    [state.heroes, state.season, state.goal]
  )

  const recommendedSquad = useMemo(
    () => findRecommendedSquad(ownedIds, heroScores, state.heroes, state.intent),
    [ownedIds, heroScores, state.heroes, state.intent]
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
    [state, recommendedSquad.squad, state.season]
  )

  const sections = {
    goal:     <GoalSelector state={state} dispatch={dispatch} ownedIds={ownedIds} />,
    roster:   <RosterManager state={state} dispatch={dispatch} heroScores={heroScores} season={state.season} />,
    gear:     <GearInventory state={state} dispatch={dispatch} />,
    squad:    <SquadOptimizer state={state} recommendedSquad={recommendedSquad} gearAssignment={gearAssignment} heroScores={heroScores} />,
    upgrades: <div className="p-4 font-rajdhani text-gray-400">Upgrade Priority — coming soon</div>,
  }

  return (
    <div className="h-screen flex flex-col bg-neutral-950 text-gray-200 overflow-hidden">
      {/* Top bar */}
      <div className="flex-none h-12 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-3 z-10">
        <span className="font-orbitron text-amber-600 text-sm tracking-widest">LAST WAR OPS</span>
        <span className="font-rajdhani text-xs text-neutral-500 tracking-widest">PROFILE SWITCHER</span>
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

      {/* Recommendation panel */}
      <div className="flex-none border-t-2 border-amber-600 bg-neutral-900">
        <div className="flex border-b border-neutral-800">
          {['loadout', 'upgrades', 'warnings'].map(tab => (
            <button
              key={tab}
              onClick={() => dispatch({ type: 'SET_REC_TAB', payload: tab })}
              className={`flex-1 py-2 font-orbitron text-xs tracking-widest transition-colors min-h-[40px]
                ${state.activeRecTab === tab
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-neutral-500 hover:text-gray-300'
                }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
        <div className="p-3 h-32 overflow-y-auto font-rajdhani text-xs text-neutral-500">
          Rec panel content coming soon
        </div>
      </div>
    </div>
  )
}
