"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isUniqueViolation } from "@/lib/db"
import { getUserDb } from "@/lib/db/server"
import { pageInputSchema, type PageInput } from "@/lib/instance/pages"
import { logger } from "@/lib/logger"
import { getServerUser } from "@/lib/server-auth"

export type PageFormState = {
  error?: string
  fieldErrors?: Partial<Record<keyof PageInput, string>>
}

function readForm(formData: FormData) {
  const field = (name: string) => String(formData.get(name) ?? "")
  return pageInputSchema.safeParse({
    title: field("title"),
    slug: field("slug"),
    body: field("body"),
    inMenu: formData.get("inMenu") === "on",
  })
}

/** The signed-in user's instance with this slug. Row-level security also refuses other users' pages. */
async function ownedInstance(userId: string, instanceSlug: string) {
  const db = await getUserDb()
  const instance = await db.instances.findFirst({ where: { slug: instanceSlug, owner_id: userId }, select: { id: true } })
  return { db, instance }
}

async function save(instanceSlug: string, formData: FormData, currentSlug?: string): Promise<PageFormState> {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to save the page." }
  const parsed = readForm(formData)
  if (!parsed.success) {
    return { fieldErrors: Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])) }
  }

  const data = { slug: parsed.data.slug, title: parsed.data.title, body: parsed.data.body, in_menu: parsed.data.inMenu }
  try {
    const { db, instance } = await ownedInstance(user.id, instanceSlug)
    if (!instance) return { error: "This instance does not exist, or it is not yours." }
    if (currentSlug) {
      const { count } = await db.instance_pages.updateMany({
        where: { instance_id: instance.id, slug: currentSlug },
        data: { ...data, updated_at: new Date() },
      })
      if (count === 0) return { error: "This page does not exist any more." }
    } else {
      await db.instance_pages.create({ data: { ...data, instance_id: instance.id }, select: { id: true } })
    }
  } catch (error) {
    if (isUniqueViolation(error)) return { fieldErrors: { slug: "Another page of this instance uses this address." } }
    logger.error("Could not save the page", { userId: user.id, error: error instanceof Error ? error.message : String(error) })
    return { error: "Could not save the page. Try again." }
  }

  revalidatePath(`/instances/${instanceSlug}`)
  redirect(`/instances/${instanceSlug}/pages/${parsed.data.slug}?${currentSlug ? "saved" : "created"}=1`)
}

/** Creates a content page on an instance of the signed-in user. */
export async function createPageAction(instanceSlug: string, _state: PageFormState, formData: FormData) {
  return save(instanceSlug, formData)
}

/** Changes a content page on an instance of the signed-in user. */
export async function updatePageAction(instanceSlug: string, pageSlug: string, _state: PageFormState, formData: FormData) {
  return save(instanceSlug, formData, pageSlug)
}

/** Deletes a content page on an instance of the signed-in user. */
export async function deletePageAction(instanceSlug: string, pageSlug: string) {
  const user = await getServerUser()
  if (!user) redirect("/login")
  const { db, instance } = await ownedInstance(user.id, instanceSlug)
  if (instance) await db.instance_pages.deleteMany({ where: { instance_id: instance.id, slug: pageSlug } })
  revalidatePath(`/instances/${instanceSlug}`)
  redirect(`/instances/${instanceSlug}`)
}
