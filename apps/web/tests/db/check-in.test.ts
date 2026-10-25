import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { recordCheckInAction } from '@/lib/actions/programs'
import { ensurePasswordUser } from '@/lib/auth-users'
import { careItems, careLogs, requireCarePatient } from '@/lib/care-team/data'
import { adminDb, dbAs, withUserTransaction } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import { dueCheckIns, findCheckIn, sendCheckInEmails } from '@/lib/programs/check-in'
import { checkInToken } from '@/lib/programs/check-in-email'
import { PROGRAM_TEMPLATES, programInputSchema } from '@/lib/programs/config'
import { findProgram, type Program } from '@/lib/programs/data'
import { joinProgram, recordProgramValues, saveProgram } from '@/lib/programs/manage'
import {
  addSideEffect,
  mySideEffects,
  mySymptomRatings,
  removeSideEffect,
  sideEffectItemId,
  sideEffectOptions,
} from '@/lib/programs/side-effects'
import { upsertReminder } from '@/lib/tracking/reminders'

// Side effects (the member's symptom reminders), the daily check-in emails and
// their links (lib/programs/side-effects.ts, lib/programs/check-in.ts). See `pnpm test:db`.

vi.mock('@/lib/email', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/email')>()), sendEmail: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const stamp = Date.now()
const slug = `check-in-${stamp}`
const password = 'correct horse battery staple'
const userIds: string[] = []
let owner: { id: string }
let member: { id: string }
let other: { id: string }
let program: Program
let enrollmentId: string
let instanceId: string

const DAY = 86_400_000
const today = new Date().toISOString().slice(0, 10)
const atToday = (time: string) => new Date(`${today}T${time}:00.000Z`)
const glp1 = PROGRAM_TEMPLATES.find((template) => template.key === 'glp-1')!
const mine = async (now: Date) => (await dueCheckIns(now)).filter((checkIn) => checkIn.enrollmentId === enrollmentId)

beforeAll(async () => {
  owner = { id: await ensurePasswordUser(`check-in-owner-${stamp}@example.com`, 'Owner', password) }
  member = { id: await ensurePasswordUser(`check-in-member-${stamp}@example.com`, 'Member', password) }
  other = { id: await ensurePasswordUser(`check-in-other-${stamp}@example.com`, 'Other', password) }
  userIds.push(owner.id, member.id, other.id)
  await adminDb.profiles.updateMany({ where: { id: { in: [member.id, other.id] } }, data: { timezone: 'UTC' } })
  instanceId = (await dbAs(owner).instances.create({ data: { slug, name: 'Check-in Clinic', owner_id: owner.id }, select: { id: true } })).id
  await saveProgram(
    owner,
    slug,
    programInputSchema.parse({ name: 'GLP-1', slug: 'glp-1', summary: '', followUpWeeks: '12', items: JSON.stringify(glp1.items) }),
  )
  program = (await findProgram(slug, 'glp-1'))!
  await joinProgram(member, program, { scheduleNotifications: false })
  await joinProgram(other, program, { scheduleNotifications: false })
  enrollmentId = (await adminDb.program_enrollments.findFirstOrThrow({ where: { program_id: program.id, user_id: member.id } })).id
})

beforeEach(() => {
  vi.mocked(sendEmail).mockReset()
})

afterAll(async () => {
  await adminDb.measurements.deleteMany({ where: { user_id: { in: userIds } } })
  await adminDb.instances.deleteMany({ where: { slug } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe('side effects', () => {
  it('are symptoms on a rating scale that are not items of the program', async () => {
    const options = await sideEffectOptions(member)
    const ids = options.map((option) => option.id)
    expect(ids).toEqual(expect.arrayContaining(['headache', 'dizziness', 'fatigue']))
    // Nausea and energy are check-ins of the program already; weight is not a rating.
    expect(ids).not.toContain('nausea')
    expect(ids).not.toContain('energy-level')
    expect(ids).not.toContain('weight')
    expect(options.find((option) => option.id === 'headache')?.scale).toEqual([0, 10])
  })

  it("are added with today's rating and a daily reminder, and only the member sees them", async () => {
    const item = await addSideEffect(member, program, { variableId: 'headache', value: '4', date: today })
    expect(item).toMatchObject({ id: sideEffectItemId('headache'), kind: 'check_in', better: 'lower', frequency: 'daily' })
    expect((await mySideEffects(member)).map((sideEffect) => sideEffect.name)).toEqual(['Headache'])
    const values = await adminDb.measurements.findMany({ where: { user_id: member.id, global_variable_id: 'headache' }, select: { value: true } })
    expect(values.map((row) => row.value)).toEqual([4])
    const headacheReminders = () =>
      adminDb.reminder_schedules.findMany({
        where: { user_id: member.id, is_active: true, user_variables: { global_variable_id: 'headache' } },
        select: { rrule: true },
      })
    const reminders = await headacheReminders()
    expect(reminders).toHaveLength(1)
    expect(reminders[0].rrule).toContain('FREQ=DAILY')

    // Row-level security: the other member sees none of them.
    expect(await mySideEffects(other)).toEqual([])
    expect(await dbAs(other).reminder_schedules.count({ where: { user_id: member.id } })).toBe(0)

    // Added again: no second reminder.
    await addSideEffect(member, program, { variableId: 'headache', value: '', date: today })
    expect(await headacheReminders()).toHaveLength(1)
  })

  it('are the symptoms that the member has an active reminder for, also from the reminders page', async () => {
    const { reminder } = await withUserTransaction(member, (tx) =>
      upsertReminder(tx, member.id, { globalVariableId: 'fatigue', timeOfDay: '08:00', rrule: 'FREQ=DAILY' }),
    )
    try {
      // The program's own check-ins (nausea) are not side effects.
      expect((await mySideEffects(member)).map((sideEffect) => sideEffect.variableId)).toEqual(['headache', 'fatigue'])
      await adminDb.reminder_schedules.update({ where: { id: reminder.id }, data: { is_active: false } })
      expect((await mySideEffects(member)).map((sideEffect) => sideEffect.variableId)).toEqual(['headache'])
    } finally {
      await adminDb.reminder_schedules.delete({ where: { id: reminder.id } })
    }
  })

  it("leave out the check-ins of the member's programs, whose reminders those programs use", async () => {
    const both = { id: await ensurePasswordUser(`check-in-both-${stamp}@example.com`, 'Both', password) }
    userIds.push(both.id)
    const bpc = PROGRAM_TEMPLATES.find((template) => template.key === 'bpc-157')!
    await saveProgram(
      owner,
      slug,
      programInputSchema.parse({ name: 'BPC-157', slug: 'bpc-157', summary: '', followUpWeeks: '8', items: JSON.stringify(bpc.items) }),
    )
    await joinProgram(both, program, { scheduleNotifications: false })
    await joinProgram(both, (await findProgram(slug, 'bpc-157'))!, { scheduleNotifications: false })

    // Pain is a check-in of the BPC-157 program, with a reminder: not a side effect in the GLP-1 program.
    expect(await mySideEffects(both)).toEqual([])
    expect((await sideEffectOptions(both)).map((option) => option.id)).not.toContain('pain')
    expect((await sideEffectOptions(member)).map((option) => option.id)).toContain('pain')
    await expect(addSideEffect(both, program, { variableId: 'pain', value: '', date: today })).rejects.toThrow(
      'Choose a side effect from the list.',
    )
    expect(await removeSideEffect(both, 'pain')).toBe(false)
    expect(await adminDb.reminder_schedules.count({ where: { user_id: both.id, user_variables: { global_variable_id: 'pain' } } })).toBe(1)
  })

  it('must be a symptom from the list, and the member must be in the program', async () => {
    for (const variableId of ['nausea', 'weight', 'no-such-variable']) {
      await expect(addSideEffect(member, program, { variableId, value: '', date: today })).rejects.toThrow(
        'Choose a side effect from the list.',
      )
    }
    await expect(addSideEffect(member, program, { variableId: 'dizziness', value: '11', date: today })).rejects.toThrow(
      'Dizziness: enter a number from 0 to 10.',
    )
    await expect(addSideEffect(owner, program, { variableId: 'dizziness', value: '', date: today })).rejects.toThrow(
      'Join the program first.',
    )
  })

  it('are in the day form and in what the care team sees', async () => {
    const items = [...program.items, ...(await mySideEffects(member))]
    await recordProgramValues(member, program, 'today', today, { [sideEffectItemId('headache')]: '6' }, { items })
    const values = await adminDb.measurements.findMany({ where: { user_id: member.id, global_variable_id: 'headache' }, select: { value: true } })
    expect(values.map((row) => row.value).sort()).toEqual([4, 6])

    await adminDb.instance_clinicians.create({ data: { instance_id: instanceId, user_id: owner.id } })
    const patient = await requireCarePatient(owner, { id: instanceId, slug }, enrollmentId)
    const careSees = await careItems(patient)
    expect(careSees.map((item) => item.name)).toContain('Headache')
    expect((await careLogs(patient, careSees)).get('headache')?.map((point) => point.value).sort()).toEqual([4, 6])
  })

  it('stop when the member removes them: the reminder goes, the values stay, and the care team still sees them', async () => {
    await addSideEffect(member, program, { variableId: 'dizziness', value: '3', date: today })
    expect(await removeSideEffect(member, 'dizziness')).toBe(true)
    expect((await mySideEffects(member)).map((sideEffect) => sideEffect.variableId)).toEqual(['headache'])
    expect(await adminDb.reminder_schedules.count({ where: { user_id: member.id, user_variables: { global_variable_id: 'dizziness' } } })).toBe(0)
    const patient = await requireCarePatient(owner, { id: instanceId, slug }, enrollmentId)
    expect((await careItems(patient)).map((item) => item.name)).toContain('Dizziness')

    // The program's own check-ins cannot be removed as side effects.
    expect(await removeSideEffect(member, 'nausea')).toBe(false)
    expect(await adminDb.reminder_schedules.count({ where: { user_id: member.id, user_variables: { global_variable_id: 'nausea' } } })).toBe(1)
  })

  it("of a treatment: added without a program, and the symptoms rated since the treatment's start", async () => {
    const treated = { id: await ensurePasswordUser(`check-in-treated-${stamp}@example.com`, 'Treated', password) }
    userIds.push(treated.id)
    const daysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString().slice(0, 10)
    await addSideEffect(treated, null, { variableId: 'headache', value: '5', date: daysAgo(1) })
    await addSideEffect(treated, null, { variableId: 'headache', value: '3', date: today })
    // Before the treatment's start.
    await addSideEffect(treated, null, { variableId: 'dizziness', value: '2', date: daysAgo(10) })
    expect((await mySideEffects(treated)).map((sideEffect) => sideEffect.name)).toEqual(['Headache', 'Dizziness'])

    const rated = await mySymptomRatings(treated, new Date(Date.now() - 3 * DAY))
    expect(rated.map(({ item, ratings }) => [item.name, ratings.map((rating) => rating.value)])).toEqual([['Headache', [3, 5]]])
    expect(rated[0].ratings[0].unit).toBe('0-10')
    // A treatment started late today keeps today's rating, which is saved at noon UTC.
    const lateToday = await mySymptomRatings(treated, atToday('23:00'))
    expect(lateToday.map(({ item, ratings }) => [item.name, ratings.map((rating) => rating.value)])).toEqual([['Headache', [3]]])
    // Row-level security: another person's ratings are not in it.
    expect((await mySymptomRatings(other, new Date(Date.now() - 3 * DAY))).map(({ item }) => item.name)).not.toContain('Headache')
  })
})

describe('the daily check-in email', () => {
  it("is due after the day's last reminder, with the items that have a reminder that day", async () => {
    // The dose reminder is at 09:00 and the check-in reminders at 20:00, in UTC for this member.
    expect(await mine(atToday('19:59'))).toEqual([])
    const [due] = await mine(atToday('20:30'))
    expect(due).toMatchObject({ day: today, email: `check-in-member-${stamp}@example.com`, instanceSlug: slug })
    // The weekly dose and weight fire on the weekday of the start: today.
    expect(due.items.map((item) => item.name)).toEqual(expect.arrayContaining(['Semaglutide', 'Weight', 'Energy', 'Nausea', 'Headache']))
    expect(due.items.map((item) => item.kind)).not.toContain('lab')
  })

  it("is not due in the member's morning, in their time zone", async () => {
    await adminDb.profiles.update({ where: { id: member.id }, data: { timezone: 'America/New_York' } })
    try {
      expect(await mine(atToday('20:30'))).toEqual([])
    } finally {
      await adminDb.profiles.update({ where: { id: member.id }, data: { timezone: 'UTC' } })
    }
  })

  it('is still due after midnight for a reminder late in the evening, for 3 hours', async () => {
    const schedules = await adminDb.reminder_schedules.findMany({ where: { user_id: member.id }, select: { id: true, time_of_day: true } })
    await adminDb.reminder_schedules.updateMany({ where: { user_id: member.id }, data: { time_of_day: new Date('1970-01-01T23:30:00.000Z') } })
    try {
      // The scheduler runs at minute 17 of each hour: 23:17 is too early, and 00:17 is the next day.
      expect(await mine(atToday('23:17'))).toEqual([])
      const tomorrow = (time: string) => new Date(atToday(time).getTime() + DAY)
      expect((await mine(tomorrow('00:17'))).map((checkIn) => checkIn.day)).toEqual([today])
      expect(await mine(tomorrow('02:31'))).toEqual([])
    } finally {
      for (const schedule of schedules) {
        await adminDb.reminder_schedules.update({ where: { id: schedule.id }, data: { time_of_day: schedule.time_of_day } })
      }
    }
  })

  it('stays due when a run reaches its time limit before it claims the email', async () => {
    const counts = await sendCheckInEmails(atToday('20:30'), Date.now() - 1)
    expect(counts).toMatchObject({ sent: 0, failed: 0 })
    expect(counts.deferred).toBe(counts.due)
    expect(await adminDb.check_in_emails.count({ where: { enrollment_id: enrollmentId } })).toBe(0)
    expect(await mine(atToday('20:30'))).toHaveLength(1)
  })

  it('is due again when the run that claimed it stopped before it sent it, after 15 minutes', async () => {
    const local_date = new Date(`${today}T00:00:00.000Z`)
    const claimed = (minutesAgo: number) => new Date(atToday('20:30').getTime() - minutesAgo * 60_000)
    await adminDb.check_in_emails.create({ data: { enrollment_id: enrollmentId, local_date, claimed_at: claimed(5) } })
    try {
      // Another run may still send it.
      expect(await mine(atToday('20:30'))).toEqual([])
      await adminDb.check_in_emails.updateMany({ where: { enrollment_id: enrollmentId }, data: { claimed_at: claimed(20) } })
      expect(await mine(atToday('20:30'))).toHaveLength(1)
    } finally {
      await adminDb.check_in_emails.deleteMany({ where: { enrollment_id: enrollmentId } })
    }
  })

  it('is sent once a day, with a link that records the day without a sign-in', async () => {
    const before = await sendCheckInEmails(atToday('20:30'))
    expect(before.failed).toBe(0)
    const sent = vi.mocked(sendEmail).mock.calls.map(([email]) => email).filter((email) => email.to === `check-in-member-${stamp}@example.com`)
    expect(sent).toHaveLength(1)
    expect(sent[0]).toMatchObject({ subject: 'Your check-in for GLP-1', fromName: 'Check-in Clinic' })
    const link = /\/programs\/glp-1\/check-in\/([\w-]+\.[\w-]+)/.exec(sent[0].text)
    expect(link).not.toBeNull()

    const row = await adminDb.check_in_emails.findFirstOrThrow({ where: { enrollment_id: enrollmentId } })
    expect(row.sent_at).not.toBeNull()
    vi.mocked(sendEmail).mockReset()
    await sendCheckInEmails(atToday('21:30'))
    expect(vi.mocked(sendEmail).mock.calls.filter(([email]) => email.to === `check-in-member-${stamp}@example.com`)).toHaveLength(0)

    const checkIn = (await findCheckIn(link![1]))!
    expect(checkIn).toMatchObject({ enrollmentId, userId: member.id, day: today })
    const form = new FormData()
    form.set(`value-${checkIn.items.find((item) => item.name === 'Energy')!.id}`, '7')
    expect(await recordCheckInAction(link![1], {}, form)).toEqual({ saved: 1 })
    const energy = await adminDb.measurements.findMany({ where: { user_id: member.id, global_variable_id: 'energy-level' }, select: { value: true } })
    expect(energy.map((row) => row.value)).toEqual([7])
    expect(await recordCheckInAction(`${link![1]}x`, {}, form)).toEqual({ error: 'This link is too old. Open your program to record the day.' })
  })

  it('tries again after a failed email, and is not due when each item has a value of the day', async () => {
    const otherEnrollment = (await adminDb.program_enrollments.findFirstOrThrow({ where: { program_id: program.id, user_id: other.id } })).id
    // The other member got today's email in the test before.
    await adminDb.check_in_emails.deleteMany({ where: { enrollment_id: otherEnrollment } })
    vi.mocked(sendEmail).mockRejectedValue(new Error('SMTP is down'))
    const counts = await sendCheckInEmails(atToday('20:30'))
    expect(counts.failed).toBeGreaterThan(0)
    expect(await adminDb.check_in_emails.count({ where: { enrollment_id: otherEnrollment } })).toBe(0)

    const due = (await dueCheckIns(atToday('20:30'))).find((checkIn) => checkIn.enrollmentId === otherEnrollment)!
    const values = Object.fromEntries(due.items.map((item) => [item.id, '1']))
    await recordProgramValues(other, program, 'today', today, values, { items: due.items })
    expect((await dueCheckIns(atToday('20:30'))).some((checkIn) => checkIn.enrollmentId === otherEnrollment)).toBe(false)
  })

  it('is never sent to the demo accounts of a site', async () => {
    await adminDb.instance_demo_accounts.create({ data: { instance_id: instanceId, user_id: other.id, role: 'patient' } })
    await adminDb.measurements.deleteMany({ where: { user_id: other.id } })
    expect((await dueCheckIns(atToday('20:30'))).some((checkIn) => checkIn.userId === other.id)).toBe(false)
  })

  it('links only to a member who is still in the program', async () => {
    const token = checkInToken(enrollmentId, today)
    expect(await findCheckIn(token)).not.toBeNull()
    await adminDb.program_enrollments.delete({ where: { id: enrollmentId } })
    expect(await findCheckIn(token)).toBeNull()
  })
})
