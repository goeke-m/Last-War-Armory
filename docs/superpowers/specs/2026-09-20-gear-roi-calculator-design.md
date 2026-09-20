# Gear ROI Calculator — Design

**Date:** 2026-09-20
**Status:** Approved in conversation; pending written-spec review
**Background:** `docs/gear-roi-research-status.md`

## Goal

Replace the invented gear-upgrade scoring in `src/App.jsx` (`pieceScore`,
`qualityWeight`, `rarityWeight`, `starBonus`, linear `level / 40`) with an ROI
ranking built on real data: **in-game Power gained per unit of a chosen limiting
resource.**

## Decisions

- **Return metric:** in-game Power delta per upgrade.
- **Power source:** battle-report gear pages show one Power total per side
  (5 heroes × 4 pieces), never per piece. Per-piece Power is recovered by
  regression against those totals.
- **Cost model:** resources (gold, ore, ceramic, blueprints) are kept separate.
  The user picks a *limiting resource*; ROI = Power gained ÷ units of that
  resource. No invented exchange rate.
- **Unknown data is never guessed.** Missing stats or costs yield `null` and a
  "no data" row.

## Architecture

| Unit | Purpose | Depends on |
|---|---|---|
| `src/data/gearStats.js` | Stat table keyed by (slot, level, star), generated from the datamined CSV. Data only. | CSV |
| `src/data/powerModel.js` | Fitted Power-per-stat weights (shared across slots). Output of the fitter. | fitter |
| `src/data/upgradeCosts.js` | Per-level and per-star costs, per resource. | published cost tables |
| `src/roi.js` | `roi(piece, upgrade, resource)` → Power gained ÷ cost, or `null`. | the three above |
| `scripts/generateGearStats.js` | CSV → `gearStats.js`; fails on duplicate keys / unparsable values. | CSV |
| `scripts/fitPowerModel.js` | `battleReports.json` + `gearStats.js` → `powerModel.js`. Offline; the app ships only weights. | reports, stats |

`computeUpgradePriority` (max-efficiency mode) calls `roi.js`. `heroScore` is
untouched. Role-based and Weakest-link modes are untouched (they use levels only).

## Data coverage

Stats exist densely at 0★ (levels 0–40) and at level 40 for 1★–5★. Gaps as of
2026-09-20: Armor 1★ (no stats), Radar 3★/4★ (partial), Railgun 3★ (empty).
Intermediate levels at 1★–4★ are unknown. The calculator therefore ranks only
what the data supports: level steps at 0★ and star promotions at level 40.
Rows outside coverage show "no data" and sort last; a banner reports the
covered share of the user's gear.

## Power model and fitting

- Power(piece) = Σ weight[stat] × value over CSV stat columns. Special
  Attribute text is ignored and reported as unmodeled.
- `battleReports.json` is hand-transcribed from screenshots: per side, 20 pieces
  (slot, level, stars, border color/quality) plus the gear-total Power. Border
  color (red vs orange) is recorded as-is; its meaning (assumed quality tier)
  is confirmed before it is used as a feature.
- Non-negative least squares over all lineups. Columns that move together
  (e.g. Armor's identical Boost HP / Boost Defense) are reported unidentifiable
  and merged, not given arbitrary values.
- **Quality gate:** the script prints per-lineup residuals and refuses to write
  `powerModel.js` if error exceeds 2% of gear total. If residuals show
  non-linearity, try per-stat exponents or per-slot weights before abandoning
  the approach.
- **Validation:** check fitted deltas against 3–5 upgrades recorded in-game
  (Power before/after).
- Lineups containing a piece with no CSV stats are dropped, not estimated.

## UI

- Section 2 list keeps its shape (`from → to`, reason tag, score); score becomes
  Power per unit of the chosen resource.
- Limiting-resource selector (gold / ore / ceramic / blueprints) at the top of
  the list, persisted in app state.
- Max-efficiency mode uses the new ROI; other modes unchanged.
- Invented gear weights are removed from gear scoring.

## Testing (tests written first)

- `roi.js`: known CSV before/after pairs; `null` on unknown data; resource
  selection; a milestone step (level 9→10) outranks a smooth step.
- Fitter: synthetic data with known weights is recovered; noisy data trips the
  quality gate.
- Generator: fails on duplicate keys and unparsable values.

## Out of scope

Drone ROI (needs its own data; battle reports are the likely source), hero-role
weighting of gear, live-game data extraction.

## Order of work and blockers

1. Copy the CSV into the repo; generate `gearStats.js`.
2. Transcribe reports; fit `powerModel.js`. *Blocked on user transcription.*
3. Source `upgradeCosts.js`. *Can run in parallel with step 2.*
4. Build `roi.js`; wire the UI.

## Open questions

- Does the game show Power on a single piece or on upgrade? (Would give a
  cleaner fit and validation.)
- Do the red and orange gear borders mean UR and Legendary?
