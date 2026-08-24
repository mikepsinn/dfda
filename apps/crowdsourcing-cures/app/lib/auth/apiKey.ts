import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";

export type ApiKeyVerificationResult = {
  isValid: boolean;
  user: User | null;
  error?: string;
};

/**
 * Verifies an API key and returns the associated user
 * @param apiKey - The API key to verify
 * @returns Object containing verification result and user if valid
 */
export async function verifyApiKey(apiKey: string | null): Promise<ApiKeyVerificationResult> {
  if (!apiKey) {
    return {
      isValid: false,
      user: null,
      error: "No API key provided",
    };
  }

  try {
    const key = await prisma.apiKey.findFirst({
      where: {
        displayApiKey: apiKey,
      },
      include: {
        user: true,
      },
    });

    if (!key?.user) {
      return {
        isValid: false,
        user: null,
        error: "Invalid API key",
      };
    }

    return {
      isValid: true,
      user: key.user,
    };
  } catch (error) {
    console.error("Error verifying API key:", error);
    return {
      isValid: false,
      user: null,
      error: "Error verifying API key",
    };
  }
}

/**
 * Express/Next.js middleware-style function for API key verification
 * Returns a Response if verification fails, otherwise returns the user
 */
export async function requireApiKey(req: Request): Promise<Response | User> {
  const apiKey = req.headers.get("x-api-key");
  const result = await verifyApiKey(apiKey);

  if (!result.isValid) {
    return new Response(
      JSON.stringify({ error: result.error || "Invalid API key" }),
      { status: 401 }
    );
  }

  if (!result.user) {
    return new Response(
      JSON.stringify({ error: "User not found" }),
      { status: 401 }
    );
  }

  return result.user;
} 