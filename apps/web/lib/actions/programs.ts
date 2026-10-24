"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import { isUniqueViolation } from "@/lib/db"
import { logger } from "@/lib/logger"
import { fetchUserProfile } from "@/lib/profile"
import { programInputSchema, type ProgramInput } from "@/lib/programs/config"
import { chatAvailable, chatReply, logChatTurn, type ChatMessage } from "@/lib/programs/chat"
import { findCheckIn } from "@/lib/programs/check-in"
import { findProgramById, type ProgramItem } from "@/lib/programs/data"
import { joinProgram, leaveProgram, ProgramError, recordProgramValues, saveProgram } from "@/lib/programs/manage"
import { addSideEffect, mySideEffects, removeSideEffect } from "@/lib/programs/side-effects"
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

/** The values of the form's fields, and the units chosen for them, by item id. */
function formValues(items: ProgramItem[], formData: FormData) {
  const values: Record<string, string> = {}
  const units: Record<string, string> = {}
  for (const item of items) {
    values[item.id] = String(formData.get(`value-${item.id}`) ?? "")
    const unit = formData.get(`unit-${item.id}`)
    if (typeof unit === "string" && unit) units[item.id] = unit
  }
  return { values, units }
}

function valuesError(error: unknown, context: Record<string, unknown>): ValuesFormState {
  if (error instanceof ProgramError) return { error: error.message }
  logger.error("Could not record program values", {
    ...context,
    error: error instanceof Error ? error.message : String(error),
  })
  return { error: "Could not save the values. Try again." }
}

/** Records a user's lab results, or doses, check-ins and side effects, for a program on one day. */
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

  try {
    const items = kind === "today" ? [...program.items, ...(await mySideEffects(user))] : program.items
    const { values, units } = formValues(items, formData)
    const saved = await recordProgramValues(user, program, kind, String(formData.get("date") ?? ""), values, { items, units })
    revalidatePath(`/programs/${program.slug}/me`)
    return { saved }
  } catch (error) {
    return valuesError(error, { userId: user.id, programId })
  }
}

/**
 * Records the day of a check-in link (lib/programs/check-in.ts) without a
 * sign-in: the link's signature is the permission, for its member, program
 * and day only.
 */
export async function recordCheckInAction(token: string, _state: ValuesFormState, formData: FormData): Promise<ValuesFormState> {
  const checkIn = await findCheckIn(token)
  if (!checkIn) return { error: "This link is too old. Open your program to record the day." }
  try {
    const { values, units } = formValues(checkIn.items, formData)
    const saved = await recordProgramValues({ id: checkIn.userId }, checkIn.program, "today", checkIn.day, values, {
      items: checkIn.items,
      units,
    })
    return { saved }
  } catch (error) {
    return valuesError(error, { enrollmentId: checkIn.enrollmentId })
  }
}

export type SideEffectFormState = { error?: string; added?: string }

/** Starts to track a side effect for a member of a program: a daily reminder, and today's rating when they gave one. */
export async function addSideEffectAction(
  programId: string,
  _state: SideEffectFormState,
  formData: FormData,
): Promise<SideEffectFormState> {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to add a side effect." }
  const program = await findProgramById(programId)
  if (!program) return { error: "This program does not exist." }
  try {
    const item = await addSideEffect(user, program, {
      variableId: String(formData.get("variableId") ?? ""),
      value: String(formData.get("value") ?? ""),
      date: String(formData.get("date") ?? ""),
    })
    revalidatePath(`/programs/${program.slug}/me`)
    return { added: item.name }
  } catch (error) {
    if (error instanceof ProgramError) return { error: error.message }
    logger.error("Could not add a side effect", {
      userId: user.id,
      programId,
      error: error instanceof Error ? error.message : String(error),
    })
    return { error: "Could not add the side effect. Try again." }
  }
}

/** Stops tracking a side effect: deletes the user's reminders for it. */
export async function removeSideEffectAction(programId: string, variableId: string) {
  const user = await getServerUser()
  if (!user) redirect("/login")
  const program = await findProgramById(programId)
  if (!program) return
  await removeSideEffect(user, variableId)
  revalidatePath(`/programs/${program.slug}/me`)
}

const chatSchema = z
  .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().trim().min(1).max(2000) }))
  .min(1)
  .max(40)
  .refine((messages) => messages[0].role === "user" && messages.at(-1)!.role === "user", "The chat starts and ends with a message of the member.")

export type ChatActionResult = { reply?: string; actions?: string[]; error?: string }

/** The check-in chat's answer to the member's last message (lib/programs/chat.ts), for a demo patient only. */
export async function checkInChatAction(programId: string, messages: ChatMessage[]): Promise<ChatActionResult> {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to chat." }
  const program = await findProgramById(programId)
  if (!program || !(await chatAvailable(user, program))) return { error: "The chat is not available." }
  const parsed = chatSchema.safeParse(messages)
  if (!parsed.success) return { error: "Write a shorter message, or start a new chat." }
  if ((await logChatTurn(user, program.instanceId)).limited) return { error: "The chat answered the most messages for today. Try again tomorrow." }

  try {
    const { text, actions } = await chatReply(user, program, parsed.data)
    if (actions.length) revalidatePath(`/programs/${program.slug}/me`)
    return { reply: text, actions }
  } catch (error) {
    logger.error("The check-in chat could not answer", {
      userId: user.id,
      programId,
      status: error instanceof Anthropic.APIError ? error.status : undefined,
      error: error instanceof Error ? error.message : String(error),
    })
    return { error: "The chat could not answer. Try again." }
  }
}
