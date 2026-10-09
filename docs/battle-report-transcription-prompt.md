# Battle Report → JSON transcription prompt

Copy the prompt below into a Claude conversation, attach the screenshots, and save the
JSON it returns into `data/raw/battleReports.json` (append the new objects to the existing
array, or send it as a new file and have it merged). The fitter reads that file
(`node scripts/fitPowerModel.js`), see `docs/superpowers/plans/2026-09-20-gear-roi-calculator.md` (Task 4).

> **Prefer the script for stars (2026-10-06).** `node scripts/readGearScreens.js <folder>` reads every
> Gear-page screenshot in a folder and counts each star bar from pixel colours. On the 2026-09-25 batch it
> matched a hand-checked transcription on all 2,196 pieces. It does not read levels (a piece with no star
> bar is below Lv.40; read its level by eye) or text (names, labels, IDs, Power). Use the prompt below for
> those, or for a cross-check. Stars alone never make a lineup fit data: a battle report does not show the
> sub-upgrade step (see `docs/superpowers/specs/2026-09-20-gear-roi-calculator-design.md`, "Sub-upgrades").
> For your own lineups you can add `"sub": 0-4` to each Lv.40 piece after checking it in-game.

## Which screenshots to attach

For **each** battle report, attach two screenshots:

1. The **Overview** page (the first screen): it shows both player names, the
   "Attack Victory" / "Defense Failed" labels, the timestamp and the Battle Report ID at the bottom.
2. The **Gear** page (header reads "Power: X  Gear  Power: X", five heroes per side, four pieces each).

Attach **at most 3 reports (6 screenshots) per conversation**. Keep each report's two screenshots
together and in that order. Larger batches (15 reports per run on 2026-09-25) made the model stop
reading star bars and repeat one pattern across every hero: the same player's build came out
four different ways across four runs, and the fit missed by up to 80%. Several small runs are
better than one big one.

After each run, check that your own lineup matches your actual in-game gear. If your side is
wrong, the enemy sides from that run are wrong too, so discard the run.

## What varies between reports (why this is worth capturing)

- Different opponents give different gear setups. The fit needs many *different* setups; the
  same enemy build repeated adds nothing.
- Mixed star levels and some pieces below level 40 are the most useful.
- Whether you attacked or defended is captured explicitly (`reportType`), so it can be checked
  later whether attack and defense reports behave differently.

---

## The prompt

```
You are transcribing in-game battle report screenshots from the mobile game Last War into JSON.
My in-game player name is "ShadowMohawk" (alliance tag [WPNz]).

I will attach, for each battle report, an Overview screenshot and a Gear screenshot.
Return ONE JSON array and nothing else (no prose, no code commentary outside the JSON, wrap it
in a single ```json block). The array is flat: one object per SIDE, so each report contributes
exactly two objects (mine and the enemy's).

Each object has exactly these fields:

{
  "id": "<battleReportId>-<me|enemy>",
  "battleReportId": "<the number after 'Battle Report ID:' at the bottom of the Overview, as a string>",
  "reportType": "attack" | "defense",
  "owner": "me" | "enemy",
  "playerName": "<player name of this side, without the alliance tag>",
  "result": "victory" | "defeat",
  "date": "<timestamp from the Overview header, ISO style 2026-09-18T22:54:00>",
  "power": <integer, this side's gear-page header Power as a full number>,
  "pieces": [ { "hero": "<hero name>", "slot": "gun"|"chip"|"armor"|"radar", "level": <int>, "starBar": "<see rule 6>", "stars": <int 0-5> } ]
}

Rules:

1. Which side is which. "owner" is "me" for the side whose player name is ShadowMohawk,
   "enemy" for the other. In attack reports I am usually the left (blue) side; in defense
   reports I am usually the right (red) side, but always decide by the player name, not by position.
2. reportType is from MY point of view: "attack" if I was the attacker (the label under my name
   starts with "Attack"), "defense" if I was the defender (the label under my name starts with
   "Defense"). The label under each name is "Attack Victory", "Attack Failed", "Defense Victory"
   or "Defense Failed". "result" is "victory" for a label ending in Victory, "defeat" for
   Failed. Give each side its OWN label's result.
3. power: the "Power: X" printed in the header of the GEAR page for that side. Write the full
   integer: 6.4M -> 6400000, 951.2K -> 951200. Copy exactly what is shown; do not round.
4. pieces: exactly 20 per side (5 heroes x 4 pieces), heroes top to bottom as shown. The
   hero's name is printed above each row of pieces ("Lv.175 Scarlett" -> hero "Scarlett").
   NOTE: the right-hand side is drawn in mirrored order (radar, chip, armor, gun) while
   the left-hand side is (gun, armor, chip, radar). Always decide "slot" from the ICON, never from
   position: gun = Railgun / cannon icon, chip = Data Chip / circuit-board icon,
   armor = chest-plate / vest icon, radar = radar dish icon.
5. level: the "Lv.NN" printed on the piece (0-40).
6. starBar and stars: look at the dot bar under EACH piece separately and write what you see in
   "starBar", one character per dot, left to right: "●" for a filled gold dot, "○" for an empty or
   dark dot, e.g. "●●●○○". If the piece has no dot bar at all, write "". "stars" is the number
   of "●" in starBar. Never copy a starBar from another piece, hero or report: re-read every one.
   Stars can only exist at level 40; a piece below Lv.40 has stars 0 (if you see filled dots
   on a piece below 40, mark it uncertain).
   Border colour is a cross-check only, never a reason to change what you counted: red border
   usually means 5 stars, orange means 0-4. If the border and your count disagree, keep the
   count you actually see and add "uncertain": true.
7. Never guess. If a value is not legible, still give your best reading but add
   "uncertain": true to that piece object and I will check it. Flagging pieces is expected and
   useful; zero flags across many reports is suspicious. If a whole report's Gear page is
   missing or unreadable, do not include that report; instead list it in a final short
   "Skipped reports:" line AFTER the JSON block.
8. Self-consistency: my own gear does not change between reports taken minutes apart, and the
   same enemy name with the same Power normally has the same gear. If two of your readings of
   the same player at the same Power differ, go back to both screenshots and re-read; if they
   still differ, keep what each screenshot shows and mark the differing pieces uncertain.
9. Before answering, verify: every side has exactly 20 pieces; every slot is one of the four
   values; every stars value equals the count of "●" in its starBar; no piece below Lv.40 has
   stars; "date" is filled for every side; both sides of a
   report share the same battleReportId and reportType-from-my-view is consistent
   (my side's label starts with Attack -> "attack", else "defense"; the enemy side of an attack
   report has an owner of "enemy" but the same reportType "attack").
10. Keep the output to the JSON block plus the optional "Skipped reports:" line. Do not summarise
   the battles.
```

---

## How the project uses the file

- `scripts/fitPowerModel.js` reads `id`, `power` and `pieces[].slot/level/stars`. The other fields
  (`battleReportId`, `reportType`, `owner`, `playerName`, `result`, `date`, `hero`, `starBar`, `uncertain`)
  are carried for checking and dedupe: the same `battleReportId` twice is a duplicate report;
  repeated *builds* across reports do not add information to the fit.
- Sides containing a piece state that is not in `data/raw/gear-stats.csv` are dropped from the fit
  (the script prints which piece). Filling in those CSV rows brings the side back.
- Any piece with `"uncertain": true` should be checked against the screenshot before fitting.
