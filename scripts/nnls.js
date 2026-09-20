// Non-negative least squares by cyclic coordinate descent on unit-normalised columns.
export function nnls(A, y, maxSweeps = 200000, tol = 1e-13) {
  const m = A.length
  const n = A[0].length
  const norms = Array.from({ length: n }, (_, j) => Math.sqrt(A.reduce((s, r) => s + r[j] * r[j], 0)))
  const B = A.map(r => r.map((v, j) => (norms[j] > 0 ? v / norms[j] : 0)))
  const w = new Array(n).fill(0)
  const r = y.slice()
  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let maxStep = 0
    for (let j = 0; j < n; j++) {
      if (norms[j] === 0) continue
      let g = 0
      for (let i = 0; i < m; i++) g += B[i][j] * r[i]
      const next = Math.max(0, w[j] + g)
      const d = next - w[j]
      if (d !== 0) {
        for (let i = 0; i < m; i++) r[i] -= B[i][j] * d
        w[j] = next
        maxStep = Math.max(maxStep, Math.abs(d))
      }
    }
    if (maxStep < tol) break
  }
  return w.map((v, j) => (norms[j] > 0 ? v / norms[j] : 0))
}
