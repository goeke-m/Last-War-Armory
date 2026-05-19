# Squad Reasoning Panel — Design Spec

**Date:** 2026-05-19  
**Status:** Approved

## Overview

Add a collapsible "WHY THIS SQUAD" panel below the squad formation in `SquadOptimizer`. It explains the active score bonuses for the recommended squad and surfaces actionable near-miss opportunities. Default collapsed; user toggles open.

## UI Layout

The panel sits directly below the front row in `SquadOptimizer`, separated by a thin dashed line. A toggle button labeled `› WHY THIS SQUAD` spans the full width. Clicking it expands the panel; the chevron rotates 90° when open. Default state: closed.

When expanded, the panel has two sections:

**Active bonuses** (green text) — factors currently boosting the squad score:
- Mono type bonus, e.g. "4/5 Mech — +15% mono bonus"
- EW type buff per contributing hero, e.g. "Violet EW20 buffs 3 Mech allies — +7.5% each"
- Counter advantage if opponent type is set, e.g. "Counters Infantry enemy — +8% counter bonus"

**Opportunities** (yellow text) — near-miss improvements that are actually achievable:
- Full mono upgrade: only shown if the user owns a spare hero of the dominant type not in the squad, e.g. "Swap Marco for a Mech hero — unlock +5% full mono"
- EW buff upgrade: only shown if a squad hero has EW 15–19, e.g. "Level Rosa EW to 20 — add another +7.5% stack"
- Counter bonus upgrade: only shown if the squad has 1–2 counter heroes and the user owns more of that type, e.g. "Add 1 more Mech hero — improve counter bonus to +15%"

If a section has no entries it is omitted. If both sections are empty the toggle is hidden entirely.

## Data / Logic

A new pure function `computeSquadReasoning(combo, heroScores, heroes, intent, opponentType, ownedIds)` is added alongside `computeSquadScore`. It returns `{ active: string[], opportunities: string[] }` by re-running the same multiplier logic as `computeSquadScore` and collecting human-readable strings for each active factor, then checking ownership conditions for each near-miss.

`findRecommendedSquad` calls `computeSquadReasoning` on the winning combo and attaches the result as `reasoning` on the returned object: `{ squad, alternates, score, reasoning, insufficient }`.

`SquadOptimizer` receives `reasoning` via `recommendedSquad.reasoning` and renders the toggle + panel. A `useState(false)` hook tracks open/closed.

## Styling

Matches the existing dark theme:
- Toggle button: `font-orbitron text-xs text-neutral-500`, amber chevron, full-width, no background
- Panel: left amber border (`border-l-2 border-amber-600`), dark background (`bg-neutral-950`)
- Section labels: `font-orbitron text-xs text-neutral-600 tracking-widest`
- Active bonus lines: `font-rajdhani text-xs`, bonus value in `text-green-400`
- Opportunity lines: `font-rajdhani text-xs`, suggestion value in `text-yellow-400`
- Bullet: `›` in amber

## Files Changed

- `src/App.jsx` only — no new files needed.

## Out of Scope

- No DPS penalty is already surfaced in the Warnings tab; it is not duplicated here.
- Reasoning is not shown in the compact `RecPanel` loadout tab.
- No animation on expand/collapse beyond the chevron rotation.
