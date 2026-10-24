"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isUniqueViolation } from "@/lib/db"
import { logger } from "@/lib/logger"
import { fetchUserProfile } from "@/lib/profile"
import { programInputSchema, type ProgramInput } from "@/lib/programs/config"
import { findProgramById } from "@/lib/programs/data"
import { joinProgram, leaveProgram, ProgramError, recordProgramValues, saveProgram } from "@/lib/programs/manage"
import { getServerUser } from "@/lib/server-auth"

export type ProgramFormState = {
  error?: string
  fieldErrors?: Partial<Record<keyof ProgramInput, string>>
}

function readForm(formData: FormData) {
  const field = (name: string) => String(formData.get(name) ?? "")
  return programInputSchema.safeParse({
    name: field("name"),
    slug: field("slug"),
    summary: field("summary"),
    followUpWeeks: field("followUpWeeks"),
    careTeamReview: formData.get("careTeamReview") === "on",
    items: field("items") || "[]",
  })
}

async function save(instanceSlug: string, formData: FormData, currentSlug?: string): Promise<ProgramFormState> {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to save the program." }
  const parsed = readForm(formData)
  if (!parsed.success) {
    return { fieldErrors: Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])) }
  }

  let slug: string
  try {
    slug = (await saveProgram(user, instanceSlug, parsed.data, currentSlug)).slug
  } catch (error) {
    if (error instanceof ProgramError) {
      return error.field ? { fieldErrors: { [error.field]: error.message } } : { error: error.message }
    }
    if (isUniqueViolation(error)) return { fieldErrors: { slug: "Another program of this instance uses this address." } }
    logger.error("Could not save the program", { userId: user.id, error: error instanceof Error ? error.message : String(error) })
    return { error: "Could not save the program. Try again." }
  }

  revalidatePath(`/instances/${instanceSlug}`)
  redirect(`/instances/${instanceSlug}/programs/${slug}?${currentSlug ? "saved" : "created"}=1`)
}

/** Creates a program on an instance of the signed-in user. */
export async function createProgramAction(instanceSlug: string, _state: ProgramFormState, formData: FormData) {
  return save(instanceSlug, formData)
}

/** Changes a program on an instance of the signed-in user. */
export async function updateProgramAction(
  instanceSlug: string,
  programSlug: string,
  _state: ProgramFormState,
  formData: FormData,
) {
  return save(instanceSlug, formData, programSlug)
}

/**
 * Joins a program, or opens sign-in first and comes back. The form's "share"
 * box shares the user's biomarker reports in the program with the care team;
 * a program with care team review shares them without the box.
 */
export async function joinProgramAction(programId: string, formData?: FormData) {
  const program = await findProgramById(programId)
  if (!program) redirect("/")
  const user = await getServerUser()
  if (!user) redirect(`/register?next=${encodeURIComponent(`/programs/${program.slug}`)}`)

  try {
    // The enrollment refers to the profile, which the first page load usually creates.
    await fetchUserProfile(user)
    await joinProgram(user, program, { shareWithCareTeam: formData?.get("share") === "on" })
  } catch (error) {
    logger.error("Could not join the program", {
      userId: user.id,
      programId,
      error: error instanceof Error ? error.message : String(error),
    })
    redirect(`/programs/${program.slug}?error=join`)
  }
  redirect(`/programs/${program.slug}/me?joined=1`)
}

/** Leaves a program; the company totals stop counting the user. */
export async function leaveProgramAction(programId: string) {
  const program = await findProgramById(programId)
  const user = await getServerUser()
  if (!program || !user) redirect("/")
  await leaveProgram(user, program.id)
  redirect(`/programs/${program.slug}?left=1`)
}

export type ValuesFormState = { error?: string; saved?: number }

/** Records a user's lab results, or doses and check-ins, for a program on one day. */
export async function recordProgramValuesAction(
  programId: string,
  kind: "lab" | "today",
  _state: ValuesFormState,
  formData: FormData,
): Promise<ValuesFormState> {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to save values." }
  const program = await findProgramById(programId)
  if (!program) return { error: "This program does not exist." }

  const values: Record<string, string> = {}
  for (const item of program.items) values[item.id] = String(formData.get(`value-${item.id}`) ?? "")
  try {
    const saved = await recordProgramValues(user, program, kind, String(formData.get("date") ?? ""), values)
    revalidatePath(`/programs/${program.slug}/me`)
    return { saved }
  } catch (error) {
    if (error instanceof ProgramError) return { error: error.message }
    logger.error("Could not record program values", {
      userId: user.id,
      programId,
      error: error instanceof Error ? error.message : String(error),
    })
    return { error: "Could not save the values. Try again." }
  }
}
