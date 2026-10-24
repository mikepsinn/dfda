import { createHmac, timingSafeEqual } from 'node:crypto'
import type { Email, EmailBrand } from '@/lib/email'
import { env } from '@/lib/env'
import { isDark } from '@/lib/instance/theme'
import { SCALE_RANGES, scaleWords } from './config'
import type { Program, ProgramItem } from './data'
import { formatDate } from './format'

/**
 * The signed link of a check-in, and the check-in email (lib/programs/check-in.ts).
 * No database access, so that they can be tested alone. Server only.
 */

const DAY = 86_400_000
const LINK_DAYS = 3

function signature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(`check-in.${payload}`).digest('base64url')
}

/** The token of a check-in link: the enrollment and the day (YYYY-MM-DD), signed. */
export function checkInToken(enrollmentId: string, day: string, secret = env.BETTER_AUTH_SECRET): string {
  const payload = Buffer.from(JSON.stringify([enrollmentId, day])).toString('base64url')
  return `${payload}.${signature(payload, secret)}`
}

/** The enrollment and day of a check-in token; null when the signature is wrong or the day is more than 3 days ago. */
export function readCheckInToken(
  token: string,
  now = new Date(),
  secret = env.BETTER_AUTH_SECRET,
): { enrollmentId: string; day: string } | null {
  const [payload, mac, ...rest] = token.split('.')
  if (!payload || !mac || rest.length > 0) return null
  const expected = Buffer.from(signature(payload, secret))
  const given = Buffer.from(mac)
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null
  let parsed: unknown
  try {
    parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  } catch {
    return null
  }
  if (!Array.isArray(parsed) || parsed.length !== 2) return null
  const [enrollmentId, day] = parsed as unknown[]
  if (typeof enrollmentId !== 'string' || typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  const ends = Date.parse(`${day}T00:00:00.000Z`) + (LINK_DAYS + 1) * DAY
  if (Number.isNaN(ends) || now.getTime() >= ends) return null
  return { enrollmentId, day }
}

const escape = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * The check-in email: a row of number buttons for each rating, "Took it"
 * and "Skipped" buttons for each dose with a usual amount, and a button that
 * opens the check-in. Each button opens the check-in page (`pagePath` on the
 * company's site, through `url`) with its answer chosen. It holds no values.
 */
export function checkInEmail(
  checkIn: { email: string; day: string; program: Pick<Program, 'name'>; items: ProgramItem[] },
  brand: EmailBrand,
  url: (path: string) => string,
  pagePath: string,
): Email {
  const pageUrl = url(pagePath)
  const answer = (item: ProgramItem, value: number) => url(`${pagePath}?value-${item.id}=${value}`)
  const button = (href: string, text: string) =>
    `<a href="${escape(href)}" style="display:inline-block;padding:10px 18px;border-radius:6px;background:${escape(brand.primaryColor)};color:${isDark(brand.primaryColor) ? '#ffffff' : '#171717'};text-decoration:none;font-weight:600">${escape(text)}</a>`
  const outline = (href: string, text: string) =>
    `<a href="${escape(href)}" style="display:inline-block;padding:9px 17px;border:1px solid #d4d4d4;border-radius:6px;color:#171717;text-decoration:none;font-weight:600">${escape(text)}</a>`
  const number = (href: string, value: number) =>
    `<a href="${escape(href)}" style="display:inline-block;min-width:22px;padding:8px 4px;margin:0 2px 4px 0;border:1px solid #d4d4d4;border-radius:6px;text-align:center;color:#171717;text-decoration:none;font-weight:600">${value}</a>`

  const parts: string[] = []
  const others: string[] = []
  for (const item of checkIn.items) {
    const range = SCALE_RANGES[item.unitId]
    if (range && item.kind !== 'dose') {
      const [min, max] = range
      const words = scaleWords(item.better, min)
      const values = Array.from({ length: max - min + 1 }, (_, index) => min + index)
      parts.push(
        `<p style="margin:20px 0 4px;font-weight:600">${escape(item.name)}</p>` +
          (words
            ? `<p style="margin:0 0 6px;font-size:13px;color:#525252">${min} = ${escape(words[0])}, ${max} = ${escape(words[1])}</p>`
            : '') +
          `<p style="margin:0">${values.map((value) => number(answer(item, value), value)).join('')}</p>`,
      )
    } else if (item.kind === 'dose' && item.defaultValue !== null) {
      parts.push(
        `<p style="margin:20px 0 4px;font-weight:600">${escape(item.name)}</p>` +
          `<p style="margin:0">${button(answer(item, item.defaultValue), `Took it (${item.defaultValue} ${item.unit})`)} ` +
          `${outline(answer(item, 0), 'Skipped')}</p>`,
      )
    } else {
      others.push(item.name)
    }
  }

  const date = formatDate(new Date(`${checkIn.day}T12:00:00.000Z`))
  const intro = `Your check-in for ${checkIn.program.name}, ${date}. Tap an answer to open your check-in. You can change it before you save.`
  const also = others.length ? `Also on your check-in: ${others.join(', ')}.` : ''
  const why = `You get this email because you have reminders in ${brand.name}'s ${checkIn.program.name}.`
  const remindersUrl = url('/patient/reminders')
  return {
    to: checkIn.email,
    subject: `Your check-in for ${checkIn.program.name}`,
    text: [brand.name, intro, `Open your check-in: ${pageUrl}`, also, `${why} To change or stop them: ${remindersUrl}`]
      .filter(Boolean)
      .join('\n\n'),
    html:
      `<p style="font-size:18px;font-weight:700">${escape(brand.name)}</p>` +
      `<p>${escape(intro)}</p>` +
      parts.join('') +
      (also ? `<p style="margin-top:20px">${escape(also)}</p>` : '') +
      `<p style="margin-top:24px">${button(pageUrl, 'Open my check-in')}</p>` +
      `<p style="margin-top:24px;font-size:13px;color:#525252">${escape(why)} <a href="${escape(remindersUrl)}">Change or stop your reminders</a>.</p>`,
    fromName: brand.name,
    ...(brand.supportEmail && { replyTo: brand.supportEmail }),
  }
}

