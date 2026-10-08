'use server';

import { headers } from "next/headers";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import { getServerUser } from "@/lib/server-auth";
import { logger } from "@/lib/logger";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// Zod schema for password validation
const passwordSchema = z.string().min(8, "Password must be at least 8 characters long");

// Type for the action result
interface ActionResult {
  success: boolean;
  message: string;
}

// --- Change Password Action ---
export async function changePasswordAction(formData: FormData): Promise<ActionResult> {
  const user = await getServerUser();

  if (!user) {
    return { success: false, message: "User not authenticated." };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Basic validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, message: "All password fields are required." };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, message: "New passwords do not match." };
  }

  // Zod validation for new password complexity
  const validationResult = passwordSchema.safeParse(newPassword);
  if (!validationResult.success) {
    return { success: false, message: validationResult.error.errors[0]?.message || "Password does not meet requirements." };
  }

  logger.info(`[Action - changePassword] User ${user.id} attempting password change.`);

  try {
    // Better Auth checks the current password before it sets the new one,
    // and signs out the user's other sessions.
    await auth.api.changePassword({
      body: { currentPassword, newPassword, revokeOtherSessions: true },
      headers: await headers(),
    });
  } catch (error) {
    logger.warn(`[Action - changePassword] Failed for user ${user.id}`, {
      status: error instanceof APIError ? error.status : undefined,
    });
    if (error instanceof APIError && error.status === 'BAD_REQUEST') {
      return {
        success: false,
        message: "The current password is not correct. If you have no password yet, use \"Forgot password\" on the sign-in page to set one.",
      };
    }
    return { success: false, message: "Failed to update password. Please try again." };
  }

  logger.info(`[Action - changePassword] Password updated successfully for user ${user.id}`);
  revalidatePath("/user/settings"); // Revalidate the settings page
  return { success: true, message: "Password updated successfully." };
}

// --- Other settings actions can be added below ---
