# Last War Survival — Squad & Gear Optimizer: Design Spec

**Date:** 2026-05-18  
**Status:** Approved

---

## Overview

A public community web tool for Last War Survival players. Takes a player's hero roster and gear inventory as input, recommends the optimal 5-hero squad for a chosen goal, assigns owned gear optimally across that squad, and ranks upgrade priorities for remaining resource spending.

Three problems solved in sequence:
1. **Squad Selection** — which 5 heroes to field
2. **Gear Assignment** — which gear pieces go to which hero slot
3. **Upgrade Priority** — what to upgrade next given the optimal assignment

---

## Tech Stack

- **Framework:** Vite + React (JSX, not TSX)
- **Styling:** Tailwind CSS (installed package, not CDN)
- **Fonts:** Rajdhani + Orbitron via Google Fonts `@import` in `index.css`
- **Charts:** recharts only if a visual adds clear value; prefer Tailwind UI otherwise
- **Persistence:** localStorage only — no external API calls
- **Primary output:** `src/App.jsx` (all business logic and UI consolidated here)

Supporting files: `index.html`, `vite.config.js`, `package.json`, `tailwind.config.js`, `postcss.config.js`, `src/index.css`

---

## Aesthetic

Dark military tactical HUD — field operations logistics software feel.

- **Background:** `#0a0a0a` with CSS scanline texture (`repeating-linear-gradient`, no image file)
- **Primary accent:** amber `#d97706`
- **Secondary accents:** olive `#65a30d`, danger red `#dc2626`, info blue `#0ea5e9`, muted `#404040`
- **Display font:** Rajdhani or Orbitron — all headers, labels, badges
- **Data/numbers:** monospace (Courier New)
- **Unit type color stripes:** Tank=amber, Aircraft=blue `#0ea5e9`, Missile=olive `#65a30d`
- **Hero cards:** field dossier style — left color stripe, rarity badge top-left, effectiveness score top-right
- **Gear slots:** segmented progress bars (4 segments = 10 levels each), amber fill, star pips below
- **Active/selected elements:** amber `box-shadow` glow
- **Section dividers:** dashed lines in muted color, military stencil aesthetic
- **Tap targets:** minimum 44px height throughout
- **Inventory/roster:** compact card rows, not expanded panels

---

## App.jsx File Structure

Four clearly labeled sections in order:

```
// ═══ SECTION 1: GAME DATA ═══
// Static constants: hero roster definitions, slot types,
// rarity weights, goal weights, season-promotion map

// ═══ SECTION 2: OPTIMIZER ENGINE ═══
// Pure functions: heroScore(), squadScore(), assignGear(),
// upgradePriority(), computeWarnings()

// ═══ SECTION 3: STATE ═══
// Reducer, initial state, localStorage sync, profile helpers

// ═══ SECTION 4: UI ═══
// React components and App() root function
```

---

## Layout & Navigation

### Shell (mobile-first, single column)

```
┌─────────────────────────────────┐
│  [icon] LAST WAR OPS  [profile] │  ← top bar
├──┬──────────────────────────────┤
│  │                              │
│🎯│   <active section content>   │  ← icon rail (40px) + main
│👥│                              │
│⚙️│                              │
│📊│                              │
│📈│                              │
├──┴──────────────────────────────┤
│  LOADOUT | UPGRADES | WARNINGS  │  ← sticky rec panel, 3 tabs
│  <recommendation content>       │
└─────────────────────────────────┘
```

### Navigation

**Icon rail** — persistent 40px sidebar on all screen sizes. Icons only on mobile (<768px). On ≥768px expands to ~160px with text labels. Sections:
- 🎯 GOAL
- 👥 ROSTER
- ⚙️ GEAR
- 📊 SQUAD
- 📈 UPGRADES

Active section highlighted with amber left-border glow.

**Top bar** — app name left, profile switcher right (compact dropdown).

**Recommendation panel** — always pinned to bottom. 3-tab switcher: LOADOUT / UPGRADES / WARNINGS.

---

## State Model

Single `useReducer` owns all state. Shape:

```js
{
  // Global context
  season: 3,          // 1–6
  goal: 'pvp_rally',  // pvp_rally | world_boss | code_battles | balanced
  intent: 'mono',     // mono | hybrid_progress | full_hybrid

  // Hero roster — keyed by hero id (all ~30 heroes present, owned: false by default)
  heroes: {
    kimberly: {
      owned: true,
      stars: 4,
      level: 45,
      skills: [7, 6, 5, 5],  // 4 skill levels, each 1–10
      ewLevel: 3,             // UR/promoted SSR only; always 0 otherwise
    },
    // ...
  },

  // Gear inventory — flat array, no hero association
  gear: [
    { id: 'g1', slot: 'gun', quality: 'legendary', level: 28, stars: 3 },
    // ...
  ],

  // Profile management
  profiles: {
    'Main Account': { season, goal, intent, heroes, gear },
  },
  activeProfile: 'Main Account',

  // UI state (excluded from profile persistence)
  activeSection: 'roster',       // goal | roster | gear | squad | upgrades
  activeRecTab: 'loadout',       // loadout | upgrades | warnings
  upgradeMode: 'max_efficiency', // max_efficiency | role_based | weakest_link
}
```

**Computed values via `useMemo`** (never stored in state):
- `heroScores` — effectiveness score per owned hero
- `recommendedSquad` — best 5-hero combo + per-slot alternates
- `gearAssignment` — optimal gear-to-hero slot mapping
- `upgradePriority` — ranked upgrade list for current mode
- `warnings` — array of warning strings with severity

Profiles store only `{ season, goal, intent, heroes, gear }`. UI state is excluded.  
localStorage key: `lastwar_optimizer_v1`

---

## Game Data (Section 1)

### Hero Roster

All heroes defined as static constants. Each hero has: `id`, `name`, `rarity` (UR/SSR/SR), `unitType` (tank_vehicle/aircraft/missile_vehicle), `role` (dps/tank/support), `defaultRow` (front/back), `promotionSeason` (null or 1–6 for SSRs that can become UR).

Full roster:

**UR:** kimberly (Tank, DPS, front), dva (Missile, DPS, back), williams (Tank, Tank, front), murphy (Tank, Tank, back), marshall (Tank, Support, back), tesla (Missile, DPS, back), morrison (Aircraft, DPS, back)

**SSR:** mason (Tank, DPS, back, S1), violet (Tank, Tank, front, S2), scarlett (Aircraft, DPS, back, S3), venom (Missile, DPS, back, S4), schuyler (Aircraft, CC/DPS, back), fiona (Missile, DPS, back), sarah (Aircraft, Support, back), lucius (Aircraft, Tank, front), carlie (Aircraft, Tank, front), stetmann (Tank, DPS, front), mcgregor (Missile, Tank, front), adam (Missile, Tank, front), swift (Missile, DPS, back), richard (Tank, Tank, front), elsa (Missile, Support, back), maxwell (Aircraft, DPS, back)

**SR:** drake (Tank, Tank, front), kane (Missile, DPS, back), ambolt (Aircraft, Support, back)

### Season-Gated Promotions

A hero is treated as UR (rarity_weight=3) when `promotionSeason !== null && promotionSeason <= currentSeason`. This is automatic — no manual flag needed.

```js
function isPromotedUR(heroId, season) {
  const hero = HEROES[heroId]
  return hero.promotionSeason !== null && hero.promotionSeason <= season
}
```

### Goal Weights

`GOAL_WEIGHTS` is a map of `{ [goal]: { [heroId]: multiplier } }`. Named heroes get explicit multipliers. For general category tags ("burst DPS", "sustain DPS"), the multiplier is applied to any back-row DPS hero not already explicitly weighted.

- **pvp_rally:** schuyler×1.3, dva×1.2, kimberly×1.2; all other back-row DPS heroes ×1.15
- **world_boss:** mason×1.3, sarah×1.25, elsa×1.2, swift×1.2; all other back-row DPS heroes ×1.15
- **code_battles:** kimberly×1.25, stetmann×1.2, williams×1.2, murphy×1.2
- **balanced:** all heroes ×1.0 (no modifications)

### Gear Slots

- **Gun** — offensive (DPS priority)
- **Chip** — offensive (DPS priority)  
- **Armor** — physical defense (Tank priority)
- **Radar** — energy resistance + crit damage reduction (universal)

### Quality Weights

`legendary=4, epic=2, rare=1, common=0.5`

### Rarity Weights

`UR=3, SSR=2, SR=1`

---

## Optimizer Engine (Section 2)

### Hero Effectiveness Score

```js
function heroScore(heroId, heroState, season, goal) {
  const { stars, skills, ewLevel } = heroState
  const hero = HEROES[heroId]

  const effectiveRarity = isPromotedUR(heroId, season) ? 'UR' : hero.rarity
  const rarityWeight = { UR: 3, SSR: 2, SR: 1 }[effectiveRarity]

  const avgSkill = skills.reduce((a, b) => a + b, 0) / skills.length
  const base = rarityWeight * (stars / 5) * avgSkill

  const starBonus = stars >= 4 ? 1.4 : stars >= 3 ? 1.2 : 1.0

  // ewBonus applies to native UR and promoted SSRs (both resolved to effectiveRarity==='UR')
  const ewBonus = (effectiveRarity === 'UR' && ewLevel > 0)
    ? 1 + ewLevel * 0.15
    : 1.0

  const goalMod = GOAL_WEIGHTS[goal][heroId] ?? 1.0

  return base * starBonus * ewBonus * goalMod
}
```

### Squad Optimizer

1. Filter owned heroes
2. Enumerate all C(n,5) combinations (max ~C(30,5)=142,506 — runs synchronously)
3. Apply hard constraint: discard any combo with 0 front-row tank-role heroes
4. Score each valid combo:
   ```
   squadScore = sum(heroScore for each member)
              × monoBonus      // +25% if all 5 same unit type
              × hybridPenalty  // -20% if mixed types and no member has EW 5+
              × dpsPenalty     // ×0.6 if 0 DPS heroes in squad
   ```
5. Return the top-scoring combo as `recommendedSquad`
6. For each of the 5 slots, find the next-best alternative hero (best single-hero swap that doesn't violate hard constraints) and include a score-diff explanation

### Gear Assignment

For each hero in `recommendedSquad` (sorted by heroScore descending — best heroes pick first):

Role priority order:
- DPS: `gun → chip → radar → armor`
- Tank: `armor → radar → gun → chip`
- Support: `radar → chip → armor → gun`

For each slot in priority order: assign the highest-scoring available gear piece of matching slot type. Mark assigned pieces as used. If no matching piece exists, slot remains empty.

**Gear piece score:**
```js
pieceScore = qualityWeight * (level / 40) * (1 + stars * 0.2)
```

Output: complete loadout per hero + list of unassigned pieces.

### Upgrade Priority Engine

**Max Efficiency mode:** For every assigned gear piece, score two candidate upgrades: level+1 and stars+1. Apply milestone multiplier (2×) if next level hits 10 or 40, or next stars hits 2 or 4. Multiply by hero's effectiveness score. Rank globally.

**Role-Based mode:** Compute role-alignment gaps per hero. Flag DPS heroes where Armor level > Gun level, Tank heroes where Gun level > Armor level, Support heroes where Radar level is lowest. Rank upgrades by closing largest gaps first.

**Weakest Link mode:** Compute average `pieceScore` across all assigned pieces. Find the assigned piece furthest below average. Prioritize bringing laggards up before pushing leaders higher.

All modes prepend a hybrid EW callout when `intent === 'hybrid_progress'` and no owned hero has `ewLevel >= 5`.

### Warnings Engine

Generates an array of warning objects `{ severity: 'danger'|'caution', message: string }`:

- Season-investment warnings: flag SSR heroes where investment has low ROI until their UR promotion season arrives
- Hybrid formation risk: if intent is hybrid/hybrid-progress and no EW 5+
- Low-star heroes in squad: if any squad member is <3★ (skills offline), flag starring up as priority over gear
- No Legendary gear: if gear inventory has 0 legendary pieces
- Mason World Boss: if goal is world_boss and mason is in squad, highlight synergy
- Blueprint scarcity: any star promotion recommendation includes a note about Blueprint cost

---

## UI Components (Section 4)

### GoalSelector
Season picker (1–6 segmented control), goal radio group (4 options), intent radio group (3 options). If intent is hybrid or hybrid-progress and no owned hero has EW 5+, show amber warning callout.

### RosterManager
Scrollable list of all heroes grouped by rarity (UR → SSR → SR), then by unit type within rarity. Each hero is a compact dossier-style row:
- Left color stripe: unit type color
- Rarity badge (UR/SSR/SR) top-left
- Hero name + role tag
- Effectiveness score top-right (monospace, only shown if owned)
- Unowned heroes: dimmer, single tap to toggle owned
- Owned heroes: tap to expand inline, showing star/level/skill inputs. EW level input shown only when `hero.rarity === 'UR' || isPromotedUR(heroId, season)`.
- Season-promotion badge when `promotionSeason` is within 1 season of current (e.g. at Season 1, show "→ UR at S2" on Violet)

### GearInventory
Flat list of gear pieces as compact rows. Each row:
- Slot badge (GUN/CHIP/ARMOR/RADAR)
- Quality badge (color-coded)
- Segmented level bar (4 segments × 10 levels, amber fill)
- Star pips (0–5)
- Tap to open an edit modal (level, stars, quality); modal includes a delete button

"+ ADD GEAR" button (floating, amber) at bottom. Tap opens a quick-add form: slot type → quality → level slider → star count → confirm.

Inventory summary header: "5× GUN · 3× CHIP · 4× ARMOR · 6× RADAR" with a tooltip: "Moving gear between heroes costs a small gold fee in-game but is always worth it when the optimizer recommends it."

### SquadOptimizer
Shows recommended squad in formation layout (2 front / 3 back). Each hero slot card:
- Hero dossier mini-card (name, stars, EW level)
- Assigned gear summary (4 slot icons with quality and level)
- Alternate hero chip below: "Alt: [Name] (−X pts)"

### UpgradePriority
Mode switcher (3 amber buttons). Numbered list of upgrade actions. Each item:
`[N]. Upgrade GUN (Lv 28 → 29) — [Hero Name] — "Hits Lv 40 milestone"`

Reason tags: "Hits Lv 40 milestone", "4★ breakpoint — major power spike", "Biggest DPS gap", "Weakest link in squad", "Blueprint spend justified here", "Role misalignment — Gun should lead for DPS hero"

Star promotion items always append: ⚠ Blueprint cost — confirm availability before spending.

### RecPanel (sticky bottom)
Three tabs:
- **LOADOUT** — compact gear-per-hero grid showing current optimal assignment
- **UPGRADES** — condensed version of upgrade priority list (top 5)
- **WARNINGS** — bulleted list, danger (red) and caution (amber) severity

### ProfileSwitcher (top bar)
Compact dropdown showing active profile name. Menu options: switch to another profile, rename, duplicate, delete, + New Profile. Export (copies minified JSON to clipboard, shows toast). Import (modal with textarea, validates structure, creates new named profile).

---

## Persistence

- **localStorage key:** `lastwar_optimizer_v1`
- **Stored shape:** `{ activeProfile: string, profiles: { [name]: ProfileData } }`
- **ProfileData:** `{ season, goal, intent, heroes, gear }`
- **Sync:** `useEffect` watching `state.profiles` + `state.activeProfile`, writes on every change
- **Hydration:** `initialState` loaded from localStorage on app init; falls back to defaults if absent or corrupt
- **Export:** JSON.stringify of current ProfileData, copied to clipboard
- **Import:** JSON.parse, structure validation, loaded as new profile (name from JSON field or prompted)

---

## Out of Scope

- Authentication or user accounts
- Server-side storage or sync
- Real-time multiplayer or alliance features
- Routing (single-page, no URL navigation)
- TypeScript
- Testing infrastructure
