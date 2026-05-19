# Squad Reasoning Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collapsible "WHY THIS SQUAD" panel below the squad formation that explains active score bonuses and surfaces achievable near-miss improvements.

**Architecture:** Add a pure `computeSquadReasoning` function alongside `computeSquadScore` that returns `{ active, opportunities }` string arrays. Attach the result to `findRecommendedSquad`'s return value as `reasoning`. Render a toggle + panel in `SquadOptimizer` using a `useState(false)` hook.

**Tech Stack:** React 18, Tailwind CSS, Vite. No test framework — verification is manual browser inspection.

---

## File Map

| File | Change |
|------|--------|
| `src/App.jsx:247` | Add `computeSquadReasoning` after `computeSquadScore` |
| `src/App.jsx:295` | Call `computeSquadReasoning` inside `findRecommendedSquad` and add `reasoning` to return value |
| `src/App.jsx:946` | Add `useState` toggle + reasoning panel to `SquadOptimizer` |

---

## Task 1: Add `computeSquadReasoning` function

**Files:**
- Modify: `src/App.jsx` — insert new function after `computeSquadScore` (currently ends at line ~289)

This function re-runs the same multiplier logic as `computeSquadScore` and collects human-readable explanation strings. It does not re-use `computeSquadScore` to avoid coupling the rendering concern into the scoring path.

- [ ] **Step 1: Insert `computeSquadReasoning` after `computeSquadScore`**

In `src/App.jsx`, find the line:
```js
function hasFrontTank(combo) {
```
Insert the following function immediately before it:

```js
function computeSquadReasoning(combo, heroScores, heroes, intent, opponentType, ownedIds) {
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
```

- [ ] **Step 2: Start the dev server and verify no syntax errors**

```bash
npm run dev
```

Open `http://localhost:5173`. The app should load without a white screen or console errors. The squad section should look unchanged (the new function isn't called yet).

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: add computeSquadReasoning pure function"
```

---

## Task 2: Wire `reasoning` into `findRecommendedSquad`

**Files:**
- Modify: `src/App.jsx:295` — `findRecommendedSquad` function

- [ ] **Step 1: Call `computeSquadReasoning` on the winning combo and attach to return value**

Find this block in `findRecommendedSquad` (currently around line 318–322):

```js
    if (bestAlt) alternates[heroId] = { heroId: bestAlt, scoreDiff: bestAltScore - best.score }
  }

  return { squad: best.combo, alternates, score: best.score, insufficient: false }
```

Replace it with:

```js
    if (bestAlt) alternates[heroId] = { heroId: bestAlt, scoreDiff: bestAltScore - best.score }
  }

  const reasoning = computeSquadReasoning(best.combo, heroScores, heroes, intent, opponentType, ownedIds)
  return { squad: best.combo, alternates, score: best.score, reasoning, insufficient: false }
```

- [ ] **Step 2: Verify in browser console**

With the dev server running, open DevTools → Console. The app should still load without errors. Nothing visible changes yet.

- [ ] **Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "feat: attach reasoning to findRecommendedSquad result"
```

---

## Task 3: Render the toggle + reasoning panel in `SquadOptimizer`

**Files:**
- Modify: `src/App.jsx:946` — `SquadOptimizer` component

- [ ] **Step 1: Add `useState` import check**

`useState` is already imported at line 1:
```js
import { useState, useReducer, useMemo, useEffect } from 'react'
```
No change needed.

- [ ] **Step 2: Add `open` state and destructure `reasoning` in `SquadOptimizer`**

Find the current function opening and early-return block:

```js
function SquadOptimizer({ state, recommendedSquad, gearAssignment, heroScores }) {
  if (recommendedSquad.insufficient) {
```

Replace with:

```js
function SquadOptimizer({ state, recommendedSquad, gearAssignment, heroScores }) {
  const [open, setOpen] = useState(false)
  if (recommendedSquad.insufficient) {
```

- [ ] **Step 3: Add `reasoning` destructure and render the toggle + panel**

Find the closing section of the `SquadOptimizer` return — the front row block and its closing tags:

```js
      {/* Front row — 2 cards side by side */}
      <div className="mb-1">
        <p className="font-orbitron text-xs text-neutral-500 tracking-widest mb-1">FRONT ROW</p>
        <div className="grid grid-cols-2 gap-2">
          {frontRow.map(id => <HeroFormationCard key={id} heroId={id} {...cardProps} />)}
        </div>
      </div>
     
    </div>
  )
}
```

Replace with:

```js
      {/* Front row — 2 cards side by side */}
      <div className="mb-1">
        <p className="font-orbitron text-xs text-neutral-500 tracking-widest mb-1">FRONT ROW</p>
        <div className="grid grid-cols-2 gap-2">
          {frontRow.map(id => <HeroFormationCard key={id} heroId={id} {...cardProps} />)}
        </div>
      </div>

      {/* Reasoning toggle */}
      {(() => {
        const { active, opportunities } = recommendedSquad.reasoning
        if (active.length === 0 && opportunities.length === 0) return null
        return (
          <div className="mt-3">
            <button
              onClick={() => setOpen(o => !o)}
              className="w-full flex items-center gap-1 border-t border-dashed border-neutral-700 pt-2 font-orbitron text-xs tracking-widest text-neutral-500 hover:text-neutral-300 transition-colors bg-transparent"
            >
              <span className={`text-amber-600 transition-transform ${open ? 'rotate-90' : ''}`} style={{ display: 'inline-block' }}>›</span>
              WHY THIS SQUAD
            </button>
            {open && (
              <div className="mt-2 border-l-2 border-amber-600 bg-neutral-950 px-3 py-2 space-y-1">
                {active.length > 0 && (
                  <>
                    <p className="font-orbitron text-xs text-neutral-600 tracking-widest mb-1">ACTIVE BONUSES</p>
                    {active.map((line, i) => (
                      <p key={i} className="font-rajdhani text-xs text-neutral-400">
                        <span className="text-amber-600 mr-1">›</span>
                        {line.includes(' — ') ? line.split(' — ')[0] : line}
                        {line.includes(' — ') && (
                          <span className="text-green-400"> — {line.split(' — ')[1]}</span>
                        )}
                      </p>
                    ))}
                  </>
                )}
                {opportunities.length > 0 && (
                  <>
                    <p className="font-orbitron text-xs text-neutral-600 tracking-widest mt-2 mb-1">OPPORTUNITIES</p>
                    {opportunities.map((line, i) => (
                      <p key={i} className="font-rajdhani text-xs text-neutral-400">
                        <span className="text-amber-600 mr-1">›</span>
                        {line.includes(' — ') ? line.split(' — ')[0] : line}
                        {line.includes(' — ') && (
                          <span className="text-yellow-400"> — {line.split(' — ')[1]}</span>
                        )}
                      </p>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
        )
      })()}

    </div>
  )
}
```

- [ ] **Step 4: Verify in browser — toggle closed**

With the dev server running, navigate to the Squad section. The formation should render as before. Below the front row you should see a dashed separator and `› WHY THIS SQUAD` text. The panel should be hidden.

- [ ] **Step 5: Verify in browser — toggle open**

Click `› WHY THIS SQUAD`. The chevron should rotate 90°. The panel should expand showing:
- **ACTIVE BONUSES** section with green text for any active multipliers (mono bonus, EW buffs, counter advantage)
- **OPPORTUNITIES** section with yellow text for any near-misses (only shown if there are any)

If your test roster has no opponent type set, no counter lines will appear. Set an opponent type in the Goal section to test counter logic.

Test edge cases:
- If no active bonuses and no opportunities: the toggle should be hidden entirely
- Toggle open → reload page → toggle should be closed (no persistence needed)

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx
git commit -m "feat: squad reasoning toggle panel — WHY THIS SQUAD"
```
