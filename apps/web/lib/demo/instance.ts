import demo from '@/scripts/demo-data.json'
import { ensurePasswordUser } from '@/lib/auth-users'
import { adminDb } from '@/lib/db'
import { listPrograms, type Program } from '@/lib/programs/data'
import { demoPatientReport, demoPatientValues, writeValues } from './clinic'
import { instanceDemoAccounts } from './instance-accounts'

/**
 * Demo mode of a company's site: visitors try the site as a demo patient,
 * with the example report in the site's first program, and as a demo
 * clinician on its care team, who opens that patient's case. The owner turns
 * it on at /instances/{slug} only while nobody has joined the company's
 * programs, and the first person who joins ends it
 * (lib/demo/instance-accounts.ts), so that the demo accounts, which any
 * visitor can use, never see a real person. The demo patient's values and
 * report are made up, as in the demo clinic (lib/demo/clinic.ts).
 */

export class DemoUnavailable extends Error {}

export type InstanceDemoRole = 'patient' | 'clinician'

/** Why the owner cannot turn the demo on yet; null when they can. */
export async function instanceDemoProblem(instanceId: string): Promise<string | null> {
  if (!(await adminDb.instance_programs.count({ where: { instance_id: instanceId } }))) {
    return 'Add a program first, then turn on the demo.'
  }
  const { patient, clinician } = instanceDemoAccounts(instanceId)
  const joined = await adminDb.program_enrollments.count({
    where: { instance_programs: { instance_id: instanceId }, profiles: { email: { notIn: [patient, clinician] } } },
  })
  return joined ? 'The demo is only for a site that nobody has joined yet: its demo clinician would see them.' : null
}

/** The program of the demo: the first one in which the care team reviews the reports, or the first one. */
async function demoProgram(slug: string): Promise<Program | null> {
  const programs = await listPrograms(slug)
  return programs.find((program) => program.careTeamReview) ?? programs[0] ?? null
}

/**
 * The demo for a sign-in: the accounts, the clinician on the care team, and
 * the patient in the program with fresh values and the example report. A
 * clinician's sign-in clears the report's review, so that they can sign it
 * off; a patient's keeps it, so that they see the review. One sign-in at a
 * time per site.
 */
export async function prepareInstanceDemo(instanceId: string, role: InstanceDemoRole) {
  const instance = await adminDb.instances.findUnique({ where: { id: instanceId }, select: { slug: true, name: true, demo_enabled: true } })
  if (!instance?.demo_enabled) throw new DemoUnavailable('This site has no demo.')
  const program = await demoProgram(instance.slug)
  if (!program) throw new DemoUnavailable('This site has no program yet.')
  const accounts = instanceDemoAccounts(instanceId)
  const patientId = await ensurePasswordUser(accounts.patient, demo.patient.name, accounts.password)
  const clinicianId = await ensurePasswordUser(accounts.clinician, demo.clinician.name, accounts.password)

  const enrollmentId = await adminDb.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`instance-demo:${instanceId}`}))`
      // A person may have joined, and so ended the demo, since the check above.
      const current = await tx.instances.findUnique({ where: { id: instanceId }, select: { demo_enabled: true } })
      if (!current?.demo_enabled) throw new DemoUnavailable('This site has no demo.')

      await tx.instance_clinicians.createMany({ data: [{ instance_id: instanceId, user_id: clinicianId }], skipDuplicates: true })
      const { startedAt, series } = demoPatientValues(program, new Date())
      const enrollment = await tx.program_enrollments.upsert({
        where: { program_id_user_id: { program_id: program.id, user_id: patientId } },
        create: { program_id: program.id, user_id: patientId, started_at: startedAt, shared_with_care_team_at: startedAt },
        update: { started_at: startedAt, shared_with_care_team_at: startedAt },
        select: { id: true },
      })
      await tx.measurements.deleteMany({ where: { user_id: patientId, global_variable_id: { in: program.items.map((item) => item.variableId) } } })
      await writeValues(tx, patientId, program, series)

      const report = demoPatientReport(program, startedAt, instance.name)
      const fields = { data: report, title: report.title, report_date: new Date(`${report.reportDate}T00:00:00Z`) }
      const kept = await tx.biomarker_reports.findFirst({
        where: { user_id: patientId, program_id: program.id },
        orderBy: { created_at: 'asc' },
        select: { id: true },
      })
      // Reports that a visitor added as the clinician go; the demo's own report stays, with its review for a patient.
      await tx.biomarker_reports.deleteMany({ where: { user_id: patientId, program_id: program.id, ...(kept ? { id: { not: kept.id } } : {}) } })
      if (kept) {
        // Clearing reviewed_at also clears the reviewer, the note and the decision (a trigger on biomarker_reports).
        await tx.biomarker_reports.update({ where: { id: kept.id }, data: { ...fields, ...(role === 'clinician' ? { reviewed_at: null } : {}) } })
      } else {
        await tx.biomarker_reports.create({ data: { ...fields, program_id: program.id, user_id: patientId }, select: { id: true } })
      }
      return enrollment.id
    },
    { maxWait: 30_000, timeout: 60_000 },
  )
  return { program, slug: instance.slug, enrollmentId, email: role === 'patient' ? accounts.patient : accounts.clinician, password: accounts.password }
}
