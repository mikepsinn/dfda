"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { careTeamPatients } from "@/lib/care-team/data"
import {
  addClinician,
  CareTeamError,
  MAX_REPORT_FILE_BYTES,
  parseReportFile,
  removeClinician,
  removeReport,
  saveReport,
  setSharing,
  signOffReport,
} from "@/lib/care-team/manage"
import { dbAs } from "@/lib/db"
import { logger } from "@/lib/logger"
import { findProgramById } from "@/lib/programs/data"
import { getServerUser } from "@/lib/server-auth"

export type CareFormState = { error?: string; errors?: string[] }

const message = (error: unknown) => (error instanceof Error ? error.message : String(error))

/** The care team's instance with this slug, for the signed-in user; null when they are not on it. */
async function careTeamInstance(userId: string, slug: string) {
  const membership = await dbAs({ id: userId }).instance_clinicians.findFirst({
    where: { user_id: userId, instances: { slug } },
    select: { instances: { select: { id: true, slug: true } } },
  })
  return membership?.instances ?? null
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

/** Adds a clinician to the care team of the signed-in owner's instance. */
export async function addClinicianAction(instanceSlug: string, _state: CareFormState, formData: FormData): Promise<CareFormState> {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to change the care team." }
  const email = String(formData.get("email") ?? "").trim()
  if (!email.includes("@")) return { error: "Enter the clinician's email." }
  try {
    await addClinician(user, instanceSlug, email)
  } catch (error) {
    if (error instanceof CareTeamError) return { error: error.message }
    logger.error("Could not add a clinician", { userId: user.id, instanceSlug, error: message(error) })
    return { error: "Could not add the clinician. Try again." }
  }
  revalidatePath(`/instances/${instanceSlug}`)
  return {}
}

/** Removes a clinician from the care team of the signed-in owner's instance. */
export async function removeClinicianAction(instanceSlug: string, userId: string) {
  const user = await getServerUser()
  if (!user) redirect("/login")
  await removeClinician(user, instanceSlug, userId)
  revalidatePath(`/instances/${instanceSlug}`)
}
