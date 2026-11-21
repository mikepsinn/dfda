import { describe, expect, it } from 'vitest'
import { buildRruleString, computeNextTriggerAt } from '@/lib/reminders/schedule'

describe('computeNextTriggerAt', () => {
  const now = new Date('2026-11-21T16:27:04.000Z') // 10:27 AM in Chicago, a Saturday
  const next = (rrule: string, timeOfDay: string, startDate = now) =>
    computeNextTriggerAt({ rruleString: buildRruleString(rrule, startDate, 'America/Chicago'), timeOfDay, startDate, isActive: true }, 'America/Chicago', now)?.toISOString()

  it('is the next local time of day on a day the rule fires, not the time the reminder was saved', () => {
    expect(next('FREQ=DAILY', '08:00')).toBe('2026-11-22T14:00:00.000Z')
    expect(next('FREQ=DAILY', '14:00')).toBe('2026-11-21T20:00:00.000Z')
    // A weekly rule fires on the weekday of its start, here a Monday.
    expect(next('FREQ=WEEKLY', '09:00', new Date('2026-11-02T15:00:00.000Z'))).toBe('2026-11-23T15:00:00.000Z')
  })

  it('is null for a paused reminder', () => {
    expect(computeNextTriggerAt({ rruleString: 'FREQ=DAILY', timeOfDay: '08:00', startDate: now, isActive: false }, 'UTC', now)).toBeNull()
  })
})
