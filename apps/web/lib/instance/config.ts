import { z } from 'zod'
import { CORNER_RADII, FONTS, bestTextContrast, type CornerRadius, type InstanceFont, type InstanceTheme } from './theme'

/**
 * A company instance: the company's branding of this app (name, logo, theme
 * and products) on a preview link, a subdomain or its own domain. Branding
 * only: every instance shares the same app, data and sign-in.
 */

// Slugs that would clash with app paths, host names or the preview links.
const RESERVED_SLUGS = new Set(['www', 'api', 'app', 'admin', 'auth', 'mail', 'prototype', 'dfda', 'new', 'exit', 'preview'])

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.')
  .min(3, 'Use at least 3 characters.')
  .max(40, 'Use at most 40 characters.')
  .refine((slug) => !RESERVED_SLUGS.has(slug), 'This name is reserved. Choose another.')

const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((value) => value.replace(/^https?:\/\//, '').replace(/\/.*$/, ''))
  .pipe(z.string().regex(/^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/, 'Enter a domain such as health.example.com.'))

const optionalText = (max: number) =>
  z.string().trim().max(max).transform((value) => value || null)

const hexColor = (example: string) =>
  z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^#[0-9a-f]{6}$/, `Choose a color such as ${example}.`)

const choice = <Name extends string>(names: Name[], message: string) =>
  z.enum(names as [Name, ...Name[]], { errorMap: () => ({ message }) })

export const instanceInputSchema = z.object({
  name: z.string().trim().min(2, 'Enter the company name.').max(80),
  slug: slugSchema,
  tagline: optionalText(200),
  logoUrl: z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(z.string().url().startsWith('https://', 'The logo address must start with https://.').nullable()),
  primaryColor: hexColor('#6d4df6'),
  // The text and surface colors follow from it (lib/instance/theme.ts); a middle tone leaves no readable text color.
  backgroundColor: hexColor('#ffffff').refine(
    (color) => bestTextContrast(color) >= 7,
    'Choose a lighter or a darker background, so that text is easy to read on it.',
  ),
  font: choice(Object.keys(FONTS) as InstanceFont[], 'Choose a font from the list.'),
  cornerRadius: choice(Object.keys(CORNER_RADII) as CornerRadius[], 'Choose a corner size from the list.'),
  // One product per line or comma, for example "BPC-157, Proteomics panel".
  products: z
    .string()
    .transform((value) => [...new Set(value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean))])
    .pipe(z.array(z.string().max(60, 'Keep each product name under 60 characters.')).max(8, 'List at most 8 products.')),
  customDomain: z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(domainSchema.nullable()),
})

export type InstanceInput = z.infer<typeof instanceInputSchema>

/** The branding that pages use. */
export type InstanceBranding = InstanceTheme & {
  slug: string
  name: string
  tagline: string | null
  logoUrl: string | null
  products: string[]
  customDomain: string | null
}

/** A slug suggestion from a company name: "Acme Proteomics, Inc." → "acme-proteomics-inc". */
export function slugFromName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
}
