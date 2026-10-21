// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { programWeek } from '@/lib/care-team/format'

const DAY = 86_400_000
const start = new Date('2026-07-01T09:00:00Z')
const at = (days: number) => new Date(start.getTime() + days * DAY)

describe('programWeek', () => {
  it('counts weeks from 1 on the first day', () => {
    expect(programWeek(start, 12, at(0))).toBe('Week 1 of 12')
    expect(programWeek(start, 12, at(6.9))).toBe('Week 1 of 12')
    expect(programWeek(start, 12, at(7))).toBe('Week 2 of 12')
    expect(programWeek(start, 12, at(83))).toBe('Week 12 of 12')
  })

  it('says that the follow-up is due from the end of the last week on', () => {
    expect(programWeek(start, 12, at(84))).toBe('Follow-up due')
    expect(programWeek(start, 12, at(200))).toBe('Follow-up due')
  })

  it('shows week 1 for a start in the future', () => {
    expect(programWeek(start, 12, at(-3))).toBe('Week 1 of 12')
  })
})
