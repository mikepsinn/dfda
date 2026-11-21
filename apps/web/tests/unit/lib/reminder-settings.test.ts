import { describe, expect, it } from 'vitest'
import {
  describeSettings, normalRule, ruleOf, scheduleTimes, settingsOf, type StoredSchedule,
} from '@/lib/patient/reminder-settings'

const schedule = (timeOfDay: string, rule = 'FREQ=DAILY', extra: Partial<StoredSchedule> = {}): StoredSchedule => ({
  rule,
  timeOfDay,
  isActive: true,
  defaultValue: null,
  startDate: '2026-11-02T15:00:00.000Z',
  endDate: null,
  ...extra,
})

describe('scheduleTimes', () => {
  it('spreads a frequency of every few hours through the day from the first time', () => {
    expect(scheduleTimes('every-8-hours', ['08:00'])).toEqual(['08:00', '16:00', '00:00'])
    expect(scheduleTimes('every-4-hours', ['09:30'])).toHaveLength(6)
    expect(scheduleTimes('every-30-minutes', ['00:15'])).toHaveLength(48)
  })

  it('keeps up to three distinct times for daily and longer frequencies, and none when as-needed', () => {
    expect(scheduleTimes('daily', ['08:00', '20:00', '08:00', '12:00', '18:00'])).toEqual(['08:00', '20:00', '12:00'])
    expect(scheduleTimes('weekly', ['25:00', '07:15'])).toEqual(['07:15'])
    expect(scheduleTimes('as-needed', ['08:00'])).toEqual([])
  })
})

describe('settingsOf', () => {
  it('reads as-needed from a favorite without schedules, and nothing from neither', () => {
    expect(settingsOf([], true)?.frequency).toBe('as-needed')
    expect(settingsOf([], false)).toBeNull()
  })

  it('reads back the frequency that the schedules were saved from', () => {
    for (const [frequency, times] of [
      ['daily', ['08:00', '13:00']],
      ['every-other-day', ['07:00']],
      ['weekly', ['09:00']],
      ['every-4-weeks', ['09:00']],
      ['every-6-hours', ['06:00']],
      ['hourly', ['00:30']],
    ] as const) {
      const stored = scheduleTimes(frequency, [...times]).map((time) => schedule(time, ruleOf(frequency)!))
      expect(settingsOf(stored, false)).toMatchObject({ frequency, times })
    }
  })

  it('reads a rule with its parts in another order', () => {
    expect(settingsOf([schedule('09:00', 'INTERVAL=4;FREQ=WEEKLY')], false)?.frequency).toBe('every-4-weeks')
  })

  it('reads two or three daily times as daily, also when evenly spaced', () => {
    expect(settingsOf(scheduleTimes('every-12-hours', ['08:00']).map((t) => schedule(t)), false)?.frequency).toBe('daily')
  })

  it('keeps schedules that fit no frequency as a custom schedule', () => {
    expect(settingsOf([schedule('08:00', 'FREQ=WEEKLY;BYDAY=MO,TH')], false)?.frequency).toBe('custom')
    expect(settingsOf([schedule('08:00'), schedule('09:00', 'FREQ=WEEKLY')], false)?.frequency).toBe('custom')
    expect(settingsOf(['01:00', '02:00', '03:00', '04:00'].map((t) => schedule(t)), false)?.frequency).toBe('custom')
  })
})

describe('describeSettings', () => {
  const now = new Date('2026-11-21T12:00:00Z')
  const daily = settingsOf([schedule('08:00'), schedule('20:00')], false)!

  it('names the frequency and times as on the reminder list', () => {
    expect(describeSettings(daily, 'UTC', now)).toBe('Daily at 8:00 AM and 8:00 PM')
    expect(describeSettings(settingsOf(scheduleTimes('every-4-hours', ['08:00']).map((t) => schedule(t)), false)!, 'UTC', now))
      .toBe('Every 4 hours from 8:00 AM')
    // 2026-11-02 is a Monday.
    expect(describeSettings(settingsOf([schedule('09:00', 'FREQ=WEEKLY')], false)!, 'UTC', now)).toBe('Weekly on Monday at 9:00 AM')
  })

  it('says when the reminders are paused or ended', () => {
    expect(describeSettings({ ...daily, isActive: false }, 'UTC', now)).toBe('Paused')
    expect(describeSettings({ ...daily, endDate: '2026-11-03T12:00:00Z' }, 'UTC', now)).toBe('Ended Nov 3, 2026')
  })
})

describe('normalRule', () => {
  it('compares rules regardless of part order and a default interval', () => {
    expect(normalRule('interval=1;freq=daily')).toBe('FREQ=DAILY')
    expect(normalRule('INTERVAL=2;FREQ=WEEKLY')).toBe('FREQ=WEEKLY;INTERVAL=2')
  })
})
