export function mean(values: ArrayLike<number>, length = values.length): number {
  let total = 0
  for (let i = 0; i < length; i++) total += values[i]
  return total / length
}

/**
 * Pearson's correlation of the first `length` values of xs and ys, or null when
 * either does not vary. Computed from the deviations from the means, so that
 * large values with a small spread keep their precision.
 */
export function pearson(xs: ArrayLike<number>, ys: ArrayLike<number>, length = Math.min(xs.length, ys.length)): number | null {
  if (length < 2) return null
  const meanX = mean(xs, length)
  const meanY = mean(ys, length)
  let xx = 0
  let yy = 0
  let xy = 0
  for (let i = 0; i < length; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    xx += dx * dx
    yy += dy * dy
    xy += dx * dy
  }
  // No spread, or one this small relative to the values, is rounding, not variation.
  if (xx <= 1e-20 * length * meanX * meanX || yy <= 1e-20 * length * meanY * meanY) return null
  return Math.max(-1, Math.min(1, xy / Math.sqrt(xx * yy)))
}

/**
 * The first `length` values less their straight-line trend over the days,
 * from least squares, or null when nothing is left but rounding: the values
 * were constant or lay on a line.
 */
export function detrended(values: ArrayLike<number>, days: ArrayLike<number>, length: number): Float64Array | null {
  if (length < 3) return null
  const meanDay = mean(days, length)
  const meanValue = mean(values, length)
  let dd = 0
  let dv = 0
  let vv = 0
  for (let i = 0; i < length; i++) {
    const d = days[i] - meanDay
    const v = values[i] - meanValue
    dd += d * d
    dv += d * v
    vv += v * v
  }
  const slope = dd === 0 ? 0 : dv / dd
  const residuals = new Float64Array(length)
  let left = 0
  for (let i = 0; i < length; i++) {
    residuals[i] = values[i] - meanValue - slope * (days[i] - meanDay)
    left += residuals[i] * residuals[i]
  }
  return left <= 1e-12 * vv || vv === 0 ? null : residuals
}
