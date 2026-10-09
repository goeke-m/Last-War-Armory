# Battle report gear transcription notes (unverified draft)

Source: /home/shadowmohawk/Downloads/Last War Data Mining/Battle Report/ (Gear page of each report, viewed at 3x zoom).
All 7 reports had a Gear page; none skipped. Right-side pieces are listed in on-screen order, which is mirrored
(radar, chip, armor, gun); left-side order is (gun, armor, chip, radar). `slot` reflects the icon either way.
In the Defense reports the left (blue) side is the enemy attacker (Durden); the user (ShadowMohawk) is on the right.

## Pieces with an assumption (not truly uncertain, but worth a glance)
- attack4-right (Battle Report (Attack) 4, screenshot 140626): pieces with Lv.10 / Lv.30 show NO star bar at all.
  Recorded stars 0. Affected: Hero 1 pieces 1-4, Hero 2 pieces 1-4, Hero 4 pieces 1 and 3, Hero 5 pieces 1 and 3
  (12 pieces). Levels there are 30/10/30/10 (H1, H2) and 10 (radar/armor for H4, H5).

## Otherwise
No pieces with hard-to-count stars, ambiguous icons or unreadable levels; every star bar was clearly legible at 3x.
Red-border consistency check: every red-bordered piece has 5 stars.
Note: attack1 both sides read 6.4M; attack1-left has a different build than attack2/3/4-left (2.9M) - transcribed as shown.
Right sides of attack1, attack2 and defense1/2/3 (6.4M) are the same enemy build (attack1/2 identical to each other;
defense1/2/3 identical to each other).

# 2026-09-25 batch (55 reports, verified)

Source: `~/Downloads/Last War Data Mining/Battle Report/New folder/` (110 screenshots, Overview + Gear per report).
Claude-chat transcriptions of these (`Battle Data 1-4.json`) were discarded: the same player's
build came out differently in each file and 10 reports were missing.

## How it was read
- Stars were counted from pixels, not by eye (now `scripts/readGearScreens.js`): every dot on every tile was measured
  (filled dot = bright gold, empty = dark brown). Readings were bimodal (≤10% vs ≥70% gold), with no
  ambiguous dots. Slot order was checked by icon matching (left gun/armor/chip/radar, right mirrored):
  0 mismatches.
- Only Lv.40 pieces have a dot bar. The 121 pieces with no bar were read by eye (Lv.0–20) and have 0 stars.
- The same detector re-checked the 7 reports from 2026-09-18 above: all 14 sides match.
- Names, Attack/Defense labels, Battle Report IDs and gear-page Power were read by eye.
- Self-consistency: all 28 player/Power combinations (including my 6.4M, 2.9M and 1.5M lineups
  across 55 reports) have exactly one build.

## Fields
- `date` is null: the battle timestamp is cropped out of these screenshots. `capturedAt` is the
  screenshot time. `screenshots` names the Overview/Gear files. `hero` was not transcribed.
- `battleReports.json` gets each distinct (power, pieces) lineup once (24 new sides); the full 110-side
  transcription is in `battleReports.2026-09-25.full.json`.
- Left out: 1420011371824889328-enemy (Player 8, 2.4M) has only 4 heroes (16 pieces); the fitter requires 20.

## Findings
- My 2.9M squad had Murphy's gun at Lv.20 (no bar) on 09-25; on 09-18 it was Lv.40.
- Identical-looking gear does not give identical Power: 20× Lv.40 0★ reads 2.9M (me), 3.0M (Player 2)
  and 3.3M (Player 3). Explanation (user, 2026-09-27): every star tier has 4 hidden sub-upgrades
  (a 4-segment progress bar on the piece's own upgrade screen). The battle report shows only the star
  count, never the sub-progress, and `gear-stats.csv` records each tier after its 4th sub-upgrade (the
  top of the tier). So a battle-report side only bounds its stats: somewhere between the tier's floor
  and its top. Only lineups whose sub-progress is known (my own, checked piece by piece) are exact.

# 2026-10-06: per-piece Power and CSV corrections

Source: `~/Desktop/Photos-1-001/` (24 screenshots): Gear Details for all 20 pieces of the 6.4M lineup
(each shows the piece's own Power) and the upgrade screen of 0★ sub-0 gun, chip, armor and radar.
Recorded in `piecePower.json`; how each piece's sub step was determined is in its `subFrom`.
The lineup has changed since 2026-09-25 (e.g. Murphy and Marshall armor 2★ → 3★).

`gear-stats.csv` changes (copy into the source spreadsheet):
- `Armor,40,3` was 529 / 319719 / 12% (matches no screen). Now 3★ sub 4 = 532 / 405739 / 13% / 13% / 30%
  (Murphy), plus a `Sub 0` row 449 / 361719 / 12% / 12% / 30% (Marshall).
- `Radar,40,3` was boosts 14.5% with no Defense/HP. Now 1665 / 167843 / 13% / 13% / 30% energy (Marshall).
- New sub rows: 0★ sub 1 for Armor, Data Chip, Radar (upgrade previews); 0★ sub 4 for Railgun and Data Chip.
- Not changed, worth checking: `Radar,40,4` boosts 15.00% equal 5★ (armor 4★ is 14.50%, so the radar 3★/4★
  boosts may have been shifted one tier); 0★ Railgun/Radar Defense 359/559 vs 358/558 on screen.

# 2026-10-06: promote previews

Source: `~/Desktop/Photos-1-001 (1).zip` (8 upgrade screens). Added to `gear-stats.csv` as `Sub 0` rows (the stats
right after promotion, extra attributes included): Railgun 1★ and 3★, Data Chip 1★ and 4★, Armor 4★, Radar 4★;
plus Armor 3★ sub 1. `Radar,40,4` boosts corrected 15.00% → 14.50% (4★ sub 0 is 13.50%, + 4 × 0.25%).
Every preview's cost matched `upgradeCosts.stepSplit`. In-game sub values are floored (3★ Armor sub 1 Defense
469 vs 469.75 by linear interpolation; < 1 Power).
