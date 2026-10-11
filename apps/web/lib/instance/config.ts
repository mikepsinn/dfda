import { z } from 'zod'

/**
 * A company instance: the company's branding of this app (name, logo, color
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

export const instanceInputSchema = z.object({
  name: z.string().trim().min(2, 'Enter the company name.').max(80),
  slug: slugSchema,
  tagline: optionalText(200),
  logoUrl: z
    .string()
    .trim()
    .transform((value) => value || null)
    .pipe(z.string().url().startsWith('https://', 'The logo address must start with https://.').nullable()),
  primaryColor: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^#[0-9a-f]{6}$/, 'Choose a color such as #0f766e.'),
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
export type InstanceBranding = {
  slug: string
  name: string
  tagline: string | null
  logoUrl: string | null
  primaryColor: string
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

/**
 * The theme values for a brand color, in the "H S% L%" form of the theme's CSS
 * variables (app/globals.css), with a text color that stays readable on it.
 */
export function brandTheme(hex: string) {
  const [r, g, b] = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const lightness = (max + min) / 2
  const delta = max - min
  let hue = 0
  let saturation = 0
  if (delta !== 0) {
    saturation = delta / (1 - Math.abs(2 * lightness - 1))
    hue = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4
    hue = Math.round(hue * 60)
    if (hue < 0) hue += 360
  }
  // Relative luminance (WCAG) decides between white and near-black text.
  const linear = (channel: number) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  const luminance = 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
  const hsl = `${hue} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`
  return { primary: hsl, primaryForeground: luminance > 0.4 ? '0 0% 9%' : '0 0% 100%' }
}
