// Reads the gear tiles of a battle report's Gear page screenshot: which pieces have a star bar
// (only level-40 pieces do) and how many of its 5 dots are filled (gold vs dark brown).
// Levels are not read: a piece without a bar is below level 40 and its level must be read by eye.
// img: { width, height, data } with RGBA bytes (a decoded PNG).

const LEFT = ['gun', 'armor', 'chip', 'radar']
const RIGHT = ['radar', 'chip', 'armor', 'gun']

const isTile = (r, g, b) => (r > 200 && g < 110 && b < 110) || (r > 215 && g > 105 && g < 175 && b < 90)
const isGold = (r, g, b) => r > 190 && g > 150 && b < 140
const isDark = (r, g, b) => r > 50 && r < 110 && g < 80 && b < 40

// 4-connected dilation (grow) or erosion (shrink) of a 0/1 mask.
function morph(mask, w, h, grow) {
  const out = new Uint8Array(mask.length)
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x
    const n = [mask[i], x > 0 ? mask[i - 1] : 0, x < w - 1 ? mask[i + 1] : 0, y > 0 ? mask[i - w] : 0, y < h - 1 ? mask[i + w] : 0]
    out[i] = grow ? +n.some(Boolean) : +n.every(Boolean)
  }
  return out
}

// Bounding boxes [y0, y1, x0, x1) of tile-coloured blobs the size of a gear tile.
function findTiles({ width: w, height: h, data }) {
  let mask = new Uint8Array(w * h)
  for (let i = 0; i < w * h; i++) mask[i] = +isTile(data[i * 4], data[i * 4 + 1], data[i * 4 + 2])
  for (let k = 0; k < 2; k++) mask = morph(mask, w, h, true)
  for (let k = 0; k < 2; k++) mask = morph(mask, w, h, false)
  const seen = new Uint8Array(w * h), boxes = []
  for (let start = 0; start < w * h; start++) {
    if (!mask[start] || seen[start]) continue
    let y0 = h, y1 = 0, x0 = w, x1 = 0
    const stack = [start]
    seen[start] = 1
    while (stack.length) {
      const i = stack.pop(), x = i % w, y = (i - x) / w
      y0 = Math.min(y0, y); y1 = Math.max(y1, y + 1); x0 = Math.min(x0, x); x1 = Math.max(x1, x + 1)
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
        if (j >= 0 && mask[j] && !seen[j]) { seen[j] = 1; stack.push(j) }
      }
    }
    const bw = x1 - x0, bh = y1 - y0
    if (bw >= 52 && bw <= 80 && bh >= 52 && bh <= 80) boxes.push([y0, y1, x0, x1])
  }
  return boxes
}

// The dot bar sits along the bottom of the tile, from 21% to 5% of its height above the bottom edge.
function strip([y0, y1, x0, x1], inset) {
  const h = y1 - y0
  return { ys: y1 - Math.round(h * 0.21), ye: y1 - Math.round(h * 0.05), xs: x0 + inset, xe: x1 - inset }
}

function readTile(img, box) {
  const px = (x, y) => { const i = (y * img.width + x) * 4; return [img.data[i], img.data[i + 1], img.data[i + 2]] }
  const b = strip(box, 3)
  let barPx = 0, total = 0
  for (let y = b.ys; y < b.ye; y++) for (let x = b.xs; x < b.xe; x++) { total++; if (px(x, y)[0] < 180) barPx++ }
  if (barPx / total < 0.3) return { hasBar: false, starBar: null, stars: 0 }

  const d = strip(box, 1), width = d.xe - d.xs
  let starBar = '', start = d.xs
  for (let k = 0; k < 5; k++) {
    const end = start + Math.floor(width / 5) + (k < width % 5 ? 1 : 0)
    let gold = 0, dark = 0
    for (let y = d.ys; y < d.ye; y++) for (let x = start; x < end; x++) {
      const p = px(x, y)
      if (isGold(...p)) gold++
      else if (isDark(...p)) dark++
    }
    starBar += gold + dark >= 8 && gold / (gold + dark) >= 0.5 ? '●' : '○'
    start = end
  }
  return { hasBar: true, starBar, stars: [...starBar].filter(c => c === '●').length }
}

export function readGearPage(img) {
  const boxes = findTiles(img).sort((a, b) => a[0] - b[0])
  const rows = []
  for (const box of boxes) {
    const row = rows.at(-1)
    if (row && Math.abs(row[0][0] - box[0]) < 20) row.push(box)
    else rows.push([box])
  }
  const mid = img.width / 2
  const page = { left: [], right: [], warnings: [] }
  for (const [side, order] of [['left', LEFT], ['right', RIGHT]]) {
    let rowCount = 0
    rows.forEach((row, r) => {
      const tiles = row.filter(b => side === 'left' ? b[3] < mid : b[2] > mid).sort((a, b) => a[2] - b[2])
      if (!tiles.length) return
      rowCount++
      if (tiles.length !== 4) page.warnings.push(`${side} row ${r}: ${tiles.length} tiles, expected 4`)
      tiles.forEach((box, i) => page[side].push({ row: r, slot: tiles.length === 4 ? order[i] : null, ...readTile(img, box) }))
    })
    if (rowCount && rowCount !== 5) page.warnings.push(`${side}: ${rowCount} row(s), expected 5`)
  }
  return page
}
