// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { bestTextContrast, brandTheme, contrastRatio, isDark, printBrandTheme, surfaceTheme, themeCss } from '@/lib/instance/theme'

/** The hex color of a theme variable in the "H S% L%" form. */
function hexOf(variable: string): string {
  const [h, s, l] = variable.replace(/%/g, '').split(' ').map(Number)
  const amount = (s / 100) * Math.min(l / 100, 1 - l / 100)
  const channel = (n: number) => {
    const k = (n + h / 30) % 12
    return Math.round((l / 100 - amount * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255)
  }
  return `#${[channel(0), channel(8), channel(4)].map((value) => value.toString(16).padStart(2, '0')).join('')}`
}

describe('brandTheme', () => {
  it('gives the color in the theme form, with readable text on it', () => {
    expect(brandTheme('#0f766e')).toEqual({ primary: '175 77% 26%', primaryForeground: '0 0% 100%' })
    expect(brandTheme('#facc15').primaryForeground).toBe('0 0% 9%')
  })
})

describe('surfaceTheme', () => {
  it('gives a light site for a light background and a dark site for a dark one', () => {
    expect(isDark('#faf9f6')).toBe(false)
    expect(isDark('#0d0f0e')).toBe(true)
    const dark = surfaceTheme('#0d0f0e')
    expect(dark.dark).toBe(true)
    expect(dark.variables['--background']).toBe('150 7.1% 5.5%')
  })

  // Every background that the form accepts: 4,096 colors in steps of 0x11, without the middle tones.
  const steps = Array.from({ length: 16 }, (_, index) => index * 0x11)
  const backgrounds = steps
    .flatMap((r) => steps.flatMap((g) => steps.map((b) => `#${[r, g, b].map((value) => value.toString(16).padStart(2, '0')).join('')}`)))
    .filter((background) => bestTextContrast(background) >= 7)

  it('keeps the text and the muted text readable on the page, the cards and the muted areas', () => {
    expect(backgrounds.length).toBeGreaterThan(2000)
    for (const background of backgrounds) {
      const { variables } = surfaceTheme(background)
      for (const surface of ['--background', '--card', '--muted']) {
        const on = hexOf(variables[surface])
        expect(contrastRatio(hexOf(variables['--foreground']), on), `text on ${surface} of ${background}`).toBeGreaterThanOrEqual(4.5)
        // 4.4: the hex form rounds each channel, which can change the ratio a little.
        expect(contrastRatio(hexOf(variables['--muted-foreground']), on), `muted text on ${surface} of ${background}`).toBeGreaterThanOrEqual(4.4)
      }
    }
  })

  it('makes muted areas and borders visible on the page', () => {
    for (const background of ['#ffffff', '#faf9f6', '#0d0f0e', '#000000']) {
      const { variables } = surfaceTheme(background)
      expect(contrastRatio(hexOf(variables['--muted']), background), background).toBeGreaterThan(1.05)
      expect(contrastRatio(hexOf(variables['--border']), background), background).toBeGreaterThan(1.2)
    }
  })
})

describe('printBrandTheme', () => {
  it('darkens a brand color that is too light for white paper, with the same hue', () => {
    const print = printBrandTheme('#2fd4be')!
    expect(print['--primary']).toMatch(/^172 65.7% \d+(\.\d)?%$/)
    expect(contrastRatio(hexOf(print['--primary']), '#ffffff')).toBeGreaterThanOrEqual(4.5)
    expect(print['--primary-foreground']).toBe('0 0% 100%')
  })

  it('keeps a brand color that reads on white', () => {
    expect(printBrandTheme('#0f766e')).toBeNull()
  })
})

describe('themeCss', () => {
  it('sets the brand and corners everywhere, the page colors on screen only, and the font', () => {
    const css = themeCss({ primaryColor: '#2fd4be', backgroundColor: '#0d0f0e', font: 'serif', cornerRadius: 'large' })
    expect(css).toContain(':root,:root.dark,.dark{--primary:172 66% 51%;--primary-foreground:0 0% 9%;--ring:172 66% 51%;--radius:1rem}')
    expect(css).toMatch(/@media screen\{:root,:root\.dark,\.dark\{color-scheme:dark;--background:150 7\.1% 5\.5%;/)
    expect(css).toContain('body{font-family:ui-serif, Georgia')
    expect(css).toMatch(/@media print\{:root,:root\.dark,\.dark\{--primary:172 65.7% \d+(\.\d)?%;--primary-foreground:0 0% 100%/)
  })

  it("uses Inter from the root layout's font variable", () => {
    const css = themeCss({ primaryColor: '#0f766e', backgroundColor: '#ffffff', font: 'inter', cornerRadius: 'medium' })
    expect(css).toContain('--radius:0.5rem')
    expect(css).toContain('color-scheme:light')
    expect(css).toContain('body{font-family:var(--font-inter), ui-sans-serif')
    expect(css).not.toContain('@media print')
  })
})
