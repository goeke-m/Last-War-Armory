# Last War Armory

A mobile-first community tool for Last War Survival players. Enter your hero roster and gear, and get a recommended squad, gear loadout and upgrade priority list.

**Use it:** https://goeke-m.github.io/Last-War-Armory/ (beta: Gold gear only; skills, hero level and code battles aren’t counted yet).

## What It Does

Solves three problems in sequence:

1. **Squad Selection** — scores every valid 5-hero combination from your owned heroes and recommends the highest-scoring squad for your chosen goal, with per-slot alternates shown
2. **Gear Assignment** — assigns your gear inventory optimally across the squad using role priority (DPS: Gun → Chip → Radar → Armor; Tank: Armor → Radar → ...; Support: Radar → ...). Best heroes pick first.
3. **Upgrade Priority** — ranks every possible next upgrade across all assigned gear in three modes: Max Efficiency, Role-Based, and Weakest Link

Gear is never locked to a hero. The optimizer re-solves the full assignment every time your squad or goal changes. Moving gear between heroes costs a small gold fee in-game but is always worth it when the optimizer recommends it.

## Features

- **Roster Manager** — all 26 heroes (UR/SSR/SR). Toggle owned, set stars/level/skill levels/EW level. Season-gated UR promotions (Mason→S1, Violet→S2, Scarlett→S3, Venom→S4) auto-detected.
- **Gear Inventory** — flat list, no hero association. Add/edit/delete pieces with slot, quality, level (0–40), and stars (0–5). Segmented level bars show milestone proximity.
- **Goal Selector** — season (1–6), optimization goal (PvP Rally / World Boss / Code Battles / Balanced), squad intent (Mono / Hybrid In Progress / Full Hybrid). Hybrid warning fires if no hero has EW 5+.
- **Squad Optimizer** — front/back row formation display, per-hero gear summary, alternate hero chips with score delta.
- **Upgrade Priority** — three modes with reason tags ("Hits Lv 40 milestone", "4★ breakpoint", "Role misalignment", "Weakest link"). Blueprint cost warnings on star promotions.
- **Recommendation Panel** — always-visible bottom panel with Loadout / Upgrades / Warnings tabs. Danger count badge on Warnings tab.
- **Profile Management** — named profiles saved to localStorage. Create, rename, duplicate, delete. Export any profile as JSON to share with alliance members; import a shared JSON string to load it.

## Scoring Model

**Hero effectiveness score:**
```
base = rarityWeight × (stars / 5) × avgSkillLevel
rarityWeight: UR = 3, SSR = 2, SR = 1 (promoted SSRs treated as UR)
starBonus: ≥4★ → ×1.4, ≥3★ → ×1.2
ewBonus: UR/promoted only → ×(1 + ewLevel × 0.15)
goalMod: per-hero multiplier based on selected goal
```

**Squad score:**
```
sum(heroScores) × monoBonus(+25%) × hybridPenalty(-20% if no EW5+) × dpsPenalty(×0.6 if no DPS)
```

**Gear piece score:**
```
qualityWeight × (level / 40) × (1 + stars × 0.2)
qualityWeight: Legendary = 4, Epic = 2, Rare = 1, Common = 0.5
```

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

**Recommended first steps:**
1. Set your current **Season** in the Goal tab
2. Toggle which heroes you own in the **Roster** tab and fill in their stats
3. Add your **Gear** pieces in the Gear tab
4. Check the **Squad** tab for your recommended formation and loadout
5. Use the bottom panel's **Upgrades** tab for prioritized next steps

## Deploy

```bash
npm run build
```

Outputs a static site to `dist/` — deploy to Vercel, Netlify, GitHub Pages, or any static host. No server required; all data stays in the browser.

## Tech Stack

- React 18 + Vite
- Tailwind CSS v3
- Orbitron + Rajdhani fonts (Google Fonts)
- localStorage for persistence — no account, no server, no tracking

## Hero Roster

| Rarity | Heroes |
|--------|--------|
| UR | Kimberly, DVA, Williams, Murphy, Marshall, Tesla, Morrison |
| SSR | Mason (→UR S1), Violet (→UR S2), Scarlett (→UR S3), Venom (→UR S4), Schuyler, Fiona, Sarah, Lucius, Carlie, Stetmann, McGregor, Adam, Swift, Richard, Elsa, Maxwell |
| SR | Drake, Kane, Ambolt |
