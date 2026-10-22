import { z } from 'zod'

/**
 * Content pages of a company instance (db/migrations/20261022020000_table_instance_pages.sql):
 * the owner writes each page in Markdown, and the company's site shows it.
 */

/** The pages that take the place of the network's legal pages at /terms and /privacy on the company's site. */
export const LEGAL_PAGE_SLUGS = ['terms', 'privacy'] as const

export const MAX_PAGE_LENGTH = 50_000

export const pageInputSchema = z.object({
  title: z.string().trim().min(1, 'Enter the title.').max(120, 'Use at most 120 characters.'),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.')
    .max(60, 'Use at most 60 characters.'),
  body: z
    .string()
    .trim()
    .min(1, 'Write the text of the page.')
    .max(MAX_PAGE_LENGTH, `Keep the page under ${MAX_PAGE_LENGTH.toLocaleString('en-US')} characters.`),
  inMenu: z.boolean(),
})

export type PageInput = z.infer<typeof pageInputSchema>

/** A page as the site's header and footer link it. */
export type PageLink = { slug: string; title: string; inMenu: boolean }

export function isLegalPage(slug: string): boolean {
  return (LEGAL_PAGE_SLUGS as readonly string[]).includes(slug)
}

/** The address of a page on the company's site: a legal page replaces the network's page at /terms or /privacy. */
export function pagePath(slug: string): string {
  return isLegalPage(slug) ? `/${slug}` : `/pages/${slug}`
}
