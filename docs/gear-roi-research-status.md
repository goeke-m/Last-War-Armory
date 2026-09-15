# Gear/Drone ROI Calculator — Research Status

**Date:** 2026-09-15
**Status:** Research in progress, no implementation started on this specific effort

## Goal

Replace guesswork with a real ROI ("which upgrade gives the best value") ranking
for hero gear and drone upgrades — something the existing app doesn't actually do
yet, despite looking like it does (see below).

## The existing `computeUpgradePriority` engine is not data-driven

`src/App.jsx`'s Section 2 optimizer (`heroScore`, `gearScore` inputs to
`maxEfficiencyUpgrades` / `weakestLinkUpgrades` / `computeUpgradePriority`) ranks
upgrades using an invented scoring formula, not real game stat curves:

- `rarityWeight`: UR=3, SSR=2, SR=1 — round numbers, no cited source
- `qualityWeight`: Legendary=4, Epic=2, Rare=1, Common=0.5 — same pattern
- `starBonus`: ×1.4 at 4★+, ×1.2 at 3★+ — arbitrary
- `ewBonus`: +15%/EW level — arbitrary
- Gear value scales as `level / 40` — **linear**

Checked both `docs/superpowers/specs/2026-05-18-last-war-optimizer-design.md` and
the implementation plan for any citation or data source backing these numbers —
there is none. Worse, the linear level assumption directly contradicts the UI's
own reason-tags ("4★ breakpoint", "Hits Lv 40 milestone"), which acknowledge the
real curve has spikes the formula doesn't model. **Any "which upgrade next"
recommendation from the current engine should be treated as decorative, not
trustworthy**, until it's rebuilt on real numbers.

## External research: no one has published real stat-gain data

Checked every gear/drone calculator site that turned up in search (Last War
Vault, Last War Handbook, Cpt Hedgehog's Battle HQ, Theria Games, dracgon.tech,
calculator.academy, Packsify, ldshop.gg, lastwartutorial.com, ashmasters.org).
**All of them compute upgrade *cost* (gold/ore/ceramic/blueprints), none publish
absolute stat gain** (Attack/Defense/HP per level or star).

One partial exception: **lastwarhandbook.com/guides/gear-equipment-progression-guide**
has *percentage-of-base* curve data — per-level gain accelerating across three
phases (~5-8%/level early, ~8-12% mid, ~12-15% late) and star-promotion bonuses
as flat jumps (+25% at 1★ up to +150% at 5★). Useful as a rough cross-check on
curve *shape*, not precise enough to drive real numbers — no dataset here beats
directly-measured game values.

## Real datamined data now exists — this is the actual basis to build on

**Location:** `~/Downloads/Last War Data Mining/Last War Equip Data Mining - Sheet1.csv`
(not yet copied into this repo).

**Columns:** Equipment, Level, Stars, Hero Attack, Crit Rate, Hero Defense, Hero
HP, Boost Hero Attack, Boost Hero HP, Boost Hero Defense, Resistance to all
Damage Types, Physical Damage Resistance, Energy Damage Resistance, Special
Attribute.

**Coverage as of 2026-09-15:**

| Equipment | 0★ levels 0–40 | 4★ (lvl 40) | 5★ (lvl 40) | 1★–3★ |
|---|---|---|---|---|
| Armor | ✅ complete | ❌ missing | ✅ | ❌ missing |
| Data Chip | ✅ complete | ✅ | ✅ | ❌ missing |
| Radar | ✅ complete | ❌ missing | ✅ | ❌ missing |
| Railgun | ✅ complete | ❌ missing | ✅ | ❌ missing |

No drone data yet at all — this dataset is hero gear only.

**Data quality:** an earlier pass had internal conflicts (duplicate rows with
mismatched values, a stray "Radar " trailing-space series that disagreed with
the main "Radar" series, a level-40 Armor HP conflict). These have since been
fixed by the user re-checking against source screenshots. The cleaned data is
internally consistent and self-validating: every equipment type shows a
discontinuous stat jump exactly at levels 10/20/30/40, matching the "extra
attributes every 10 levels" mechanic described in published guides — good
independent confirmation the numbers are real, not misremembered.

**Known gap and why it's hard to close:** star promotions (1★–4★, and 4★ for
three of the four pieces) take a long time to earn in-game, so there hasn't been
an opportunity to capture those data points yet. This is an in-progress capture
effort, not a data-quality problem — the plan is to keep adding rows to the same
CSV as those upgrades happen in-game.

## Data-extraction paths tried and set aside

- **lastwar.tools API** — requires a game session token; the tool meant to
  capture that token hasn't worked. Not pursued further for now.
- **`~/Repos/LastWarClient.cs`** — a hand-built client reverse-engineering the
  game's actual binary network protocol (SmartFox2X) from Wireshark captures,
  connecting directly to the live game server to pull hero-power rankings. This
  is a materially bigger risk than the API route (direct, unauthorized use of a
  reverse-engineered protocol against a commercial game's servers is a near-
  certain ToS violation) and should be treated as a dead end, independent of
  whether the official API ever gets working.
- **Manual screenshot capture** (`~/Downloads/Gun`, `Armor`, `Radar`,
  `Data Chip`) — the precursor to the CSV above; superseded by it.

## Another potential data source: in-game battle reports

User has access to in-game battle reports that surface drone stats, team
synergy info, and other combat stats not captured in the gear CSV above. No
sample has been reviewed yet, so it's unknown exactly what fields these expose
or how structured/parseable they are — flagging this here as a known candidate
source for the drone-data gap (and possibly for the squad-synergy side of the
optimizer, not just gear/drone ROI). Revisit once a sample report is available
to inspect.

## Next steps (not yet started)

1. User continues filling 1★–3★ (and remaining 4★) gaps in the CSV as those
   upgrades are reached in-game.
2. Decide the drone data-capture approach (currently zero data) — likely the
   same manual-capture method once gear is far enough along, or in parallel.
   In-game battle reports (see above) may be a source for this once inspected.
3. Once level/star coverage is dense enough, replace `App.jsx`'s invented
   `qualityWeight`/`rarityWeight`/`starBonus` formula with a real lookup-table-
   driven ROI calculation (stat gain per unit of resource cost) sourced from
   this CSV instead of guessed constants.
4. Decide where the CSV should live long-term — currently in `~/Downloads`,
   outside version control.
