"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

/**
 * Updates the AI provider setting
 */
export async function updateAIProviderSetting(provider: string): Promise<void> {
  // Validate the provider
  if (!["openai", "google", "deepseek"].includes(provider)) {
    throw new Error("Invalid AI provider selected")
  }

  // Store the setting in a cookie
  cookies().set("AI_PROVIDER", provider, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  })

  // Update environment variable for the current session
  process.env.AI_PROVIDER = provider

  // Revalidate paths that might use the AI provider
  revalidatePath("/")
  revalidatePath("/settings")

  // No need to redirect as this is called from client component
}

/**
 * Redirects to the settings page
 */
export async function goToSettings(): Promise<void> {
  redirect("/settings")
}
