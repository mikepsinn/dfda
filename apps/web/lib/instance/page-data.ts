import { cache } from 'react'
import { notFound } from 'next/navigation'
import { dbAs } from '@/lib/db'
import { resolveInstance } from './resolve'
import type { PageLink } from './pages'

/** Reads the content pages of company instances. They are public, like the branding. Server only. */

export type InstancePage = PageLink & { id: string; body: string; updatedAt: Date }

/** The pages of an instance, in the order the owner created them. */
export async function listPages(instanceSlug: string): Promise<(PageLink & { updatedAt: Date })[]> {
  const rows = await dbAs(null).instance_pages.findMany({
    where: { instances: { slug: instanceSlug } },
    select: { slug: true, title: true, in_menu: true, updated_at: true },
    orderBy: [{ created_at: 'asc' }, { slug: 'asc' }],
  })
  return rows.map((row) => ({ slug: row.slug, title: row.title, inMenu: row.in_menu, updatedAt: row.updated_at }))
}

/** Once per request: the page's metadata and the page itself both read it. */
export const findPage = cache(async (instanceSlug: string, slug: string): Promise<InstancePage | null> => {
  const row = await dbAs(null).instance_pages.findFirst({
    where: { instances: { slug: instanceSlug }, slug },
    select: { id: true, slug: true, title: true, body: true, in_menu: true, updated_at: true },
  })
  return row ? { id: row.id, slug: row.slug, title: row.title, body: row.body, inMenu: row.in_menu, updatedAt: row.updated_at } : null
})

/** The company's page with this slug on the company instance of the current request; null on the network's site or when there is none. */
export async function findCurrentPage(slug: string): Promise<InstancePage | null> {
  const instance = await resolveInstance()
  return instance ? findPage(instance.slug, slug) : null
}

/** The page with this slug on the company instance of the current request, or a 404 page. */
export async function requireCurrentPage(slug: string): Promise<InstancePage> {
  const page = await findCurrentPage(slug)
  if (!page) notFound()
  return page
}
