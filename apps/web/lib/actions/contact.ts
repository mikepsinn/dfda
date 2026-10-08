"use server"

import { z } from "zod"
import { getUserDb } from "@/lib/db/server"
import { logger } from "@/lib/logger"

const ContactMessageInputSchema = z.object({
  email: z.string().min(1),
  subject: z.string().min(1),
  message: z.string().min(1),
})

export type SubmitContactMessageResult = { success: true } | { success: false; error: string }

/**
 * Saves a message from the public contact form. Anyone may send one, signed in or not.
 */
export async function submitContactMessageAction(formData: FormData): Promise<SubmitContactMessageResult> {
  const parsed = ContactMessageInputSchema.safeParse({
    email: formData.get("email"),
    subject: formData.get("inquiryType"),
    message: formData.get("message"),
  })

  if (!parsed.success) {
    logger.warn("Invalid contact form submission", { errors: parsed.error.flatten().fieldErrors })
    return { success: false, error: "Email, inquiry type and message are required." }
  }

  try {
    const db = await getUserDb()
    // createMany does not read the row back, which the insert-only policy on contact_messages requires.
    await db.contact_messages.createMany({
      data: [
        {
          ...parsed.data,
          name: "Anonymous", // Default name for now
          status: "new",
        },
      ],
    })
    return { success: true }
  } catch (error) {
    logger.error("Error saving contact message", { error })
    return { success: false, error: "Failed to save contact message." }
  }
}
