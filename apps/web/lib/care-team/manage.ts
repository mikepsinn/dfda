import { dbAs, isUniqueViolation, withUserTransaction, type DbUser } from '@/lib/db'
import { biomarkerReportSchema, type BiomarkerReport } from '@/lib/biomarker-report/schema'
import { withGeneratedText } from '@/lib/biomarker-report/text'
import { careTeam } from './data'
import type { ReviewDecision } from './format'

export { MAX_REPORT_FILE_BYTES } from './format'

/**
 * Changes to care teams, sharing and biomarker reports, with the user's own
 * permissions; the database refuses what the user may not do (see
 * lib/care-team/data.ts). Server only.
 */

export class CareTeamError extends Error {}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * A report file (lib/biomarker-report/schema.ts), checked, with the summaries
 * that it leaves out written from its numbers (lib/biomarker-report/text.ts);
 * or what is wrong with it, at most 10 problems. The texts are written once,
 * here, so that a report does not change after a clinician signs it off.
 */
export function parseReportFile(text: string): { report: BiomarkerReport } | { errors: string[] } {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { errors: ['The file is not valid JSON.'] }
  }
  const parsed = biomarkerReportSchema.safeParse(json)
  if (parsed.success) return { report: withGeneratedText(parsed.data) }
  return {
    errors: parsed.error.issues.slice(0, 10).map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message)),
  }
}

/** Saves a checked report for a person who shares their reports with the user's care team. Returns its id. */
export async function saveReport(user: DbUser, input: { programId: string; patientId: string; report: BiomarkerReport }) {
  try {
    const row = await dbAs(user).biomarker_reports.create({
      data: {
        program_id: input.programId,
        user_id: input.patientId,
        data: input.report,
        title: input.report.title,
        report_date: new Date(`${input.report.reportDate}T00:00:00Z`),
        uploaded_by: user.id,
      },
      select: { id: true },
    })
    return row.id
  } catch (error) {
    if (error instanceof Error && /row-level security/.test(error.message)) {
      throw new CareTeamError('This person does not share their reports with your care team.')
    }
    throw error
  }
}

/**
 * Signs off a report as the user, with the care team's decision and an
 * optional note for the person. Only an open report: when two clinicians sign
 * off together, the first sign-off stays.
 */
export async function signOffReport(user: DbUser, reportId: string, decision: ReviewDecision, note: string) {
  const { count } = await dbAs(user).biomarker_reports.updateMany({
    where: { id: reportId, reviewed_at: null },
    data: { reviewed_by: user.id, reviewed_at: new Date(), review_decision: decision, review_note: note.trim() || null },
  })
  if (count === 0) throw new CareTeamError('This report is already signed off, or you cannot review it.')
}

/** Removes a report that nobody has signed off yet. */
export async function removeReport(user: DbUser, reportId: string) {
  const { count } = await dbAs(user).biomarker_reports.deleteMany({ where: { id: reportId, reviewed_at: null } })
  if (count === 0) throw new CareTeamError('Only a report that nobody has signed off yet can be removed.')
}

/** Starts or stops sharing the user's reports in a program with the instance's care team. */
export async function setSharing(user: DbUser, programId: string, share: boolean) {
  await dbAs(user).program_enrollments.updateMany({
    where: { program_id: programId, user_id: user.id },
    data: { shared_with_care_team_at: share ? new Date() : null },
  })
}

/** The result of an invitation: an invitation to email, or the owner on the care team at once. */
export type InviteResult = { invitationId: string; email: string } | { addedOwner: true }

/**
 * Invites the person with this email to the care team of the owner's
 * instance. The result is the same whether or not an account uses the email,
 * so the owner does not learn who has an account. Inviting an email again
 * renews its invitation. The owner's own email adds the owner at once.
 */
export async function inviteClinician(owner: DbUser, instanceSlug: string, email: string): Promise<InviteResult> {
  const address = email.trim().toLowerCase()
  const instance = await dbAs(owner).instances.findFirst({ where: { slug: instanceSlug, owner_id: owner.id }, select: { id: true } })
  if (!instance) throw new CareTeamError('This instance does not exist, or it is not yours.')

  if (address === owner.email?.toLowerCase()) {
    try {
      await dbAs(owner).instance_clinicians.create({ data: { instance_id: instance.id, user_id: owner.id }, select: { user_id: true } })
    } catch (error) {
      if (isUniqueViolation(error)) throw new CareTeamError('You are already on the care team.')
      throw error
    }
    return { addedOwner: true }
  }
  // The owner sees the emails of the care team already, so this tells them nothing new.
  if ((await careTeam(owner, instance.id)).some((member) => member.email.toLowerCase() === address)) {
    throw new CareTeamError('This clinician is already on the care team.')
  }
  const invitation = await dbAs(owner).care_team_invitations.upsert({
    where: { instance_id_email: { instance_id: instance.id, email: address } },
    create: { instance_id: instance.id, email: address, invited_by: owner.id },
    update: { invited_by: owner.id, created_at: new Date() },
    select: { id: true },
  })
  return { invitationId: invitation.id, email: address }
}

/** Cancels an open invitation to the care team of the owner's instance. */
export async function cancelInvitation(owner: DbUser, instanceSlug: string, invitationId: string) {
  await dbAs(owner).care_team_invitations.deleteMany({
    where: { id: invitationId, instances: { slug: instanceSlug, owner_id: owner.id } },
  })
}

/**
 * Accepts an invitation to the user's verified email: the user joins the care
 * team. Returns the instance's slug; null when the invitation is not open or
 * is for another email.
 */
export async function acceptInvitation(user: DbUser, invitationId: string): Promise<string | null> {
  if (!UUID.test(invitationId)) return null
  const instanceId = await withUserTransaction(user, async (tx) => {
    const rows = await tx.$queryRaw<{ instance_id: string | null }[]>`
      SELECT public.accept_care_team_invitation(${invitationId}::uuid) AS instance_id`
    return rows[0]?.instance_id ?? null
  })
  if (!instanceId) return null
  const instance = await dbAs(user).instances.findUnique({ where: { id: instanceId }, select: { slug: true } })
  return instance?.slug ?? null
}

/** Removes a clinician from the care team of the owner's instance. */
export async function removeClinician(owner: DbUser, instanceSlug: string, userId: string) {
  await dbAs(owner).instance_clinicians.deleteMany({
    where: { user_id: userId, instances: { slug: instanceSlug, owner_id: owner.id } },
  })
}
