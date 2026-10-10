import { nextStep } from './roi.js'

// How far along a piece is: its level, then 5 per star and 1 per sub-upgrade step. At end game every
// piece is Lv 40, so stars and sub steps are what tell pieces apart (Lv 40 0★ sub 4 = 44 < 1★ sub 0 = 45).
export function progressOf(piece) {
  if (!piece) return 0
  return piece.level + (piece.stars ?? 0) * 5 + (piece.sub ?? 0)
}

// An upgrade-list item for the piece's real next step, or null when the piece is maxed.
function stepItem(heroId, slot, piece, reason, score) {
  const step = nextStep(piece)
  if (!step) return null
  return { type: step.type, slot, heroId, from: step.from, to: step.to, stars: piece.stars, blueprintWarning: step.type === 'stars', reason, score }
}

// The slot that should lead for each role, and the slots it should stay ahead of.
const LEADS = {
  dps:     { lead: 'gun',   over: ['armor'],                 name: 'Gun',   role: 'DPS' },
  tank:    { lead: 'armor', over: ['gun'],                   name: 'Armor', role: 'tank' },
  support: { lead: 'radar', over: ['gun', 'chip', 'armor'],  name: 'Radar', role: 'support' },
}
const SLOT_LABEL = { gun: 'Gun', armor: 'Armor', chip: 'Chip', radar: 'Radar' }

// assigned: { [heroId]: { [slot]: piece|null } }; roleOf(heroId) → 'dps' | 'tank' | 'support'
export function roleBasedUpgrades(assigned, roleOf) {
  const items = []
  for (const [heroId, slots] of Object.entries(assigned)) {
    const rule = LEADS[roleOf(heroId)]
    if (!rule) continue
    const lead = slots[rule.lead]
    if (lead) {
      const ahead = rule.over.filter(s => progressOf(slots[s]) > progressOf(lead))
      if (ahead.length) {
        const gap = Math.max(...ahead.map(s => progressOf(slots[s]))) - progressOf(lead)
        items.push(stepItem(heroId, rule.lead, lead, `${rule.name} should lead on a ${rule.role} hero but trails ${ahead.map(s => SLOT_LABEL[s]).join(' and ')}`, gap))
      }
    }
    // A DPS hero's Chip backs up the Gun, so it shouldn't fall behind it either.
    if (rule.lead === 'gun' && slots.chip && lead && progressOf(slots.chip) < progressOf(lead)) {
      items.push(stepItem(heroId, 'chip', slots.chip, 'Chip trails Gun on a DPS hero', progressOf(lead) - progressOf(slots.chip)))
    }
  }
  return items.filter(Boolean).sort((a, b) => b.score - a.score)
}

// The squad's least-upgraded pieces first, up to 10, skipping maxed ones.
export function weakestLinkUpgrades(assigned) {
  const all = []
  for (const [heroId, slots] of Object.entries(assigned)) {
    for (const [slot, piece] of Object.entries(slots)) {
      if (piece && nextStep(piece)) all.push({ heroId, slot, piece, p: progressOf(piece) })
    }
  }
  if (all.length === 0) return []
  const avg = all.reduce((s, x) => s + x.p, 0) / all.length
  return all
    .sort((a, b) => a.p - b.p)
    .slice(0, 10)
    .map(x => stepItem(x.heroId, x.slot, x.piece, x.p < avg ? 'Below the squad’s average' : 'Weakest left in the squad', avg - x.p))
}
