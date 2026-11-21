import { describe, expect, it } from 'vitest'
import { dayGroup, groupByDay, inboxTitle, presetValues } from '@/lib/inbox/view'

const now = new Date('2026-11-20T15:00:00Z') // 9:00 AM in Chicago

describe('inbox day dividers', () => {
  it('counts calendar days in the person’s time zone', () => {
    expect(dayGroup('2026-11-20T06:30:00Z', 'America/Chicago', now)).toBe('Today') // 12:30 AM local
    expect(dayGroup('2026-11-20T05:30:00Z', 'America/Chicago', now)).toBe('Yesterday') // 11:30 PM local the day before
    expect(dayGroup('2026-11-20T05:30:00Z', 'UTC', now)).toBe('Today')
    expect(dayGroup('2026-11-14T15:00:00Z', 'UTC', now)).toBe('Last 7 days')
    expect(dayGroup('2026-11-13T15:00:00Z', 'UTC', now)).toBe('Last 30 days')
    expect(dayGroup('2026-10-22T15:00:00Z', 'UTC', now)).toBe('Last 30 days') // 29 days ago
    expect(dayGroup('2026-10-21T15:00:00Z', 'UTC', now)).toBe('Older') // 30 days ago
  })

  it('keeps the items’ order within dividers and leaves out empty ones', () => {
    const items = [
      { id: 'a', dueAt: '2026-11-20T14:00:00Z' },
      { id: 'b', dueAt: '2026-11-19T14:00:00Z' },
      { id: 'c', dueAt: '2026-11-20T08:00:00Z' },
      { id: 'd', dueAt: '2026-09-01T08:00:00Z' },
    ]
    expect(groupByDay(items, 'UTC', now).map(({ group, items }) => [group, items.map((i) => i.id)])).toEqual([
      ['Today', ['a', 'c']],
      ['Yesterday', ['b']],
      ['Older', ['d']],
    ])
  })
})

describe('inbox one-tap values', () => {
  it('offers the default value, then the latest distinct values', () => {
    expect(presetValues(500, [250, 500, 250, 1000, 750])).toEqual([500, 250, 1000, 750])
    expect(presetValues(null, [2, 2, 3])).toEqual([2, 3])
    expect(presetValues(null, [])).toEqual([])
  })

  it('keeps zero and drops values that are not numbers', () => {
    expect(presetValues(0, [Number.NaN, 1])).toEqual([0, 1])
  })
})

describe('inbox card titles', () => {
  it('uses the reminder’s title, "Rate …" for a rating, or the name', () => {
    expect(inboxTitle('Overall Mood', true)).toBe('Rate Overall Mood')
    expect(inboxTitle('Magnesium', false)).toBe('Magnesium')
    expect(inboxTitle('Magnesium', false, '  Take your magnesium ')).toBe('Take your magnesium')
    expect(inboxTitle('Magnesium', false, '   ')).toBe('Magnesium')
  })
})
