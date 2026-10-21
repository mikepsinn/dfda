"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { isUniqueViolation } from "@/lib/db"
import { getUserDb } from "@/lib/db/server"
import { instanceInputSchema, type InstanceInput } from "@/lib/instance/config"
import { addDomainToProject } from "@/lib/instance/vercel-domains"
import { logger } from "@/lib/logger"
import { getServerUser } from "@/lib/server-auth"

export type InstanceFormState = {
  error?: string
  fieldErrors?: Partial<Record<keyof InstanceInput, string>>
}

function readForm(formData: FormData) {
  const field = (name: string) => String(formData.get(name) ?? "")
  return instanceInputSchema.safeParse({
    name: field("name"),
    slug: field("slug"),
    tagline: field("tagline"),
    logoUrl: field("logoUrl"),
    primaryColor: field("primaryColor"),
    backgroundColor: field("backgroundColor"),
    font: field("font"),
    cornerRadius: field("cornerRadius"),
    products: field("products"),
    customDomain: field("customDomain"),
  })
}

function toRow(input: InstanceInput) {
  return {
    slug: input.slug,
    name: input.name,
    tagline: input.tagline,
    logo_url: input.logoUrl,
    primary_color: input.primaryColor,
    background_color: input.backgroundColor,
    font: input.font,
    corner_radius: input.cornerRadius,
    products: input.products,
    custom_domain: input.customDomain,
  }
}

function uniqueError(error: unknown): InstanceFormState | null {
  if (!isUniqueViolation(error)) return null
  const target = String((error as { meta?: { target?: unknown } }).meta?.target ?? "")
  return target.includes("custom_domain")
    ? { fieldErrors: { customDomain: "Another instance uses this domain." } }
    : { fieldErrors: { slug: "This address is taken. Choose another." } }
}

/** Adds a new or changed domain to the Vercel project, and reports the result in the URL. */
async function domainStatusParam(domain: string | null, previous: string | null) {
  if (!domain || domain === previous) return ""
  const setup = await addDomainToProject(domain)
  return `&domain=${setup.status}`
}

/**
 * Creates a company instance owned by the signed-in user, then opens its page.
 * The instance is live at once on its preview link.
 */
export async function createInstanceAction(_state: InstanceFormState, formData: FormData): Promise<InstanceFormState> {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to create an instance." }
  const parsed = readForm(formData)
  if (!parsed.success) {
    return { fieldErrors: Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])) }
  }

  try {
    const db = await getUserDb()
    await db.instances.create({ data: { ...toRow(parsed.data), owner_id: user.id }, select: { id: true } })
  } catch (error) {
    const known = uniqueError(error)
    if (known) return known
    logger.error("Could not create the instance", { userId: user.id, error: error instanceof Error ? error.message : String(error) })
    return { error: "Could not create the instance. Try again." }
  }

  logger.info("Created a company instance", { userId: user.id, slug: parsed.data.slug })
  revalidatePath("/instances")
  redirect(`/instances/${parsed.data.slug}?created=1${await domainStatusParam(parsed.data.customDomain, null)}`)
}

/** Changes an instance of the signed-in user. Row-level security refuses other users' instances. */
export async function updateInstanceAction(
  currentSlug: string,
  _state: InstanceFormState,
  formData: FormData,
): Promise<InstanceFormState> {
  const user = await getServerUser()
  if (!user) return { error: "Sign in to change the instance." }
  const parsed = readForm(formData)
  if (!parsed.success) {
    return { fieldErrors: Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message])) }
  }

  let previousDomain: string | null = null
  try {
    const db = await getUserDb()
    const existing = await db.instances.findFirst({
      where: { slug: currentSlug, owner_id: user.id },
      select: { id: true, custom_domain: true },
    })
    if (!existing) return { error: "This instance does not exist, or it is not yours." }
    previousDomain = existing.custom_domain
    await db.instances.update({
      where: { id: existing.id },
      data: { ...toRow(parsed.data), updated_at: new Date() },
      select: { id: true },
    })
  } catch (error) {
    const known = uniqueError(error)
    if (known) return known
    logger.error("Could not change the instance", { userId: user.id, error: error instanceof Error ? error.message : String(error) })
    return { error: "Could not save the changes. Try again." }
  }

  revalidatePath("/instances")
  redirect(`/instances/${parsed.data.slug}?saved=1${await domainStatusParam(parsed.data.customDomain, previousDomain)}`)
}
