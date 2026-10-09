# Gear ROI Calculator — Design

**Date:** 2026-09-20
**Status:** Approved in conversation; pending written-spec review. Revised 2026-10-06 for sub-upgrades (below).
**Background:** `docs/gear-roi-research-status.md`

## Goal

Replace the invented gear-upgrade scoring in `src/App.jsx` (`pieceScore`,
`qualityWeight`, `rarityWeight`, `starBonus`, linear `level / 40`) with an ROI
ranking built on real data: **in-game Power gained per unit of a chosen limiting
resource.**

## Decisions

- **Return metric:** in-game Power delta per upgrade.
- **Power source:** Power-per-stat weights are fitted only from data whose
  stats are known exactly (see "Sub-upgrades"): in-game power checks (Power
  before/after one upgrade) and lineups whose every level-40 piece has a known
  sub-upgrade step. Battle-report sides of other players are kept for
  cross-checking but are not fit data.
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

## Sub-upgrades (added 2026-10-06)

Every star tier, 0★ included, has 4 sub-upgrades (a 4-segment progress bar on the
piece's own upgrade screen; user-confirmed). A level-40 piece's state is therefore
(stars, sub) with sub 0–4; sub-upgrades and promotions only exist at level 40.

- Order: (s, 0) → (s, 1) → … → (s, 4) → promote → (s+1, 0).
- `gear-stats.csv` has a `Sub` column (after `Stars`). A blank Sub at level 40
  means how the sheet was recorded: **0★ is sub 0** (just reached level 40;
  confirmed 2026-10-06 against a 0★ Railgun upgrade screen: base 2687 attack +
  2 × 250 extra = the CSV's 3187), **1★–5★ are sub 4**, the top of the tier
  (confirmed against a 2★ Armor promote screen: 216531 base HP + 63000 + 21000
  extra = the CSV's 300531). Keys always carry the step at level 40:
  `40:stars:sub`. Extra attributes count toward the totals even while their
  hexagon is dark. The upgrade screen previews the next step's stats, so sub
  rows can be recorded without spending.
- Step costs (2026-10-06, two screenshots): each of the 4 sub-upgrades of tier
  s−1 costs gold stars[s]/4, ore stars[s]/5 and ceramic stars[s]/5; the
  promotion into s costs ore stars[s]/5, ceramic stars[s]/5 and the blueprints,
  and no gold (0★ Railgun sub step: 23.4M / 12.5K / 150 = 93.6M/4, 62.5K/5,
  750/5; 2★→3★ Armor promotion: 20.0K ore, 240 ceramic, 15 blueprints, no gold).
  Verified on those two tiers only.
- Battle reports show only the star count, never sub progress. A side of
  another player is therefore a range (between the tier's floor and its top)
  and cannot be fitted exactly. This is why identical-looking 20× Lv.40 0★
  lineups read 2.9M, 3.0M and 3.3M on 2026-09-25.
- Lineup pieces carry an optional `sub`. A lineup is exact (fit data) only if
  every level-40 piece has `sub`. The user can annotate their own lineups by
  checking each piece in-game.
- **Power checks** (`data/raw/powerChecks.json`) are the primary fit data:
  `{ id, slot, from: {level, stars, sub}, to: {level, stars, sub}, powerBefore,
  powerAfter }`, one upgrade each. Each is one exact equation:
  stats(to) − stats(from) against powerAfter − powerBefore. Power is read where
  the game shows it as a full integer (the hero's Power on the hero screen),
  not the rounded gear-page total.
- The ROI unit is one step: a level, a sub-upgrade, or a promotion.
  `upgradeCosts.json` stores whole-star totals; per-step costs follow from the
  split above (or from Cpt Hedgehog's sub-tier arrays: tier 1–4 of star s =
  sub-upgrades of s, tier 0 of s = promotion into s).

## Data coverage

Star promotions only unlock at level 40 (user-confirmed), so the full state space
is 0★ at levels 0–40 plus level 40 at 1★–5★. Stats exist for all of 0★ and for
most level-40 star rows. Gaps as of 2026-09-20: 1★ blank for Armor, Data Chip and
Radar; Radar 3★/4★ missing Hero Defense/HP; Railgun 3★ missing Attack/Crit/Defense.
Once those six rows are filled the CSV is complete. Until then the calculator
ranks only what the data supports; rows outside coverage show "no data" and sort
last, and a banner reports the covered share of the user's gear. A star
promotion is only offered for a piece already at max level.

## Power model and fitting

- Power(piece) = Σ weight[stat] × value over CSV stat columns. Special
  Attribute text is ignored and reported as unmodeled.
- `battleReports.json` is hand-transcribed from screenshots: per side, 20 pieces
  (slot, level, stars) plus the gear-total Power. Border color is not recorded:
  the user confirmed it only encodes stars (orange = gold gear below 5★, red =
  5★ "mythic"), so stars already carry it.
- Non-negative least squares over all exact rows (piece Powers, power checks and
  exact lineups), on relative error (each row scaled by its target) to match the
  gate. The 2×-unknowns minimum counts distinct rows only. Columns that move together
  (e.g. Armor's identical Boost HP / Boost Defense) are reported unidentifiable
  and merged, not given arbitrary values.
- **Quality gate:** the script prints per-lineup residuals and refuses to write
  `powerModel.js` if error exceeds 2% of gear total. If residuals show
  non-linearity, try per-stat exponents or per-slot weights before abandoning
  the approach.
- **Validation:** battle-report sides of other players must fall inside the
  range their star tiers allow; power checks held out from the fit must match.
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

- Resolved 2026-10-06: yes. A piece's **Gear Details** screen shows its own
  Power (e.g. 344410 for a 5★ M6-A cannon). The same piece state shows the
  same Power on every hero. These are now the primary fit data
  (`data/raw/piecePower.json`: hero, slot, level, stars, sub, power, screenshot).
  Fitted 2026-10-06 from 41 pieces (20 distinct exact rows incl. two low-level
  battle-report lineups, 9 unknowns): **max residual 0.03%**. Weights per point:
  attack 12.51, defense 34.89, HP 0.500; per 100%: crit 313,505, all-damage
  resistance 1,048,599, physical 524,583 and energy 524,979 (each half of
  all-damage), boost attack 1,158 and boost HP/defense 922 (negligible). Each
  piece's recorded `stats` (read off the same screen as its Power) are used over
  the table. 5★ pieces sit above the model by about 15.7K (gun), 23.5K (armor)
  and 23.6K (radar), the Power of their special attribute.
- Resolved 2026-10-06: 5★ has no sub-upgrades. The 5★ row is sub 0, the state a
  4★ sub-4 piece is promoted into; a Sub of 1–4 at 5★ is rejected.
- Resolved 2026-10-06: 0★ has 4 sub-upgrades too.
- 5★ pieces carry a special attribute (e.g. "10% Damage Boost when Countering
  Enemies") whose Power the stat columns miss: 5★ pieces read 2–3% above a
  stats-only fit. Rows with a 5★ piece are left out of the fit until it is
  modeled (likely one weight per slot).
- Resolved 2026-09-20: red/orange borders are just the star tier (orange = gold below 5★,
  red = 5★ mythic), not a quality tier. No border field or filter is used.
