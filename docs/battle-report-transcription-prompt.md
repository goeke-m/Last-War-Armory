# Battle Report → JSON transcription prompt

Copy the prompt below into a Claude conversation, attach the screenshots, and save the
JSON it returns into `data/raw/battleReports.json` (append the new objects to the existing
array, or send it as a new file and have it merged). The fitter reads that file
(`node scripts/fitPowerModel.js`), see `docs/superpowers/plans/2026-09-20-gear-roi-calculator.md` (Task 4).

## Which screenshots to attach

For **each** battle report, attach two screenshots:

1. The **Overview** page (the first screen): it shows both player names, the
   "Attack Victory" / "Defense Failed" labels, the timestamp and the Battle Report ID at the bottom.
2. The **Gear** page (header reads "Power: X  Gear  Power: X", five heroes per side, four pieces each).

Attach several reports at once if you like. Keep each report's two screenshots together and
in that order.

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
  "pieces": [ { "hero": "<hero name>", "slot": "gun"|"chip"|"armor"|"radar", "level": <int>, "stars": <int 0-5> } ]
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
6. stars: the number of FILLED gold dots/stars under the piece (0-5). Empty or dark dots do not
   count. Pieces with no dot bar at all have 0 stars. A red-bordered piece is a 5-star piece
   (mythic); an orange-bordered piece has 0-4 stars. Use this as a consistency check: a red
   border with fewer than 5 stars means you miscounted, look again.
7. Never guess. If a value is not legible, still give your best reading but add
   "uncertain": true to that piece object and I will check it. If a whole report's Gear page is
   missing or unreadable, do not include that report; instead list it in a final short
   "Skipped reports:" line AFTER the JSON block.
8. Before answering, verify: every side has exactly 20 pieces; every slot is one of the four
   values; every stars value is an integer 0-5; every red-border piece has stars 5; both sides of a
   report share the same battleReportId and reportType-from-my-view is consistent
   (my side's label starts with Attack -> "attack", else "defense"; the enemy side of an attack
   report has an owner of "enemy" but the same reportType "attack").
9. Keep the output to the JSON block plus the optional "Skipped reports:" line. Do not summarise
   the battles.
```

---

## How the project uses the file

- `scripts/fitPowerModel.js` reads `id`, `power` and `pieces[].slot/level/stars`. The other fields
  (`battleReportId`, `reportType`, `owner`, `playerName`, `result`, `date`, `hero`, `uncertain`)
  are carried for checking and dedupe: the same `battleReportId` twice is a duplicate report;
  repeated *builds* across reports do not add information to the fit.
- Sides containing a piece state that is not in `data/raw/gear-stats.csv` are dropped from the fit
  (the script prints which piece). Filling in those CSV rows brings the side back.
- Any piece with `"uncertain": true` should be checked against the screenshot before fitting.
