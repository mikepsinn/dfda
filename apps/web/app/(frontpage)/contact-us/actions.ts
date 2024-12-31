'use server'

import { z } from 'zod'
import { emailer } from '@/lib/email'
import { generateAutoReplyEmail, generateContactFormEmail } from '@/lib/emails/contact-form'
import { EMAIL_CONFIG } from '@/lib/email/config'
import { EmailError } from '@/lib/email/errors'

// Escape HTML to prevent XSS
function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

const contactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  subject: z.string().min(1, 'Subject is required').max(200),
  message: z.string().min(10, 'Message must be at least 10 characters long').max(5000),
})

export type ContactFormResponse = {
  success?: boolean
  message?: string
  error?: string
}

export async function submitContactForm(formData: FormData): Promise<ContactFormResponse> {
  const validatedFields = contactFormSchema.safeParse({
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    subject: formData.get('subject'),
    message: formData.get('message'),
  })

  if (!validatedFields.success) {
    return {
      error: 'Invalid form data. Please check your inputs.',
    }
  }

  const { firstName, lastName, email, subject, message } = validatedFields.data

  try {
    // Send notification email to admin
    await emailer.send({
      from: EMAIL_CONFIG.defaultFrom,
      to: EMAIL_CONFIG.addresses.support,
      subject: `New Contact Form Submission: ${escapeHtml(subject)}`,
      html: generateContactFormEmail({
        firstName: escapeHtml(firstName),
        lastName: escapeHtml(lastName),
        email: escapeHtml(email),
        subject: escapeHtml(subject),
        message: escapeHtml(message),
      }),
    })

    // Send auto-reply email to user
    await emailer.send({
      from: EMAIL_CONFIG.defaultFrom,
      to: email,
      subject: 'Thank you for contacting Decentralized FDA',
      html: generateAutoReplyEmail({
        firstName: escapeHtml(firstName),
      }),
    })

    return {
      success: true,
      message: 'Thank you for your message. We will get back to you soon!',
    }
  } catch (error) {
    console.error('Error submitting contact form:', error)
    
    // Handle specific email errors
    if (error instanceof EmailError) {
      return {
        error: 'Unable to send email. Our team has been notified.',
      }
    }

    return {
      error: 'Something went wrong. Please try again later.',
    }
  }
} 