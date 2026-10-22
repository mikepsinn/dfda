import { notFound } from 'next/navigation'
import { adminDb, dbAs, withUserTransaction, type DbUser, type Prisma } from '@/lib/db'
import { biomarkerReportSchema, type BiomarkerReport } from '@/lib/biomarker-report/schema'
import { siteOrigin } from '@/lib/oauth-resources'
import { listPrograms, type Program } from '@/lib/programs/data'
import { getServerUser } from '@/lib/server-auth'

/**
 * Care teams and biomarker reports, with the user's own permissions. The
 * database decides who sees what
 * (db/migrations/20261021050000_table_care_teams_and_biomarker_reports.sql):
 * a person sees their own reports, and a clinician of an instance's care team
 * sees the people who share their reports with it, and those reports. The
 * owner invites clinicians by email
 * (db/migrations/20261021070000_table_care_team_invitations.sql). Server only.
 */

export type ReportSummary = {
  id: string
  title: string
  reportDate: Date
  createdAt: Date
  reviewedAt: Date | null
  reviewerName: string | null
  reviewNote: string | null
}

export type SavedReport = ReportSummary & { userId: string; programId: string; report: BiomarkerReport }

export type CarePatient = {
  enrollmentId: string
  userId: string
  name: string
  email: string
  program: Program
  startedAt: Date
  sharedAt: Date
  /** Newest first. */
  reports: ReportSummary[]
}

const summarySelect = {
  id: true,
  title: true,
  report_date: true,
  created_at: true,
  reviewed_at: true,
  reviewer_name: true,
  review_note: true,
} as const

type SummaryRow = Prisma.biomarker_reportsGetPayload<{ select: typeof summarySelect }>

function toSummary(row: SummaryRow): ReportSummary {
  return {
    id: row.id,
    title: row.title,
    reportDate: row.report_date,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
    reviewerName: row.reviewer_name,
    reviewNote: row.review_note,
  }
}

const newestFirst = [{ report_date: 'desc' as const }, { created_at: 'desc' as const }]

/** The care teams that the user is on. */
export async function careTeamsOf(user: DbUser) {
  const rows = await dbAs(user).instance_clinicians.findMany({
    where: { user_id: user.id },
    select: { instances: { select: { id: true, slug: true, name: true } } },
    orderBy: { created_at: 'asc' },
  })
  return rows.map((row) => row.instances)
}

/** The instance with this slug when the signed-in user is on its care team, or a 404 page. */
export async function requireCareTeam(slug: string) {
  const user = await getServerUser()
  if (!user) notFound()
  const membership = await dbAs(user).instance_clinicians.findFirst({
    where: { user_id: user.id, instances: { slug } },
    select: { instances: { select: { id: true, slug: true, name: true } } },
  })
  if (!membership) notFound()
  return { user, instance: membership.instances }
}

/** A row of the care_team_patients() function, which joins several tables; no Prisma model has its shape. */
type PatientRow = {
  enrollment_id: string
  user_id: string
  name: string | null
  email: string
  program_id: string
  started_at: Date
  shared_at: Date
}

/** The people who share their reports with the instance's care team, with their reports; empty for anyone not on it. */
export async function careTeamPatients(user: DbUser, instance: { id: string; slug: string }): Promise<CarePatient[]> {
  const rows = await withUserTransaction(user, (tx) =>
    tx.$queryRaw<PatientRow[]>`SELECT * FROM public.care_team_patients(${instance.id}::uuid)`,
  )
  if (rows.length === 0) return []
  const [programs, reports] = await Promise.all([
    listPrograms(instance.slug),
    dbAs(user).biomarker_reports.findMany({
      where: { OR: rows.map((row) => ({ user_id: row.user_id, program_id: row.program_id })) },
      select: { ...summarySelect, user_id: true, program_id: true },
      orderBy: newestFirst,
    }),
  ])
  const programById = new Map(programs.map((program) => [program.id, program]))
  return rows.flatMap((row) => {
    const program = programById.get(row.program_id)
    if (!program) return []
    return [
      {
        enrollmentId: row.enrollment_id,
        userId: row.user_id,
        name: row.name?.trim() || row.email,
        email: row.email,
        program,
        startedAt: row.started_at,
        sharedAt: row.shared_at,
        reports: reports
          .filter((report) => report.user_id === row.user_id && report.program_id === row.program_id)
          .map(toSummary),
      },
    ]
  })
}

/** One person on the care team's list, or a 404 page. */
export async function requireCarePatient(user: DbUser, instance: { id: string; slug: string }, enrollmentId: string) {
  const patient = (await careTeamPatients(user, instance)).find((row) => row.enrollmentId === enrollmentId)
  if (!patient) notFound()
  return patient
}

/** A report that the user may read, with its checked file; null when there is none. */
export async function findReport(user: DbUser, reportId: string): Promise<SavedReport | null> {
  const row = await dbAs(user).biomarker_reports.findUnique({
    where: { id: reportId },
    select: { ...summarySelect, user_id: true, program_id: true, data: true },
  })
  if (!row) return null
  const parsed = biomarkerReportSchema.safeParse(row.data)
  if (!parsed.success) return null
  return { ...toSummary(row), userId: row.user_id, programId: row.program_id, report: parsed.data }
}

/** The user's own reports in a program, newest first. */
export async function myReports(user: DbUser, programId: string): Promise<ReportSummary[]> {
  const rows = await dbAs(user).biomarker_reports.findMany({
    where: { user_id: user.id, program_id: programId },
    select: summarySelect,
    orderBy: newestFirst,
  })
  return rows.map(toSummary)
}

/** When the user started to share their reports in the program; null when they do not share. */
export async function sharedSince(user: DbUser, programId: string): Promise<Date | null> {
  const row = await dbAs(user).program_enrollments.findUnique({
    where: { program_id_user_id: { program_id: programId, user_id: user.id } },
    select: { shared_with_care_team_at: true },
  })
  return row?.shared_with_care_team_at ?? null
}

/**
 * The care team of an instance that `owner` owns, with names and emails;
 * empty for anyone else. The database returns the rows only to the owner;
 * the names come from the accounts of those rows.
 */
export async function careTeam(owner: DbUser, instanceId: string) {
  const rows = await dbAs(owner).instance_clinicians.findMany({
    where: { instance_id: instanceId, instances: { owner_id: owner.id } },
    select: { user_id: true, created_at: true },
    orderBy: { created_at: 'asc' },
  })
  if (rows.length === 0) return []
  const users = await adminDb.users.findMany({
    where: { id: { in: rows.map((row) => row.user_id) } },
    select: { id: true, name: true, email: true },
  })
  const byId = new Map(users.map((account) => [account.id, account]))
  return rows.map((row) => ({
    userId: row.user_id,
    name: byId.get(row.user_id)?.name || byId.get(row.user_id)?.email || 'Unknown account',
    email: byId.get(row.user_id)?.email ?? '',
    addedAt: row.created_at,
  }))
}

/**
 * The link that opens an invitation on the company's site: on its own domain
 * or subdomain (`companyOrigin`, lib/instance/hosts.ts companySiteOrigin), else
 * through its preview link on the main site.
 */
export function invitationUrl(slug: string, invitationId: string, companyOrigin: string | null): string {
  const path = `/care-teams/join/${invitationId}`
  return companyOrigin ? `${companyOrigin}${path}` : `${siteOrigin()}/i/${slug}?next=${encodeURIComponent(path)}`
}

export type CareTeamInvitation = { id: string; email: string; createdAt: Date }

/** The open invitations to the care team of an instance that `owner` owns, oldest first; empty for anyone else. */
export async function careTeamInvitations(owner: DbUser, instanceId: string): Promise<CareTeamInvitation[]> {
  const rows = await dbAs(owner).care_team_invitations.findMany({
    where: { instance_id: instanceId, instances: { owner_id: owner.id } },
    select: { id: true, email: true, created_at: true },
    orderBy: { created_at: 'asc' },
  })
  return rows.map((row) => ({ id: row.id, email: row.email, createdAt: row.created_at }))
}

/**
 * The open invitations to the user's email, with their instances. The
 * database returns them only when the user's email is verified
 * (db/migrations/20261021070000_table_care_team_invitations.sql).
 */
export async function invitationsFor(user: DbUser) {
  if (!user.email) return []
  const rows = await dbAs(user).care_team_invitations.findMany({
    where: { email: user.email.toLowerCase() },
    select: { id: true, instances: { select: { slug: true, name: true } } },
    orderBy: { created_at: 'asc' },
  })
  return rows.map((row) => ({ id: row.id, instance: row.instances }))
}
