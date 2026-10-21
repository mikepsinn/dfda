import demo from '@/scripts/demo-data.json'
import { adminDb, Prisma } from '@/lib/db'
import { ensurePasswordUser } from '@/lib/auth-users'
import { EXAMPLE_REPORT } from '@/lib/biomarker-report/example'
import type { BiomarkerReport } from '@/lib/biomarker-report/schema'
import { PROGRAM_TEMPLATES } from '@/lib/programs/config'
import { findProgramById, reportItems, type Program } from '@/lib/programs/data'
import { joinProgram } from '@/lib/programs/manage'
import { buildPersonReport, type Point } from '@/lib/programs/report'
import { sampleCohort, SAMPLE_SIZE } from '@/lib/programs/sample'

/**
 * The demo clinic: a company instance (scripts/demo-data.json), its GLP-1
 * program, people who joined it, a demo patient with a week-12 biomarker
 * report, and a clinician on the care team. The people share their reports
 * with the care team. The local seed (scripts/seed-demo.ts) and the demo
 * sign-in (lib/actions/clinic-demo-login.ts) both use it, so a deployment gets
 * the demo on its first demo sign-in.
 *
 * All values are made up (lib/programs/sample.ts). Measurements feed only the
 * person's own report and the program's company totals, never the network's
 * evidence. The instance's branding is created once and not reset, so the
 * owner can change it for a demo.
 */

export const DEMO_CLINIC = demo

const DAY = 86_400_000

type Db = Prisma.TransactionClient

/**
 * The demo company's account, instance and program, created when missing,
 * with the instance's current address (the owner may change it).
 */
export async function ensureDemoClinic(): Promise<{ ownerId: string; program: Program; slug: string }> {
  const ownerId = await ensurePasswordUser(demo.company.email, demo.company.name, demo.password)
  const clinicianId = await ensurePasswordUser(demo.clinician.email, demo.clinician.name, demo.password)
  let instance = await adminDb.instances.findUnique({ where: { id: demo.instance.id }, select: { slug: true } })
  if (!instance) {
    instance = await adminDb.instances.create({
      data: {
        id: demo.instance.id,
        slug: demo.instance.slug,
        name: demo.instance.name,
        tagline: demo.instance.tagline,
        primary_color: demo.instance.primaryColor,
        products: demo.instance.products,
        owner_id: ownerId,
      },
      select: { slug: true },
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
  await adminDb.instance_clinicians.createMany({
    data: [{ instance_id: demo.instance.id, user_id: clinicianId }],
    skipDuplicates: true,
  })
  const program = await findProgramById(demo.program.id)
  if (!program) throw new Error('The demo program was not saved.')
  return { ownerId, program, slug: instance.slug }
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
    const name = demo.memberNames[index] ?? `Demo Member ${index + 1}`
    const user = { id: await ensurePasswordUser(email, name, demo.password) }
    // Members created before they had names keep their account; they get the name here.
    await adminDb.users.updateMany({ where: { id: user.id, name: { not: name } }, data: { name } })
    const joining = await joinProgram(user, program, { scheduleNotifications: false, shareWithCareTeam: true })
    if (joining.joined === false) continue
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

/** The demo patient's account, signed up for the program once. Returns the patient's user id. */
export async function ensureDemoPatient(program: Program): Promise<string> {
  const user = { id: await ensurePasswordUser(demo.patient.email, demo.patient.name, demo.password) }
  // The first time, this also creates the dose and check-in reminders.
  await joinProgram(user, program, { scheduleNotifications: false, shareWithCareTeam: true })
  return user.id
}

/** The demo accounts that joined the program. */
function demoEmails() {
  return [demo.patient.email, ...Array.from({ length: demo.people }, (_, index) => demo.memberEmail.replace('{n}', String(index + 1)))]
}

/**
 * The demo patient's week-12 report: the example report (lib/biomarker-report/example.ts)
 * with their name, the program and the clinic, dated at their follow-up.
 */
export function demoPatientReport(program: Program, startedAt: Date, clinicName: string): BiomarkerReport {
  const followUp = new Date(startedAt.getTime() + program.followUpWeeks * 7 * DAY)
  return {
    ...EXAMPLE_REPORT,
    reportDate: followUp.toISOString().slice(0, 10),
    person: { name: demo.patient.name, code: demo.report.code, age: EXAMPLE_REPORT.person.age },
    program: { ...EXAMPLE_REPORT.program, name: program.name },
    clinician: { name: demo.clinician.name, organization: clinicName, location: EXAMPLE_REPORT.clinician?.location },
  }
}

/** Saves the demo patient's report with the dates of their start; its review stays as it is. */
async function writeDemoReport(db: Db, program: Program, patientId: string, startedAt: Date) {
  const clinic = await db.instances.findUnique({ where: { id: demo.instance.id }, select: { name: true } })
  const report = demoPatientReport(program, startedAt, clinic?.name ?? demo.instance.name)
  const fields = {
    data: report,
    title: report.title,
    report_date: new Date(`${report.reportDate}T00:00:00Z`),
  }
  await db.biomarker_reports.upsert({
    where: { id: demo.report.id },
    create: { id: demo.report.id, program_id: program.id, user_id: patientId, ...fields },
    update: fields,
    select: { id: true },
  })
}

/**
 * The care team's side of the demo: the demo accounts share their reports
 * (also those that joined before there were care teams), and the patient has
 * their report. Other people in the program keep their own choice.
 */
export async function ensureDemoCareTeam(program: Program, patientId: string) {
  await adminDb.$transaction(async (tx) => {
    await tx.program_enrollments.updateMany({
      where: { program_id: program.id, shared_with_care_team_at: null, profiles: { email: { in: demoEmails() } } },
      data: { shared_with_care_team_at: new Date() },
    })
    const enrollment = await tx.program_enrollments.findUniqueOrThrow({
      where: { program_id_user_id: { program_id: program.id, user_id: patientId } },
      select: { started_at: true },
    })
    if (!(await tx.biomarker_reports.findUnique({ where: { id: demo.report.id }, select: { id: true } }))) {
      await writeDemoReport(tx, program, patientId, enrollment.started_at)
    }
  })
}

/** Clears the review of the demo patient's report, so that the next visitor can sign it off. */
export async function resetDemoReview(): Promise<void> {
  // The trigger on biomarker_reports clears the reviewer and the note too.
  await adminDb.biomarker_reports.updateMany({ where: { id: demo.report.id }, data: { reviewed_at: null } })
}

type DemoClinic = { program: Program; slug: string; patientId: string }

/**
 * The demo clinic when it is complete. The patient's report is created last,
 * so the report means that the members, the patient and the care team are
 * there too.
 */
async function readyDemoClinic(): Promise<DemoClinic | null> {
  const [instance, patient, report] = await Promise.all([
    adminDb.instances.findUnique({ where: { id: demo.instance.id }, select: { slug: true } }),
    adminDb.users.findUnique({ where: { email: demo.patient.email }, select: { id: true } }),
    adminDb.biomarker_reports.findUnique({ where: { id: demo.report.id }, select: { id: true } }),
  ])
  if (!instance || !patient || !report) return null
  const enrollment = await adminDb.program_enrollments.findUnique({
    where: { program_id_user_id: { program_id: demo.program.id, user_id: patient.id } },
    select: { id: true },
  })
  const program = enrollment && (await findProgramById(demo.program.id))
  return program ? { program, slug: instance.slug, patientId: patient.id } : null
}

/**
 * The demo clinic for a demo sign-in, created on first use: the company, the
 * instance, the program, the members and the patient. Returns at once when
 * they exist. Otherwise one sign-in at a time creates them, so two visitors
 * who open a new deployment's demo together do not create the same records
 * twice.
 */
export async function prepareDemoClinic(): Promise<DemoClinic> {
  const ready = await readyDemoClinic()
  if (ready) return ready
  return adminDb.$transaction(
    async (tx) => {
      // The lock lasts until this transaction ends; the work below uses other connections.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('demo-clinic'))`
      const done = await readyDemoClinic()
      if (done) return done
      const { program, slug } = await ensureDemoClinic()
      await ensureDemoMembers(program)
      const patientId = await ensureDemoPatient(program)
      await ensureDemoCareTeam(program, patientId)
      return { program, slug, patientId }
    },
    // Creating 12 accounts with their values takes a few seconds.
    { maxWait: 60_000, timeout: 120_000 },
  )
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
 * Gives the demo patient fresh values: anything recorded before, by them or
 * by a visitor trying the page, is replaced. Their report gets the new dates,
 * and reports that visitors added as the clinician are removed; the report's
 * review stays, so that the patient sees a clinician's sign-off.
 */
export async function resetDemoPatient(program: Program, patientId: string, now = new Date()): Promise<void> {
  const user = { id: patientId }
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
    await tx.biomarker_reports.deleteMany({ where: { user_id: user.id, program_id: program.id, id: { not: demo.report.id } } })
    await writeDemoReport(tx, program, user.id, startedAt)
  })
}
