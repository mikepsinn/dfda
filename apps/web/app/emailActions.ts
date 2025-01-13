"use server"

import { prisma } from "@/lib/db"

export async function subscribeToNewsletter(email: string) {
  try {
    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    if (!user) {
      // Create new user if doesn't exist
      user = await prisma.user.create({
        data: {
          email,
          newsletterSubscribed: true,
          newsletterEmails: true,
          unsubscribeFromAll: false,
        },
        select: { id: true },
      })
    } else {
      // Update existing user
      await prisma.user.update({
        where: { id: user.id },
        data: {
          newsletterSubscribed: true,
          newsletterEmails: true,
          unsubscribeFromAll: false,
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return { success: false, error: "Failed to subscribe to newsletter" }
  }
} 