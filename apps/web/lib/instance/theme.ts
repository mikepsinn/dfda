/**
 * The theme of a company instance as the CSS variables of the app's theme
 * (app/globals.css, in the "H S% L%" form): the brand color, the page
 * background, the font and the corner radius. The text, card, muted and border
 * colors follow from the background, readable on it (WCAG AA); a dark
 * background gives a dark site. Printed pages keep the app's light colors.
 */

export const FONTS = {
  // The app's own font, which app/layout.tsx loads into this variable.
  inter: { label: 'Inter', stack: 'var(--font-inter), ui-sans-serif, system-ui, sans-serif' },
  system: {
    label: 'System (San Francisco on Apple)',
    stack: 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  serif: { label: 'Serif', stack: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
} as const

export type InstanceFont = keyof typeof FONTS

export const CORNER_RADII = {
  none: { label: 'Square', value: '0rem' },
  small: { label: 'Small', value: '0.25rem' },
  medium: { label: 'Medium', value: '0.5rem' },
  large: { label: 'Large', value: '1rem' },
} as const

export type CornerRadius = keyof typeof CORNER_RADII

export type InstanceTheme = {
  primaryColor: string
  backgroundColor: string
  font: InstanceFont
  cornerRadius: CornerRadius
}

/** The class of the root element for a dark background: Tailwind's `dark:` styles apply on screen only (tailwind.config.ts). */
export const DARK_CLASS = 'dark-on-screen'

type Rgb = [number, number, number]
type Hsl = { h: number; s: number; l: number }

const WHITE: Rgb = [1, 1, 1]
const BLACK: Rgb = [0, 0, 0]

function rgbOf(hex: string): Rgb {
  return [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255) as Rgb
}

/** Relative luminance (WCAG). */
function luminance([r, g, b]: Rgb): number {
  const linear = (channel: number) => (channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)
}

function contrast(a: Rgb, b: Rgb): number {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (lighter + 0.05) / (darker + 0.05)
}

/** The contrast ratio of two hex colors (WCAG), from 1 to 21. Body text needs 4.5. */
export function contrastRatio(a: string, b: string): number {
  return contrast(rgbOf(a), rgbOf(b))
}

/** Whether white text reads better than black text on this hex color. */
export function isDark(hex: string): boolean {
  const color = rgbOf(hex)
  return contrast(color, WHITE) > contrast(color, BLACK)
}

/**
 * The best contrast that text can have on a page background: with white text on
 * a dark one, with black text on a light one. Below 7, the muted areas of the
 * page are too close to the text color.
 */
export function bestTextContrast(hex: string): number {
  const color = rgbOf(hex)
  return Math.max(contrast(color, WHITE), contrast(color, BLACK))
}

const round = (value: number) => Math.round(value * 10) / 10
const clamp = (value: number) => Math.min(100, Math.max(0, value))

function toHsl([r, g, b]: Rgb): Hsl {
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
  return { h: hue, s: round(saturation * 100), l: round(lightness * 100) }
}

function toRgb({ h, s, l }: Hsl): Rgb {
  const amount = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    return l / 100 - amount * Math.max(-1, Math.min(k - 3, 9 - k, 1))
  }
  return [channel(0), channel(8), channel(4)]
}

const variable = ({ h, s, l }: Hsl) => `${h} ${s}% ${l}%`

/**
 * A surface of the page's hue that is lighter or darker than the page by
 * `ratio` in contrast. A contrast step, not a lightness step, because the same
 * change of lightness changes the brightness of some hues (such as green) more
 * than others.
 */
function shade(page: Hsl, lighter: boolean, ratio: number): Hsl {
  const on = toRgb(page)
  let l = page.l
  while (contrast(toRgb({ ...page, l }), on) < ratio && (lighter ? l < 100 : l > 0)) l = clamp(round(l + (lighter ? 0.5 : -0.5)))
  return { ...page, l }
}

/**
 * A text color of hue `h` and saturation `s`: from lightness `start`, it moves
 * toward white (on a dark page) or black (on a light page) until it has `ratio`
 * contrast with `surface`, or is white or black.
 */
function readableText(h: number, s: number, start: number, surface: Hsl, dark: boolean, ratio: number): Hsl {
  const on = toRgb(surface)
  let l = start
  while (contrast(toRgb({ h, s, l }), on) < ratio && (dark ? l < 100 : l > 0)) l = clamp(round(l + (dark ? 1 : -1)))
  return { h, s, l }
}

/** The brand color as the theme's primary color, with a text color that stays readable on it. */
export function brandTheme(hex: string) {
  const color = rgbOf(hex)
  const { h, s, l } = toHsl(color)
  return {
    primary: `${h} ${Math.round(s)}% ${Math.round(l)}%`,
    primaryForeground: luminance(color) > 0.4 ? '0 0% 9%' : '0 0% 100%',
  }
}

/**
 * The brand color for printed pages, which are white: a brand color that is too
 * light for white (one chosen for a dark site) gets darker, with the same hue,
 * until it reads on white. Null when the brand color already reads on white.
 */
export function printBrandTheme(hex: string): Record<string, string> | null {
  const color = rgbOf(hex)
  if (contrast(color, WHITE) >= 4.5) return null
  const { h, s, l } = toHsl(color)
  const darker = variable(readableText(h, s, l, { h: 0, s: 0, l: 100 }, false, 4.5))
  return { '--primary': darker, '--primary-foreground': '0 0% 100%', '--primary-text': darker, '--ring': darker }
}

/** The muted areas of a page: a little darker than a light page, a little lighter than a dark one. */
function mutedShade(page: Hsl, dark: boolean): Hsl {
  return shade(page, dark, dark ? 1.2 : 1.1)
}

/**
 * The brand color for text on the page (links, headings, icons). A brand color
 * that does not read on the page gets darker on a light page, or lighter on a
 * dark one, with the same hue, until it reads on the page's muted areas.
 * Buttons and other fills keep the brand color itself.
 */
export function brandTextColor(primaryHex: string, backgroundHex: string): string {
  const color = rgbOf(primaryHex)
  const dark = isDark(backgroundHex)
  const muted = mutedShade(toHsl(rgbOf(backgroundHex)), dark)
  if (contrast(color, toRgb(muted)) >= 4.5) return brandTheme(primaryHex).primary
  const { h, s, l } = toHsl(color)
  return variable(readableText(h, s, l, muted, dark, 4.5))
}

/**
 * The status colors of a biomarker report (components/biomarker-report/StatusBadge.tsx):
 * teal for a change in the intended direction, amber for one to review, stone
 * for no change. Printed reports use these.
 */
export const STATUS_COLORS = { intended: '#1d7a6c', review: '#b07526', neutral: '#85837d' } as const

/** How much of a status color its pale fill has, on a card (a badge, a note). app/globals.css mixes the same share. */
export const STATUS_FILL = 0.14

/** Mixes two colors as CSS `color-mix(in srgb, …)` does: by channel, in sRGB. */
function mix(a: Rgb, b: Rgb, share: number): Rgb {
  return a.map((channel, index) => channel * share + b[index] * (1 - share)) as Rgb
}

/**
 * The status colors on a page background, for a report on screen. Each keeps
 * its hue, and gets darker on a light page or lighter on a dark one until it
 * reads on the page's muted areas and on its own pale fill.
 */
export function statusColors(background: string): Record<`--status-${keyof typeof STATUS_COLORS}`, string> {
  const page = toHsl(rgbOf(background))
  const dark = isDark(background)
  const card = toRgb(shade(page, true, dark ? 1.08 : 1.03))
  const muted = toRgb(mutedShade(page, dark))
  const readable = (hex: string) => {
    const { h, s, l: start } = toHsl(rgbOf(hex))
    const reads = (l: number) => {
      const color = toRgb({ h, s, l })
      return contrast(color, muted) >= 4.5 && contrast(color, mix(color, card, STATUS_FILL)) >= 4.5
    }
    let l = start
    while (!reads(l) && (dark ? l < 100 : l > 0)) l = clamp(round(l + (dark ? 1 : -1)))
    return variable({ h, s, l })
  }
  return {
    '--status-intended': readable(STATUS_COLORS.intended),
    '--status-review': readable(STATUS_COLORS.review),
    '--status-neutral': readable(STATUS_COLORS.neutral),
  }
}

/**
 * The page colors for a background. Cards are a little lighter than the page.
 * Muted areas, inputs and borders are a little darker on a light page and a
 * little lighter on a dark page. The text keeps a hint of the page's hue, and
 * it is readable on every one of these surfaces.
 */
export function surfaceTheme(background: string): { dark: boolean; variables: Record<string, string> } {
  const page = toHsl(rgbOf(background))
  const dark = isDark(background)
  const { h, s } = page
  const card = shade(page, true, dark ? 1.08 : 1.03)
  const muted = mutedShade(page, dark)
  const border = shade(page, dark, dark ? 1.35 : 1.25)
  // Muted areas have the least contrast with the text: a text color that reads on them reads on the page and on cards.
  const textSaturation = Math.min(s, 10)
  const text = variable(readableText(h, textSaturation, dark ? 96 : 15, muted, dark, 7))
  return {
    dark,
    variables: {
      '--background': variable(page),
      '--foreground': text,
      '--card': variable(card),
      '--card-foreground': text,
      '--popover': variable(card),
      '--popover-foreground': text,
      '--secondary': variable(muted),
      '--secondary-foreground': text,
      '--muted': variable(muted),
      '--muted-foreground': variable(readableText(h, textSaturation, dark ? 65 : 45, muted, dark, 4.5)),
      '--accent': variable(muted),
      '--accent-foreground': text,
      '--border': variable(border),
      '--input': variable(border),
      ...statusColors(background),
    },
  }
}

/**
 * The theme's CSS variables: the brand and corner radius, the page colors with
 * the brand color for text on them, and the font stack.
 */
export function themeVariables(theme: InstanceTheme) {
  const { primary, primaryForeground } = brandTheme(theme.primaryColor)
  const surface = surfaceTheme(theme.backgroundColor)
  surface.variables['--primary-text'] = brandTextColor(theme.primaryColor, theme.backgroundColor)
  return {
    brand: {
      '--primary': primary,
      '--primary-foreground': primaryForeground,
      '--ring': primary,
      '--radius': CORNER_RADII[theme.cornerRadius].value,
    },
    surface,
    fontFamily: FONTS[theme.font].stack,
  }
}

const declarations = (variables: Record<string, string>) =>
  Object.entries(variables)
    .map(([name, value]) => `${name}:${value}`)
    .join(';')

/**
 * The theme as a style sheet. The brand color and corner radius apply
 * everywhere, also in explicitly dark parts (the `dark` class). The page
 * colors apply to the page on screen only: dark parts keep their dark colors,
 * and printed pages (such as a biomarker report) stay light, with a brand
 * color that reads on white.
 */
export function themeCss(theme: InstanceTheme): string {
  const { brand, surface, fontFamily } = themeVariables(theme)
  const printBrand = printBrandTheme(theme.primaryColor)
  const root = ':root,:root.dark,.dark'
  const colorScheme = surface.dark ? 'dark' : 'light'
  return [
    `${root}{${declarations(brand)}}`,
    `@media screen{:root{color-scheme:${colorScheme};${declarations(surface.variables)}}}`,
    printBrand ? `@media print{${root}{${declarations(printBrand)}}}` : '',
    `body{font-family:${fontFamily}}`,
  ].join('')
}
