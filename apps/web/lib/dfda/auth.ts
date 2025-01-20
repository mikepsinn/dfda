import { Account, User } from "@prisma/client"
import { prisma } from "@/lib/db"

// Function to get or create a basic user
async function getYourUser(yourUserId: string): Promise<User | null> {
  if (!yourUserId) {
    throw new Error("User ID is required")
  }

  const user = await prisma.user.findUnique({
    where: {
      id: yourUserId,
    },
  })
  if (user) {
    return user
  }
  return prisma.user.create({
    data: {
      id: yourUserId,
    },
  })
}

// Function to get or create a DFDA user
export async function getOrCreateDfdaUser(
  yourUserId: string
): Promise<Account> {
  if (!yourUserId || yourUserId.trim() === "") {
    throw new Error("Valid user ID string is required")
  }

  const your_user = await getYourUser(yourUserId)
  const provider = "dfda"

  if (!your_user) {
    throw new Error("Failed to get or create user")
  }

  const existingAccount = await prisma.account.findFirst({
    where: {
      userId: yourUserId,
      provider: provider,
    },
  })

  if (existingAccount) {
    return existingAccount
  }

  // Validate required environment variables
  if (!process.env.DFDA_CLIENT_ID || !process.env.DFDA_CLIENT_SECRET) {
    throw new Error("DFDA client credentials are not configured")
  }

  console.log("🔑 Creating DFDA user.")
  const response = await fetch(`https://safe.dfda.earth/api/v1/user`, {
    method: "POST",
    headers: {
      "Content-type": "application/json",
      "X-Client-ID": process.env.DFDA_CLIENT_ID,
      "X-Client-Secret": process.env.DFDA_CLIENT_SECRET,
    },
    body: JSON.stringify({
      clientUserId: yourUserId,
      clientId: process.env.DFDA_CLIENT_ID,
    }),
  })
  console.log(
    "🔍 Creating DFDA user API Response Status:",
    response.status,
    response.statusText
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to create DFDA user: ${response.status} ${response.statusText} - ${errorText}`
    )
  }

  const jsonResponse = await response.json()
  if (!jsonResponse.user?.id) {
    throw new Error("Invalid response from DFDA API")
  }

  const dfdaUser = jsonResponse.user
  const providerAccountId = dfdaUser.id.toString()
  const expiresAt = new Date(dfdaUser.accessTokenExpires).getTime() / 1000
  return prisma.account.create({
    data: {
      provider: provider,
      providerAccountId: providerAccountId,
      scope: dfdaUser.scope,
      access_token: dfdaUser.accessToken,
      refresh_token: dfdaUser.refreshToken,
      expires_at: expiresAt,
      type: "oauth",
      user: { connect: { id: yourUserId } },
    },
  })
}

export async function getDfdaAccessTokenIfExists(
  yourUserId: string
): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: {
      userId: yourUserId,
      provider: "dfda",
    },
  })
  return account && account.access_token ? account.access_token : null
}

export async function getOrCreateDfdaAccessToken(
  yourUserId: string
): Promise<string> {
  if (!yourUserId) {
    throw new Error("User ID is required")
  }

  const account = await getOrCreateDfdaUser(yourUserId)
  if (!account.access_token) {
    throw new Error("No access token available")
  }
  return account.access_token
}

export async function getSafeRedirectUrl(
  userId: string,
  path?: string
): Promise<string | null> {
  const dfdaToken = await getDfdaAccessTokenIfExists(userId)
  const baseUrl = "https://safe.dfda.earth/app/public/#/app"
  if (dfdaToken) {
    if (!path) {
      path = "/reminders-inbox"
    }
    if (!path.startsWith("/")) {
      path = "/" + path
    }
    return `${baseUrl}${path}?access_token=${dfdaToken}`
  } else {
    const newToken = await getOrCreateDfdaAccessToken(userId)
    return `${baseUrl}/intro?access_token=${newToken}`
  }
} 