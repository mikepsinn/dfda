import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '@/lib/env'

/**
 * Outgoing email through the SMTP server in SMTP_URL.
 *
 * Used for sign-in links and password resets. The messages contain sign-in
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
}

export async function sendEmail(email: Email): Promise<void> {
  await getTransporter().sendMail({ from: env.EMAIL_FROM, ...email })
}

/** A short email with one link, as plain text and simple HTML. */
export function linkEmail(to: string, subject: string, intro: string, linkText: string, url: string): Email {
  const escape = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  return {
    to,
    subject,
    text: `${intro}\n\n${url}\n\nIf you did not ask for this email, you can ignore it.`,
    html: `<p>${escape(intro)}</p><p><a href="${escape(url)}">${escape(linkText)}</a></p><p>If you did not ask for this email, you can ignore it.</p>`,
  }
}
