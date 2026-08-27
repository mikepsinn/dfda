"use server"

import { z } from "zod"

import { emailer } from "@/lib/email"
import { EMAIL_CONFIG } from "@/lib/email/config"
import {
  generateAutoReplyEmail,
  generateContactFormEmail,
} from "@/lib/emails/contact-form"

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
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email address").max(255),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters long")
    .max(5000),
})

export type ContactFormResponse = {
  success?: boolean
  message?: string
  error?: string
}

export async function submitContactForm(
  _prevState: ContactFormResponse,
  formData: FormData
): Promise<ContactFormResponse> {
  const startedAt = Date.now()
  const validatedFields = contactFormSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  })

  if (!validatedFields.success) {
    console.warn(
      JSON.stringify({
        level: "warning",
        message: "Contact form validation failed",
        route: "/contact-us",
        duration_ms: Date.now() - startedAt,
      })
    )
    return {
      error: "Invalid form data. Please check your inputs.",
    }
  }

  const { firstName, lastName, email, subject, message } = validatedFields.data
  const emailSubject = subject.replace(/[\r\n]+/g, " ")

  try {
    // Send notification email to admin
    const notification = await emailer.send({
      from: EMAIL_CONFIG.defaultFrom,
      to: EMAIL_CONFIG.addresses.support,
      replyTo: email,
      subject: `New Contact Form Submission: ${emailSubject}`,
      html: generateContactFormEmail({
        firstName: escapeHtml(firstName),
        lastName: escapeHtml(lastName),
        email: escapeHtml(email),
        subject: escapeHtml(subject),
        message: escapeHtml(message),
      }),
    })

    if (notification.status === "failed") {
      console.error(
        JSON.stringify({
          level: "error",
          message: "Contact form notification failed",
          route: "/contact-us",
          errorCode: notification.error?.code,
          duration_ms: Date.now() - startedAt,
        })
      )
      return {
        error:
          "We couldn't send your message. Please try again or email support@dfda.earth directly.",
      }
    }

    // Send auto-reply email to user
    const autoReply = await emailer.send({
      from: EMAIL_CONFIG.defaultFrom,
      to: email,
      subject: "Thank you for contacting Crowdsourcing Cures",
      html: generateAutoReplyEmail({
        firstName: escapeHtml(firstName),
      }),
    })

    if (autoReply.status === "failed") {
      console.warn(
        JSON.stringify({
          level: "warning",
          message: "Contact form auto-reply failed",
          route: "/contact-us",
          errorCode: autoReply.error?.code,
          duration_ms: Date.now() - startedAt,
        })
      )
    }

    console.log(
      JSON.stringify({
        level: "info",
        message: "Contact form submission delivered",
        route: "/contact-us",
        duration_ms: Date.now() - startedAt,
      })
    )

    return {
      success: true,
      message: "Thank you for your message. We will get back to you soon!",
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Contact form submission failed unexpectedly",
        route: "/contact-us",
        error: error instanceof Error ? error.message : String(error),
        duration_ms: Date.now() - startedAt,
      })
    )

    return {
      error:
        "We couldn't send your message. Please try again or email support@dfda.earth directly.",
    }
  }
}
