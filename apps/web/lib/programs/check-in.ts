import { DateTime } from 'luxon'
import { companyPageUrl } from '@/lib/care-team/data'
import { companyOf } from '@/lib/care-team/notify'
import { adminDb, isUniqueViolation } from '@/lib/db'
import { sendEmail, type EmailBrand } from '@/lib/email'
import { logger } from '@/lib/logger'
import { firesOn, zoneOf } from '@/lib/reminders/schedule'
import { timeOfDayToString } from '@/lib/time-of-day'
import { checkInEmail, checkInToken, readCheckInToken } from './check-in-email'
import { findProgramById, type Program, type ProgramItem } from './data'
import { sideEffectsOf } from './side-effects'

/**
 * The daily check-in email of a program member, and the link that opens the
 * day's check-in without a sign-in.
 *
 * Once a day, after the last of the day's reminders for a program's doses
 * and check-ins and the member's side effects (./side-effects.ts), the
 * member gets one email for the program. It has a row of number buttons for
 * each rating, and "Took it" and "Skipped" buttons for each dose.
 * A button opens the check-in page with that answer chosen; the member saves
 * there. The link only opens the page, because some email systems open the
 * links of an email to check them, and that must not record anything.
 *
 * The link holds the enrollment and the day, signed with BETTER_AUTH_SECRET.
 * It records values of that day only, for 3 days, and it shows no values.
 * A scheduler calls app/api/cron/check-in-emails. The link and the email
 * are in ./check-in-email.ts. Server only.
 */

const DAY = 86_400_000
const HOUR = 3_600_000
const MINUTE = 60_000
/** After this, the claim of an email that was not marked sent (its run stopped) can be taken over. */
const CLAIM_MINUTES = 15
/** A run stops claiming emails after this, within the 60 seconds of the scheduler's call; the rest stay due. */
const SEND_SECONDS = 40
/** How long after the last reminder of a day its email is still sent on the next day. */
const CARRY_HOURS = 3

/** The doses and check-ins of a program, then the member's side effects. */
function dailyItems(program: Program, sideEffects: ProgramItem[] = []): ProgramItem[] {
  return [...program.items.filter((item) => item.kind !== 'lab'), ...sideEffects]
}

export type CheckIn = { enrollmentId: string; userId: string; day: string; program: Program; items: ProgramItem[] }

/** The check-in of a link: the member, the day and its items; null for a wrong or old link, or when the member left the program. */
export async function findCheckIn(token: string, now = new Date()): Promise<CheckIn | null> {
  const read = readCheckInToken(token, now)
  if (!read) return null
  const enrollment = await adminDb.program_enrollments.findUnique({
    where: { id: read.enrollmentId },
    select: { user_id: true, program_id: true },
  })
  if (!enrollment) return null
  const [program, sideEffects] = await Promise.all([
    findProgramById(enrollment.program_id),
    sideEffectsOf(adminDb, [enrollment.user_id], now),
  ])
  if (!program) return null
  return {
    enrollmentId: read.enrollmentId,
    userId: enrollment.user_id,
    day: read.day,
    program,
    items: dailyItems(program, sideEffects.get(enrollment.user_id)),
  }
}

export type DueCheckIn = {
  enrollmentId: string
  userId: string
  email: string
  instanceSlug: string
  /** The member's day, in their time zone. */
  day: string
  program: Program
  /** The items with a reminder on the day. */
  items: ProgramItem[]
}

/**
 * The check-in emails that are due at `now`: for each member and program,
 * when the member's time is after the last of the day's reminders for the
 * program's doses and check-ins and the member's side effects. The email of the
 * day before is still due for 3 hours after its last reminder, so that a
 * reminder late in the evening, or a failed email of the day's last run, is
 * not lost at midnight. None when no such reminder fires that day (for example, the
 * member turned them off), when the member already has a value of each of
 * those items that day, when the email of the day was sent, or for the demo
 * accounts of a site.
 */
export async function dueCheckIns(now = new Date()): Promise<DueCheckIn[]> {
  const [enrollments, demo] = await Promise.all([
    adminDb.program_enrollments.findMany({
      where: { profiles: { deleted_at: null } },
      select: {
        id: true,
        user_id: true,
        program_id: true,
        profiles: { select: { email: true, timezone: true } },
        instance_programs: { select: { instances: { select: { slug: true } } } },
      },
    }),
    adminDb.instance_demo_accounts.findMany({ select: { user_id: true } }),
  ])
  const demoIds = new Set(demo.map((row) => row.user_id))
  const members = enrollments.filter((enrollment) => !demoIds.has(enrollment.user_id))
  if (members.length === 0) return []

  const userIds = [...new Set(members.map((enrollment) => enrollment.user_id))]
  const [schedules, sideEffects, sent] = await Promise.all([
    adminDb.reminder_schedules.findMany({
      where: { user_id: { in: userIds }, is_active: true },
      select: {
        user_id: true,
        rrule: true,
        time_of_day: true,
        start_date: true,
        end_date: true,
        user_variables: { select: { global_variable_id: true } },
      },
    }),
    sideEffectsOf(adminDb, userIds, now),
    // The member's day is at most a day from UTC's.
    // Sent, or claimed by a run that may still send it.
    adminDb.check_in_emails.findMany({
      where: {
        local_date: { gte: new Date(now.getTime() - 2 * DAY) },
        OR: [{ sent_at: { not: null } }, { claimed_at: { gte: new Date(now.getTime() - CLAIM_MINUTES * MINUTE) } }],
      },
      select: { enrollment_id: true, local_date: true },
    }),
  ])
  const sentKeys = new Set(sent.map((row) => `${row.enrollment_id}:${row.local_date.toISOString().slice(0, 10)}`))
  const schedulesOf = new Map<string, typeof schedules>()
  for (const schedule of schedules) schedulesOf.set(schedule.user_id, [...(schedulesOf.get(schedule.user_id) ?? []), schedule])
  const programs = new Map<string, Promise<Program | null>>()

  const candidates: DueCheckIn[] = []
  for (const enrollment of members) {
    if (!programs.has(enrollment.program_id)) programs.set(enrollment.program_id, findProgramById(enrollment.program_id))
    const program = await programs.get(enrollment.program_id)!
    if (!program) continue
    const zone = zoneOf(enrollment.profiles.timezone)
    const today = DateTime.fromJSDate(now).setZone(zone)
    const items = dailyItems(program, sideEffects.get(enrollment.user_id))

    // Today, and the day before: a reminder late in the evening can come after the scheduler's last run of its day.
    for (const day of [today.toISODate()!, today.minus({ days: 1 }).toISODate()!]) {
      if (sentKeys.has(`${enrollment.id}:${day}`)) continue
      const times = new Map<string, string>()
      for (const item of items) {
        for (const schedule of schedulesOf.get(enrollment.user_id) ?? []) {
          if (schedule.user_variables.global_variable_id !== item.variableId) continue
          const fires = firesOn(
            { rruleString: schedule.rrule, startDate: schedule.start_date, endDate: schedule.end_date },
            day,
            zone,
          )
          const time = timeOfDayToString(schedule.time_of_day).slice(0, 5)
          if (fires && time > (times.get(item.id) ?? '')) times.set(item.id, time)
        }
      }
      if (times.size === 0) continue
      const dueAt = DateTime.fromISO(`${day}T${[...times.values()].sort().at(-1)}`, { zone }).toJSDate()
      if (now < dueAt || (day !== today.toISODate() && now.getTime() - dueAt.getTime() > CARRY_HOURS * HOUR)) continue
      candidates.push({
        enrollmentId: enrollment.id,
        userId: enrollment.user_id,
        email: enrollment.profiles.email,
        instanceSlug: enrollment.instance_programs.instances.slug,
        day,
        program,
        items: items.filter((item) => times.has(item.id)),
      })
    }
  }
  if (candidates.length === 0) return []

  // Values of the day are saved at noon UTC of the day (lib/programs/manage.ts).
  const days = candidates.map((candidate) => candidate.day).sort()
  const recorded = await adminDb.measurements.findMany({
    where: {
      user_id: { in: [...new Set(candidates.map((candidate) => candidate.userId))] },
      deleted_at: null,
      global_variable_id: { in: [...new Set(candidates.flatMap((candidate) => candidate.items.map((item) => item.variableId)))] },
      start_at: { gte: new Date(`${days[0]}T00:00:00.000Z`), lt: new Date(Date.parse(`${days.at(-1)}T00:00:00.000Z`) + DAY) },
    },
    select: { user_id: true, global_variable_id: true, start_at: true },
  })
  const recordedKeys = new Set(
    recorded.map((row) => `${row.user_id}:${row.global_variable_id}:${row.start_at.toISOString().slice(0, 10)}`),
  )
  return candidates.filter((candidate) =>
    candidate.items.some((item) => !recordedKeys.has(`${candidate.userId}:${item.variableId}:${candidate.day}`)),
  )
}

/**
 * Claims the email of an enrollment and day for this run: a new claim, or the
 * claim of a run that stopped before it sent the email. False when another
 * run has it, or sent it.
 */
async function claim(key: { enrollment_id: string; local_date: Date }, now: Date): Promise<boolean> {
  try {
    await adminDb.check_in_emails.create({ data: { ...key, claimed_at: now }, select: { enrollment_id: true } })
    return true
  } catch (error) {
    if (!isUniqueViolation(error)) throw error
  }
  const { count } = await adminDb.check_in_emails.updateMany({
    where: { ...key, sent_at: null, claimed_at: { lt: new Date(now.getTime() - CLAIM_MINUTES * MINUTE) } },
    data: { claimed_at: now },
  })
  return count === 1
}

/**
 * Sends the check-in emails that are due. Each email of a day is sent once:
 * a run claims it first (two runs cannot both claim it) and marks it sent
 * after it went. A failed email loses its claim, so the next run tries again;
 * the claim of a run that stopped before it sent the email is taken over
 * after 15 minutes. A run stops claiming after 40 seconds, and the emails
 * that it did not reach stay due. Returns the counts.
 */
export async function sendCheckInEmails(now = new Date(), deadline = Date.now() + SEND_SECONDS * 1000) {
  const due = await dueCheckIns(now)
  const counts = { due: due.length, sent: 0, failed: 0, deferred: 0 }
  // One lookup for each company: it can ask the company's own domain whether it is connected.
  const companies = new Map<string, ReturnType<typeof companyOf>>()
  for (const [index, checkIn] of due.entries()) {
    if (Date.now() > deadline) {
      counts.deferred = due.length - index
      break
    }
    const key = { enrollment_id: checkIn.enrollmentId, local_date: new Date(`${checkIn.day}T00:00:00.000Z`) }
    if (!(await claim(key, now))) continue
    try {
      if (!companies.has(checkIn.instanceSlug)) companies.set(checkIn.instanceSlug, companyOf(checkIn.instanceSlug))
      const company = await companies.get(checkIn.instanceSlug)!
      if (!company) throw new Error('The instance of the program does not exist.')
      const brand: EmailBrand = {
        name: company.instance.name,
        primaryColor: company.instance.primaryColor,
        supportEmail: company.instance.supportEmail,
      }
      const url = (path: string) => companyPageUrl(company.instance.slug, path, company.origin)
      const pagePath = `/programs/${checkIn.program.slug}/check-in/${checkInToken(checkIn.enrollmentId, checkIn.day)}`
      await sendEmail(checkInEmail(checkIn, brand, url, pagePath))
    } catch (error) {
      counts.failed++
      logger.error('Could not send a check-in email', {
        enrollmentId: checkIn.enrollmentId,
        error: error instanceof Error ? error.message : String(error),
      })
      try {
        await adminDb.check_in_emails.deleteMany({ where: key })
      } catch (cleanup) {
        // The claim stays without sent_at, so a run takes it over after CLAIM_MINUTES.
        logger.error('Could not release the claim of a failed check-in email', {
          enrollmentId: checkIn.enrollmentId,
          day: checkIn.day,
          error: cleanup instanceof Error ? cleanup.message : String(cleanup),
        })
      }
      continue
    }
    counts.sent++
    try {
      await adminDb.check_in_emails.updateMany({ where: key, data: { sent_at: new Date() } })
    } catch (error) {
      // The email went; a run may send it again after CLAIM_MINUTES.
      logger.error('Could not mark a check-in email as sent', {
        enrollmentId: checkIn.enrollmentId,
        day: checkIn.day,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
  if (counts.deferred) logger.warn('The check-in emails did not fit in one run; the next run sends the rest', counts)
  return counts
}
