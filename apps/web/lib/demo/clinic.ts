import demo from '@/scripts/demo-data.json'
import { adminDb, Prisma } from '@/lib/db'
import { ensurePasswordUser } from '@/lib/auth-users'
import { PROGRAM_TEMPLATES } from '@/lib/programs/config'
import { findProgramById, reportItems, type Program } from '@/lib/programs/data'
import { joinProgram } from '@/lib/programs/manage'
import { buildPersonReport, type Point } from '@/lib/programs/report'
import { sampleCohort, SAMPLE_SIZE } from '@/lib/programs/sample'

/**
 * The demo clinic: a company instance (scripts/demo-data.json), its GLP-1
 * program, people who joined it, and a demo patient. The local seed
 * (scripts/seed-demo.ts) and the demo sign-in (lib/actions/clinic-demo-login.ts)
 * both use it, so a deployment gets the demo on its first demo sign-in.
 *
 * All values are made up (lib/programs/sample.ts). Measurements feed only the
 * person's own report and the program's company totals, never the network's
 * evidence. The instance's branding is created once and not reset, so the
 * owner can change it for a demo.
 */

export const DEMO_CLINIC = demo

const DAY = 86_400_000

type Db = Prisma.TransactionClient

/** The demo company's account, instance and program, created when missing. */
export async function ensureDemoClinic(): Promise<{ ownerId: string; program: Program }> {
  const ownerId = await ensurePasswordUser(demo.company.email, demo.company.name, demo.password)
  const instance = await adminDb.instances.findUnique({ where: { id: demo.instance.id }, select: { id: true } })
  if (!instance) {
    await adminDb.instances.create({
      data: {
        id: demo.instance.id,
        slug: demo.instance.slug,
        name: demo.instance.name,
        tagline: demo.instance.tagline,
        primary_color: demo.instance.primaryColor,
        products: demo.instance.products,
        owner_id: ownerId,
      },
      select: { id: true },
    })
  }

  if (!(await adminDb.instance_programs.findUnique({ where: { id: demo.program.id }, select: { id: true } }))) {
    const template = PROGRAM_TEMPLATES.find((candidate) => candidate.key === demo.program.template)
    if (!template) throw new Error(`No program template "${demo.program.template}".`)
    const known = new Set(
      (
        await adminDb.global_variables.findMany({
          where: { id: { in: template.items.map((item) => item.variableId) } },
          select: { id: true },
        })
      ).map((variable) => variable.id),
    )
    await adminDb.instance_programs.create({
      data: {
        id: demo.program.id,
        instance_id: demo.instance.id,
        slug: template.slug,
        name: template.name,
        summary: template.summary,
        follow_up_weeks: template.followUpWeeks,
        instance_program_items: {
          create: template.items
            .filter((item) => known.has(item.variableId))
            .map((item, position) => ({
              kind: item.kind,
              global_variable_id: item.variableId,
              frequency: item.kind === 'lab' ? null : item.frequency,
              better: item.kind === 'dose' ? null : item.better,
              default_value: item.kind === 'dose' ? item.defaultValue : null,
              position,
            })),
        },
      },
      select: { id: true },
    })
  }
  const program = await findProgramById(demo.program.id)
  if (!program) throw new Error('The demo program was not saved.')
  return { ownerId, program }
}

/** Writes made-up values of the program's variables for a user. */
async function writeValues(db: Db, userId: string, program: Program, series: Map<string, Point[]>) {
  for (const item of program.items) {
    const points = series.get(item.variableId)
    if (!points?.length) continue
    const userVariable = await db.user_variables.upsert({
      where: { user_id_global_variable_id: { user_id: userId, global_variable_id: item.variableId } },
      create: { user_id: userId, global_variable_id: item.variableId },
      update: {},
      select: { id: true },
    })
    await db.measurements.createMany({
      data: points.map((point) => ({
        user_id: userId,
        global_variable_id: item.variableId,
        user_variable_id: userVariable.id,
        value: point.value,
        unit_id: item.unitId,
        start_at: point.at,
        notes: 'Demo data',
      })),
    })
  }
}

/**
 * The same made-up people as the program's "Sample data" view, as real
 * accounts that joined the program, for the company totals. People who
 * already joined are left as they are. Returns how many joined now.
 */
export async function ensureDemoMembers(program: Program, now = new Date()): Promise<number> {
  const people = sampleCohort({
    seedKey: program.id,
    items: program.items,
    followUpWeeks: program.followUpWeeks,
    now,
    size: demo.people,
  })
  let joined = 0
  for (const [index, person] of people.entries()) {
    const email = demo.memberEmail.replace('{n}', String(index + 1))
    const user = { id: await ensurePasswordUser(email, `Demo Member ${index + 1}`, demo.password) }
    if ((await joinProgram(user, program, { scheduleNotifications: false })).joined === false) continue
    await adminDb.$transaction(async (tx) => {
      await tx.program_enrollments.updateMany({
        where: { program_id: program.id, user_id: user.id },
        data: { started_at: person.startedAt },
      })
      await writeValues(tx, user.id, program, person.series)
    })
    joined++
  }
  return joined
}

/** Whether the program already has its demo members, so a demo sign-in can skip them. */
export async function hasDemoMembers(program: Program): Promise<boolean> {
  return (await adminDb.program_enrollments.count({ where: { program_id: program.id } })) >= demo.people
}

/**
 * The demo patient's values: of the made-up people who finished the program,
 * the one with the most improved measures, moved in time so that their
 * follow-up was two days before `now`.
 */
export function demoPatientValues(program: Program, now: Date) {
  const people = sampleCohort({
    seedKey: `${program.id}:patient`,
    items: program.items,
    followUpWeeks: program.followUpWeeks,
    now,
    size: SAMPLE_SIZE,
  })
  const items = reportItems(program)
  const improved = (person: (typeof people)[number]) => {
    const report = buildPersonReport(items, person.series, person.startedAt, program.followUpWeeks)
    if (report.measures.some((measure) => measure.status === 'waiting')) return -1
    return report.measures.filter((measure) => measure.status === 'improved').length
  }
  const best = people.reduce((winner, person) => (improved(person) > improved(winner) ? person : winner))

  const today = Math.floor(now.getTime() / DAY) * DAY
  const startedAt = new Date(today - (program.followUpWeeks * 7 + 2) * DAY)
  const shift = startedAt.getTime() - best.startedAt.getTime()
  const series = new Map(
    [...best.series].map(([variableId, points]) => [
      variableId,
      points.map((point) => ({ at: new Date(point.at.getTime() + shift), value: point.value })),
    ]),
  )
  return { startedAt, series }
}

/**
 * Signs the demo patient up for the program, once, and gives them fresh
 * values on each call: anything recorded before, by them or by a visitor
 * trying the page, is replaced. Returns the patient's user id.
 */
export async function resetDemoPatient(program: Program, now = new Date()): Promise<string> {
  const user = { id: await ensurePasswordUser(demo.patient.email, demo.patient.name, demo.password) }
  // The first time, this also creates the dose and check-in reminders.
  await joinProgram(user, program, { scheduleNotifications: false })
  const { startedAt, series } = demoPatientValues(program, now)

  await adminDb.$transaction(async (tx) => {
    // One reset at a time: two visitors who sign in together must not get the values twice.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`demo-patient:${program.id}`}))`
    await tx.measurements.deleteMany({
      where: { user_id: user.id, global_variable_id: { in: program.items.map((item) => item.variableId) } },
    })
    await tx.program_enrollments.updateMany({
      where: { program_id: program.id, user_id: user.id },
      data: { started_at: startedAt },
    })
    await writeValues(tx, user.id, program, series)
  })
  return user.id
}
