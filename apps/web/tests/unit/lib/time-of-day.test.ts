import { describe, expect, it } from 'vitest'
import { timeOfDayFromString, timeOfDayToString } from '@/lib/time-of-day'

describe('time of day conversion', () => {
  it('converts HH:MM and HH:MM:SS to the UTC date that Prisma uses for TIME', () => {
    expect(timeOfDayFromString('08:30').toISOString()).toBe('1970-01-01T08:30:00.000Z')
    expect(timeOfDayFromString('23:59:59').toISOString()).toBe('1970-01-01T23:59:59.000Z')
  })

  it('formats a TIME value as HH:MM:SS', () => {
    expect(timeOfDayToString(new Date('1970-01-01T07:05:00.000Z'))).toBe('07:05:00')
  })

  it('rejects invalid times', () => {
    expect(() => timeOfDayFromString('24:00')).toThrow('Invalid time of day')
    expect(() => timeOfDayFromString('8am')).toThrow('Invalid time of day')
  })
})
