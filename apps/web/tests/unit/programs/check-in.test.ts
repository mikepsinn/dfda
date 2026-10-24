// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { checkInEmail, checkInToken, readCheckInToken } from '@/lib/programs/check-in-email'
import { scaleWords } from '@/lib/programs/config'
import type { Program, ProgramItem } from '@/lib/programs/data'
import { valueField } from '@/lib/programs/fields'
import { firesOn } from '@/lib/reminders/schedule'

const secret = 'a-test-secret-with-at-least-32-characters'
const enrollmentId = '0b6f7a52-3c1e-4c0b-9d4f-1e2a3b4c5d6e'
const at = (iso: string) => new Date(iso)

const item = (overrides: Partial<ProgramItem>): ProgramItem => ({
  id: 'item',
  kind: 'check_in',
  variableId: 'variable',
  name: 'Variable',
  unitId: 'zero-to-ten-scale',
  unit: '/10',
  molarMass: null,
  frequency: 'daily',
  better: 'lower',
  defaultValue: null,
  ...overrides,
})
const dose = item({ id: 'dose', kind: 'dose', variableId: 'semaglutide', name: 'Semaglutide', unitId: 'milligram', unit: 'mg', better: null, frequency: 'weekly', defaultValue: 0.25 })
const nausea = item({ id: 'nausea', variableId: 'nausea', name: 'Nausea' })
const energy = item({ id: 'energy', variableId: 'energy-level', name: 'Energy', better: 'higher' })
const weight = item({ id: 'weight', variableId: 'weight', name: 'Weight', unitId: 'kilogram', unit: 'kg' })

describe('check-in links', () => {
  it('hold the enrollment and the day, signed', () => {
    const token = checkInToken(enrollmentId, '2026-10-24', secret)
    expect(readCheckInToken(token, at('2026-10-24T20:00:00Z'), secret)).toEqual({ enrollmentId, day: '2026-10-24' })
  })

  it('work for 3 days after the day', () => {
    const token = checkInToken(enrollmentId, '2026-10-24', secret)
    expect(readCheckInToken(token, at('2026-10-27T23:59:59Z'), secret)).not.toBeNull()
    expect(readCheckInToken(token, at('2026-10-28T00:00:00Z'), secret)).toBeNull()
  })

  it('do not work with another secret, a changed day or a changed signature', () => {
    const token = checkInToken(enrollmentId, '2026-10-24', secret)
    const now = at('2026-10-24T20:00:00Z')
    expect(readCheckInToken(token, now, `${secret}-other`)).toBeNull()
    const [, signature] = token.split('.')
    const otherDay = Buffer.from(JSON.stringify([enrollmentId, '2026-10-25'])).toString('base64url')
    expect(readCheckInToken(`${otherDay}.${signature}`, now, secret)).toBeNull()
    expect(readCheckInToken(`${token.slice(0, -2)}xx`, now, secret)).toBeNull()
    expect(readCheckInToken('not-a-token', now, secret)).toBeNull()
    expect(readCheckInToken(`${token}.extra`, now, secret)).toBeNull()
  })
})

describe('the days that a reminder fires', () => {
  const start = at('2026-10-20T15:00:00Z')

  it('are each day for a daily rule, from the start date in the time zone, up to the end date', () => {
    const daily = { rruleString: 'DTSTART;TZID=America/New_York:20261020T110000\nRRULE:FREQ=DAILY', startDate: start, endDate: null }
    expect(firesOn(daily, '2026-10-19', 'America/New_York')).toBe(false)
    expect(firesOn(daily, '2026-10-20', 'America/New_York')).toBe(true)
    expect(firesOn(daily, '2026-11-30', 'America/New_York')).toBe(true)
    expect(firesOn({ ...daily, endDate: at('2026-10-25T15:00:00Z') }, '2026-10-26', 'America/New_York')).toBe(false)
  })

  it("are the start date's weekday for a weekly rule without days, and the given days otherwise", () => {
    // 2026-10-20 is a Tuesday.
    const weekly = { rruleString: 'RRULE:FREQ=WEEKLY', startDate: start, endDate: null }
    expect(firesOn(weekly, '2026-10-27', 'UTC')).toBe(true)
    expect(firesOn(weekly, '2026-10-28', 'UTC')).toBe(false)
    const days = { ...weekly, rruleString: 'RRULE:FREQ=WEEKLY;BYDAY=MO,TH' }
    expect(firesOn(days, '2026-10-22', 'UTC')).toBe(true)
    expect(firesOn(days, '2026-10-27', 'UTC')).toBe(false)
  })

  it('use the day in the time zone: late on the start day in UTC is the next day in Tokyo', () => {
    const late = { rruleString: 'RRULE:FREQ=DAILY', startDate: at('2026-10-20T20:00:00Z'), endDate: null }
    expect(firesOn(late, '2026-10-20', 'Asia/Tokyo')).toBe(false)
    expect(firesOn(late, '2026-10-21', 'Asia/Tokyo')).toBe(true)
  })
})

describe('rating fields', () => {
  it('get number buttons with the words of the better direction; a dose gets its usual amount', () => {
    expect(valueField(nausea).scale).toEqual({ min: 0, max: 10, words: ['None', 'Worst'] })
    expect(valueField(energy).scale).toEqual({ min: 0, max: 10, words: ['Very low', 'Very high'] })
    expect(valueField(weight).scale).toBeNull()
    expect(valueField(dose)).toMatchObject({ kind: 'dose', usual: 0.25, scale: null })
    expect(scaleWords('lower', 1)).toEqual(['Mildest', 'Worst'])
    expect(scaleWords('neither', 0)).toBeNull()
  })
})

describe('the check-in email', () => {
  const program = { name: 'GLP-1 program', slug: 'glp-1' } as Program
  const brand = { name: 'Acme Clinic', primaryColor: '#0f766e', supportEmail: 'care@acme.example' }
  const url = (path: string) => `https://acme.example${path}`
  const email = checkInEmail(
    { email: 'member@example.com', day: '2026-10-24', program, items: [dose, nausea, weight] },
    brand,
    url,
    '/programs/glp-1/check-in/TOKEN',
  )

  it('comes from the company, to the member', () => {
    expect(email).toMatchObject({
      to: 'member@example.com',
      subject: 'Your check-in for GLP-1 program',
      fromName: 'Acme Clinic',
      replyTo: 'care@acme.example',
    })
  })

  it('has a button for each number of a rating, dose buttons, and a link to the check-in', () => {
    for (let value = 0; value <= 10; value++) {
      expect(email.html).toContain(`href="https://acme.example/programs/glp-1/check-in/TOKEN?value-nausea=${value}"`)
    }
    expect(email.html).toContain('0 = None, 10 = Worst')
    expect(email.html).toContain('href="https://acme.example/programs/glp-1/check-in/TOKEN?value-dose=0.25"')
    expect(email.html).toContain('Took it (0.25 mg)')
    // A skipped dose is a 0.
    expect(email.html).toMatch(/href="https:\/\/acme\.example\/programs\/glp-1\/check-in\/TOKEN\?value-dose=0"[^>]*>Skipped</)
    expect(email.html).toContain('Also on your check-in: Weight.')
    expect(email.html).toContain('href="https://acme.example/patient/reminders"')
    expect(email.text).toContain('Open your check-in: https://acme.example/programs/glp-1/check-in/TOKEN')
    expect(email.text).toContain('To change or stop them: https://acme.example/patient/reminders')
  })
})
