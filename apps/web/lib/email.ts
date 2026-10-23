import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '@/lib/env'
import { isDark } from '@/lib/instance/theme'

/**
 * Outgoing email through the SMTP server in SMTP_URL.
 *
 * Used for sign-in links, password resets, care team invitations and news of
 * biomarker reports (lib/care-team/notify.ts). The messages contain sign-in
 * tokens, so never log their text or links.
 */

let transporter: Transporter | undefined

function getTransporter(): Transporter {
  transporter ??= nodemailer.createTransport(env.SMTP_URL)
  return transporter
}

export type Email = {
  to: string
  subject: string
  text: string
  html?: string
  /** The sender name, such as a company's: the address stays the one in EMAIL_FROM. */
  fromName?: string
  replyTo?: string
}

/** The address of EMAIL_FROM, which may be `Name <address>` or the address alone. */
export function senderAddress(from = env.EMAIL_FROM): string {
  return /<([^<>\s]+)>/.exec(from)?.[1] ?? from.trim()
}

export async function sendEmail({ fromName, ...email }: Email): Promise<void> {
  const from = fromName ? { name: fromName, address: senderAddress() } : env.EMAIL_FROM
  await getTransporter().sendMail({ from, ...email })
}

/** The company that an email is sent for: its name, brand color and support address. */
export type EmailBrand = { name: string; primaryColor: string; supportEmail: string | null }

/**
 * A short email with one link, as plain text and simple HTML. With a brand,
 * the email comes from the company: its name as the sender and at the top,
 * the link button in its color, and replies to its support address. The
 * footer says why the person gets the email.
 */
export function linkEmail(
  to: string,
  subject: string,
  intro: string,
  linkText: string,
  url: string,
  brand?: EmailBrand,
  footer = 'If you did not ask for this email, you can ignore it.',
): Email {
  const escape = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const ignore = footer
  const link = brand
    ? `<a href="${escape(url)}" style="display:inline-block;padding:10px 18px;border-radius:6px;background:${escape(brand.primaryColor)};color:${isDark(brand.primaryColor) ? '#ffffff' : '#171717'};text-decoration:none;font-weight:600">${escape(linkText)}</a>`
    : `<a href="${escape(url)}">${escape(linkText)}</a>`
  return {
    to,
    subject,
    text: `${brand ? `${brand.name}\n\n` : ''}${intro}\n\n${url}\n\n${ignore}`,
    html: `${brand ? `<p style="font-size:18px;font-weight:700">${escape(brand.name)}</p>` : ''}<p>${escape(intro)}</p><p>${link}</p><p>${escape(ignore)}</p>`,
    ...(brand && { fromName: brand.name, ...(brand.supportEmail && { replyTo: brand.supportEmail }) }),
  }
}
