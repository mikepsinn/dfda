import { notFound } from 'next/navigation'
import { getUserDb } from '@/lib/db/server'
import { getServerUser } from '@/lib/server-auth'
import { findProgram, type Program } from './data'

/** The signed-in user's instance with this slug, or a 404 page. For the company pages. */
export async function requireOwnedInstance(slug: string) {
  const user = await getServerUser()
  if (!user) notFound()
  const db = await getUserDb()
  const instance = await db.instances.findFirst({
    where: { slug, owner_id: user.id },
    select: { id: true, slug: true, name: true, custom_domain: true },
  })
  if (!instance) notFound()
  return { user, instance }
}

/** The signed-in user's program on their instance, or a 404 page. */
export async function requireOwnedProgram(instanceSlug: string, programSlug: string) {
  const owned = await requireOwnedInstance(instanceSlug)
  const program: Program | null = await findProgram(owned.instance.slug, programSlug)
  if (!program) notFound()
  return { ...owned, program }
}

/** The address where people open a program: the preview link works on any host. */
export function programPreviewPath(instanceSlug: string, programSlug: string) {
  return `/i/${instanceSlug}?next=${encodeURIComponent(`/programs/${programSlug}`)}`
}
