"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { careTeamPatients, invitationUrl } from "@/lib/care-team/data"
import {
  acceptInvitation,
  cancelInvitation,
  CareTeamError,
  inviteClinician,
  type InviteResult,
  MAX_REPORT_FILE_BYTES,
  parseReportFile,
  removeClinician,
  removeReport,
  saveReport,
  setSharing,
  signOffReport,
} from "@/lib/care-team/manage"
import { dbAs } from "@/lib/db"
import { linkEmail, sendEmail } from "@/lib/email"
import { companySiteOrigin, findInstanceBySlug } from "@/lib/instance/hosts"
import { isDomainConfigured } from "@/lib/instance/vercel-domains"
import { logger } from "@/lib/logger"
import { findProgramById } from "@/lib/programs/data"
import { getServerUser } from "@/lib/server-auth"

export type CareFormState = { error?: string; errors?: string[]; notice?: string }

const message = (error: unknown) => (error instanceof Error ? error.message : String(error))

/** The care team's instance with this slug, for the signed-in user; null when they are not on it. */
async function careTeamInstance(userId: string, slug: string) {
  const membership = await dbAs({ id: userId }).instance_clinicians.findFirst({
    where: { user_id: userId, instances: { slug } },
    select: { instances: { select: { id: true, slug: true } } },
  })
  return membership?.instances ?? null
}

/** The company of an instance for its emails, and the address of its site. */
async function companyOf(slug: string) {
  const instance = await findInstanceBySlug(slug)
  if (!instance) return null
  const domainConnected = instance.customDomain ? await isDomainConfigured(instance.customDomain, instance.slug) : null
  return { instance, origin: companySiteOrigin(instance, domainConnected) }
}

/** Adds a report file for a person who shares their reports with the care team, then opens the report. */
export async function uploadReportAction(
  instanceSlug: string,
  enrollmentId: string,
  _state: CareFormState,
  formData: FormData,
): Promise<CareFormState> {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to add a report." }
  const instance = await careTeamInstance(user.id, instanceSlug)
  const patient = instance && (await careTeamPatients(user, instance)).find((row) => row.enrollmentId === enrollmentId)
  if (!instance || !patient) return { error: "This person does not share their reports with your care team." }

  const file = formData.get("file")
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a report file." }
  if (file.size > MAX_REPORT_FILE_BYTES) return { error: "The file is larger than 900 KB." }
  const parsed = parseReportFile(await file.text())
  if ("errors" in parsed) return { error: "The file is not a valid report.", errors: parsed.errors }

  let reportId: string
  try {
    reportId = await saveReport(user, { programId: patient.program.id, patientId: patient.userId, report: parsed.report })
  } catch (error) {
    if (error instanceof CareTeamError) return { error: error.message }
    logger.error("Could not save a biomarker report", { userId: user.id, enrollmentId, error: message(error) })
    return { error: "Could not save the report. Try again." }
  }
  revalidatePath(`/instances/${instanceSlug}/care`)
  redirect(`/instances/${instanceSlug}/care/${enrollmentId}/reports/${reportId}?added=1`)
}

/** Signs off a report as the signed-in clinician, with an optional note for the person. */
export async function signOffReportAction(
  instanceSlug: string,
  enrollmentId: string,
  reportId: string,
  _state: CareFormState,
  formData: FormData,
): Promise<CareFormState> {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to sign off the report." }
  const note = String(formData.get("note") ?? "")
  if (note.length > 2000) return { error: "Keep the note under 2,000 characters." }
  try {
    await signOffReport(user, reportId, note)
  } catch (error) {
    if (error instanceof CareTeamError) return { error: error.message }
    logger.error("Could not sign off a biomarker report", { userId: user.id, reportId, error: message(error) })
    return { error: "Could not sign off the report. Try again." }
  }
  revalidatePath(`/instances/${instanceSlug}/care`)
  redirect(`/instances/${instanceSlug}/care/${enrollmentId}/reports/${reportId}?signed=1`)
}

/** Removes a report that nobody has signed off yet. */
export async function removeReportAction(instanceSlug: string, enrollmentId: string, reportId: string) {
  const user = await getServerUser()
  if (!user) redirect("/login")
  try {
    await removeReport(user, reportId)
  } catch (error) {
    if (!(error instanceof CareTeamError)) {
      logger.error("Could not remove a biomarker report", { userId: user.id, reportId, error: message(error) })
    }
    redirect(`/instances/${instanceSlug}/care/${enrollmentId}/reports/${reportId}?error=remove`)
  }
  revalidatePath(`/instances/${instanceSlug}/care`)
  redirect(`/instances/${instanceSlug}/care/${enrollmentId}?removed=1`)
}

/** Starts or stops sharing the signed-in user's reports in a program with the care team. */
export async function setSharingAction(programId: string, share: boolean) {
  const user = await getServerUser()
  const program = await findProgramById(programId)
  if (!user || !program) redirect("/")
  await setSharing(user, programId, share)
  revalidatePath(`/programs/${program.slug}/me`)
  redirect(`/programs/${program.slug}/me?sharing=${share ? "on" : "off"}`)
}

/**
 * Invites a clinician to the care team of the signed-in owner's instance and
 * emails them the link. The owner sees the same result whether or not an
 * account uses the email. When the email cannot be sent, the invitation stays
 * and the owner can send its link themselves.
 */
export async function inviteClinicianAction(instanceSlug: string, _state: CareFormState, formData: FormData): Promise<CareFormState> {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to change the care team." }
  const email = String(formData.get("email") ?? "").trim()
  if (!/^[^\s@]+@[^\s@]+$/.test(email) || email.length > 320) return { error: "Enter the clinician's email." }
  let result: InviteResult
  try {
    result = await inviteClinician(user, instanceSlug, email)
  } catch (error) {
    if (error instanceof CareTeamError) return { error: error.message }
    logger.error("Could not invite a clinician", { userId: user.id, instanceSlug, error: message(error) })
    return { error: "Could not save the invitation. Try again." }
  }
  revalidatePath(`/instances/${instanceSlug}`)
  if ("addedOwner" in result) return { notice: "You are on the care team now." }

  const company = await companyOf(instanceSlug)
  if (!company) return { error: "This instance does not exist." }
  const { instance, origin } = company
  try {
    await sendEmail(
      linkEmail(
        result.email,
        `Join the ${instance.name} care team`,
        `${instance.name} invites you to its care team. On the care team you see the people who share their biomarker reports with ${instance.name}, and you review their reports. Open the link and sign in with this email address to join.`,
        "Open the invitation",
        invitationUrl(instance.slug, result.invitationId, origin),
        { name: instance.name, primaryColor: instance.primaryColor, supportEmail: instance.supportEmail },
      ),
    )
  } catch (error) {
    logger.error("Could not send a care team invitation", { userId: user.id, instanceSlug, error: message(error) })
    return { error: `Could not send the email to ${result.email}. Send them the invitation link below.` }
  }
  return { notice: `We sent an invitation to ${result.email}.` }
}

/** Cancels an open invitation to the care team of the signed-in owner's instance. */
export async function cancelInvitationAction(instanceSlug: string, invitationId: string) {
  const user = await getServerUser()
  if (!user) redirect("/login")
  await cancelInvitation(user, instanceSlug, invitationId)
  revalidatePath(`/instances/${instanceSlug}`)
}

/** Joins the care team of an invitation to the signed-in user's email, then opens the care area. */
export async function acceptInvitationAction(invitationId: string) {
  const user = await getServerUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/care-teams/join/${invitationId}`)}`)
  const slug = await acceptInvitation(user, invitationId)
  if (!slug) redirect(`/care-teams/join/${invitationId}`)
  revalidatePath("/instances")
  redirect(`/instances/${slug}/care?joined=1`)
}

/** Removes a clinician from the care team of the signed-in owner's instance. */
export async function removeClinicianAction(instanceSlug: string, userId: string) {
  const user = await getServerUser()
  if (!user) redirect("/login")
  await removeClinician(user, instanceSlug, userId)
  revalidatePath(`/instances/${instanceSlug}`)
}
