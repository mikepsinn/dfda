import { describe, expect, it } from 'vitest'
import { correlationPValue, effectivePairs, effectivePairsAr1, effectiveTests, eigenvalues, sidak } from '../src/dependence'

describe('correlationPValue', () => {
  it("matches Student's t where it has a closed form", () => {
    // One degree of freedom (Cauchy): r = 0.5 gives t = 1/√3, so p = 1 - (2/π)·atan(1/√3) = 2/3.
    expect(correlationPValue(0.5, 1)).toBeCloseTo(2 / 3, 10)
    // Two: p = 1 - t/√(2 + t²), which is 1/2 for r = 0.5.
    expect(correlationPValue(0.5, 2)).toBeCloseTo(0.5, 10)
    expect(correlationPValue(-0.5, 2)).toBeCloseTo(0.5, 10)
    // Ten: t = 1.8257, between the tabled 1.812 (p = 0.10) and 2.228 (p = 0.05).
    expect(correlationPValue(0.5, 10)).toBeGreaterThan(0.08)
    expect(correlationPValue(0.5, 10)).toBeLessThan(0.1)
    expect(correlationPValue(0, 10)).toBeCloseTo(1, 10)
    expect(correlationPValue(0.9, 0)).toBe(1)
  })
})

describe('effectivePairs', () => {
  const days = Array.from({ length: 200 }, (_, i) => i)

  it('counts unrelated days as nearly all independent, and runs of similar days as fewer', () => {
    // Alternating values have no runs; slow waves have long ones.
    const alternating = days.map((d) => (d % 2 ? 1 : -1) + Math.sin(d * 1.7))
    const other = days.map((d) => Math.cos(d * 2.3))
    expect(effectivePairs(alternating, other, 200)).toBeGreaterThan(150)
    const slow = days.map((d) => Math.sin(d / 15))
    const slowToo = days.map((d) => Math.cos(d / 12))
    expect(effectivePairs(slow, slowToo, 200)).toBeLessThan(40)
    expect(effectivePairsAr1(slow, slowToo, 200)).toBeLessThan(40)
  })
})

describe('effectiveTests', () => {
  it('counts unrelated tests fully and identical ones once', () => {
    expect(effectiveTests([[1, 0, 0], [0, 1, 0], [0, 0, 1]])).toBeCloseTo(3, 10)
    expect(effectiveTests([[1, 1, 1], [1, 1, 1], [1, 1, 1]])).toBeCloseTo(1, 10)
    const partly = effectiveTests([[1, 0.8, 0.8], [0.8, 1, 0.8], [0.8, 0.8, 1]])
    expect(partly).toBeGreaterThan(1)
    expect(partly).toBeLessThan(3)
    expect(eigenvalues([[2, 1], [1, 2]]).sort()).toEqual([expect.closeTo(1, 10), expect.closeTo(3, 10)])
  })
})

describe('sidak', () => {
  it('is the chance of at least one p-value this small among m independent tests', () => {
    expect(sidak(0.01, 1)).toBeCloseTo(0.01, 12)
    expect(sidak(0.01, 5)).toBeCloseTo(1 - 0.99 ** 5, 12)
    expect(sidak(1e-12, 10)).toBeCloseTo(1e-11, 20)
  })
})
