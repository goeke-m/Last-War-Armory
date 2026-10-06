import { describe, it, expect } from 'vitest'
import { readGearPage } from './gearPage.js'

const ORANGE = [240, 134, 54], RED = [233, 72, 68], BG = [235, 235, 240]
const GOLD = [247, 220, 30], EMPTY = [85, 55, 14], STRIP = [148, 100, 32]

function image(width, height) {
  const data = new Uint8Array(width * height * 4)
  const img = { width, height, data }
  fill(img, 0, 0, width, height, BG)
  return img
}
function fill(img, x0, y0, x1, y1, [r, g, b]) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const i = (y * img.width + x) * 4
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255
  }
}
// A 60×60 tile at (x, y). bar: null for no dot bar, else a string like '●●○○○'.
function tile(img, x, y, color, bar) {
  fill(img, x, y, x + 60, y + 60, color)
  if (bar == null) return
  fill(img, x + 1, y + 47, x + 59, y + 57, STRIP)
  ;[...bar].forEach((c, k) => fill(img, x + 3 + k * 11.6 | 0, y + 48, (x + 3 + k * 11.6 | 0) + 8, y + 56, c === '●' ? GOLD : EMPTY))
}

describe('readGearPage', () => {
  it('reads star bars per side in slot order (left gun/armor/chip/radar, right mirrored)', () => {
    const img = image(600, 100)
    const left = ['●●●○○', null, '○○○○○', '●●●●●']
    const right = ['●○○○○', '●●○○○', '●●●●○', '●●●●●']
    left.forEach((b, i) => tile(img, 10 + i * 66, 20, b === '●●●●●' ? RED : ORANGE, b))
    right.forEach((b, i) => tile(img, 330 + i * 66, 20, b === '●●●●●' ? RED : ORANGE, b))
    const page = readGearPage(img)
    expect(page.left.map(p => p.slot)).toEqual(['gun', 'armor', 'chip', 'radar'])
    expect(page.right.map(p => p.slot)).toEqual(['radar', 'chip', 'armor', 'gun'])
    expect(page.left.map(p => p.starBar)).toEqual(['●●●○○', null, '○○○○○', '●●●●●'])
    expect(page.left.map(p => p.stars)).toEqual([3, 0, 0, 5])
    expect(page.left[1].hasBar).toBe(false)
    expect(page.right.map(p => p.stars)).toEqual([1, 2, 4, 5])
    expect(page.warnings).toEqual(['left: 1 row(s), expected 5', 'right: 1 row(s), expected 5'])
  })

  it('returns no tiles for a page without gear (e.g. the Overview)', () => {
    const page = readGearPage(image(300, 300))
    expect(page.left).toEqual([])
    expect(page.right).toEqual([])
  })
})
