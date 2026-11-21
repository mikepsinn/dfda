/**
 * Allowing for dependence: pairs from runs of similar days are not independent,
 * and windows that share days are not independent tests.
 */

/** Most lags of autocorrelation counted for the effective number of pairs. */
const MAX_AUTOCORRELATION_LAG = 60

/**
 * Each series' autocorrelation at lags 1 to maxLag, counted in pairs (in day
 * order), not days, so that a weekly series' runs count as much as a daily
 * one's. The usual estimate, divided by all n pairs, which keeps the noisy far
 * lags small; 0 for a series that does not vary.
 */
function autocorrelations(values: ArrayLike<number>, n: number, maxLag: number): Float64Array {
  let mean = 0
  for (let i = 0; i < n; i++) mean += values[i]
  mean /= n
  let all = 0
  for (let i = 0; i < n; i++) all += (values[i] - mean) ** 2
  const result = new Float64Array(maxLag + 1)
  if (all === 0) return result
  for (let lag = 1; lag <= maxLag; lag++) {
    let sum = 0
    for (let i = 0; i + lag < n; i++) sum += (values[i] - mean) * (values[i + lag] - mean)
    result[lag] = sum / all
  }
  return result
}

/**
 * The effective number of independent pairs (Bartlett 1935; Pyper and Peterman
 * 1998): n / (1 + 2 Σ ρx(k) ρy(k)), over lags up to n / 5. At most n.
 */
export function effectivePairs(xs: ArrayLike<number>, ys: ArrayLike<number>, n: number): number {
  if (n < 3) return n
  const maxLag = Math.min(Math.floor(n / 5), MAX_AUTOCORRELATION_LAG)
  const x = autocorrelations(xs, n, maxLag)
  const y = autocorrelations(ys, n, maxLag)
  let sum = 0
  for (let lag = 1; lag <= maxLag; lag++) sum += x[lag] * y[lag]
  return Math.min(n, n / Math.max(1e-9, 1 + 2 * sum))
}

/** The eigenvalues of a symmetric matrix (Jacobi rotations). */
export function eigenvalues(matrix: number[][]): number[] {
  const n = matrix.length
  const a = matrix.map((row) => [...row])
  for (let sweep = 0; sweep < 100; sweep++) {
    let off = 0
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) off += a[p][q] ** 2
    if (off < 1e-20) break
    for (let p = 0; p < n; p++) {
      for (let q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-300) continue
        const theta = (a[q][q] - a[p][p]) / (2 * a[p][q])
        const t = Math.sign(theta || 1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1))
        const c = 1 / Math.sqrt(t * t + 1)
        const s = t * c
        for (let k = 0; k < n; k++) {
          const kp = a[k][p]
          const kq = a[k][q]
          a[k][p] = c * kp - s * kq
          a[k][q] = s * kp + c * kq
        }
        for (let k = 0; k < n; k++) {
          const pk = a[p][k]
          const qk = a[q][k]
          a[p][k] = c * pk - s * qk
          a[q][k] = s * pk + c * qk
        }
      }
    }
  }
  return a.map((row, i) => row[i])
}

/**
 * The effective number of independent tests among correlated ones, from the
 * eigenvalues of their correlation matrix (Li and Ji 2005): each eigenvalue
 * counts 1 for reaching 1, plus its fractional part.
 */
export function effectiveTests(correlations: number[][]): number {
  if (correlations.length <= 1) return correlations.length
  return eigenvalues(correlations).reduce((total, value) => {
    const v = Math.abs(value)
    return total + (v >= 1 ? 1 : 0) + (v - Math.floor(v))
  }, 0)
}

/** The chance of a p-value this small among m independent tests (Šidák), exact for small p. */
export function sidak(p: number, m: number): number {
  return Math.min(1, -Math.expm1(m * Math.log1p(-Math.min(p, 1 - 1e-16))))
}

/**
 * The effective number of independent pairs from each series' lag-1
 * autocorrelation, treating both as first-order autoregressive (Bretherton et
 * al. 1999): n (1 - ρx ρy) / (1 + ρx ρy). At most n.
 */
export function effectivePairsAr1(xs: ArrayLike<number>, ys: ArrayLike<number>, n: number): number {
  if (n < 3) return n
  const product = autocorrelations(xs, n, 1)[1] * autocorrelations(ys, n, 1)[1]
  return Math.min(n, (n * (1 - product)) / (1 + product))
}

function logGamma(x: number): number {
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]
  let y = x
  const tmp = x + 5.5 - (x + 0.5) * Math.log(x + 5.5)
  let ser = 1.000000000190015
  for (const coefficient of c) ser += coefficient / ++y
  return -tmp + Math.log((2.5066282746310005 * ser) / x)
}

/** The continued fraction of the incomplete beta function (Numerical Recipes betacf). */
function betaFraction(a: number, b: number, x: number): number {
  const tiny = 1e-300
  let c = 1
  let d = 1 - ((a + b) * x) / (a + 1)
  if (Math.abs(d) < tiny) d = tiny
  d = 1 / d
  let h = d
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m
    let aa = (m * (b - m) * x) / ((a - 1 + m2) * (a + m2))
    d = 1 + aa * d
    if (Math.abs(d) < tiny) d = tiny
    c = 1 + aa / c
    if (Math.abs(c) < tiny) c = tiny
    d = 1 / d
    h *= d * c
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + 1 + m2))
    d = 1 + aa * d
    if (Math.abs(d) < tiny) d = tiny
    c = 1 + aa / c
    if (Math.abs(c) < tiny) c = tiny
    d = 1 / d
    const delta = d * c
    h *= delta
    if (Math.abs(delta - 1) < 3e-15) break
  }
  return h
}

/** The regularized incomplete beta function I_x(a, b). */
export function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const front = Math.exp(logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x))
  return x < (a + 1) / (a + b + 2) ? (front * betaFraction(a, b, x)) / a : 1 - (front * betaFraction(b, a, 1 - x)) / b
}

/** The two-sided p-value of a correlation r with `freedom` degrees of freedom (Student's t). */
export function correlationPValue(r: number, freedom: number): number {
  if (freedom <= 0) return 1
  const rr = Math.min(r * r, 1 - 1e-15)
  const t2 = (rr * freedom) / (1 - rr)
  return incompleteBeta(freedom / (freedom + t2), freedom / 2, 0.5)
}
