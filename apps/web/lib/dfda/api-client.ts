import { prisma } from "@/lib/db"
import { getOrCreateDfdaAccessToken } from "./auth"

// Helper function to get DFDA client ID
function getDFDAClientId(): string {
  if (!process.env.DFDA_CLIENT_ID) {
    throw new Error("DFDA_CLIENT_ID is not set")
  }
  return process.env.DFDA_CLIENT_ID
}

class DFDAAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DFDAAuthError'
  }
}

async function dfdaFetch(
  method: "GET" | "POST",
  path: string,
  urlParams?: Record<string, string>,
  body?: any,
  yourUserId?: string,
  additionalHeaders?: Record<string, string>
) {
  const dfdaParams = new URLSearchParams(urlParams)
  const dfdaApiUrl = `https://safe.dfda.earth/api/v3/${path}?${dfdaParams}`
  const headers: HeadersInit = {
    accept: "application/json",
    "Content-Type": method === "POST" ? "application/json" : "",
    ...additionalHeaders,
  }

  if (yourUserId) {
    headers["Authorization"] =
      `Bearer ${await getOrCreateDfdaAccessToken(yourUserId)}`
  }

  const init: RequestInit = {
    method: method,
    headers,
    credentials: "include",
  }

  if (method === "POST" && body) {
    init.body = JSON.stringify(body)
  }

  console.log(`Making ${method} request to ${dfdaApiUrl}`)
  const response = await fetch(dfdaApiUrl, init)
  if (!response.ok) {
    // Check if token expired or unauthorized
    if (response.status === 401) {
      const errorText = await response.text()
      
      // If we have a user ID, try to refresh the token
      if (yourUserId && errorText.includes("expired")) {
        const newToken = await refreshAccessToken(yourUserId)
        if (newToken) {
          // Retry the request with new token
          headers["Authorization"] = `Bearer ${newToken}`
          const retryResponse = await fetch(dfdaApiUrl, init)
          if (retryResponse.ok) {
            return retryResponse.json()
          }
        }
      }
      
      // If we couldn't refresh or don't have a user ID, throw auth error
      throw new DFDAAuthError('Authentication required')
    }
    
    console.error(`DFDA API Error: ${response.status} ${response.statusText}`)
    console.error("URL:", dfdaApiUrl)
    const errorText = await response.text()
    console.error("Response:", errorText)
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const json = await response.json()
  if (json.error) {
    console.error("Error in dfdaFetch to ${dfdaUrl}", json.error)
  }
  return json
}

async function refreshAccessToken(userId: string): Promise<string | null> {
  try {
    // Get the account with refresh token
    const account = await prisma.account.findFirst({
      where: {
        userId: userId,
        provider: "dfda",
      },
    })

    if (!account?.refresh_token) {
      console.error("No refresh token found for user")
      return null
    }

    // Make refresh token request
    const response = await fetch("https://safe.dfda.earth/oauth/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.DFDA_CLIENT_ID!,
        client_secret: process.env.DFDA_CLIENT_SECRET!,
        refresh_token: account.refresh_token,
      }),
    })

    if (!response.ok) {
      console.error("Failed to refresh token:", response.statusText)
      return null
    }

    const data = await response.json()

    // Update account with new tokens
    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Math.floor(Date.now() / 1000 + data.expires_in),
      },
    })

    return data.access_token
  } catch (error) {
    console.error("Error refreshing access token:", error)
    return null
  }
}

export async function dfdaGET(
  path: string,
  urlParams?: Record<string, string>,
  yourUserId?: string,
  additionalHeaders?: Record<string, string>
) {
  if (process.env.NODE_ENV === 'development') {
    console.log('📡 dfdaGET Request:', {
      path,
      urlParams,
    })
  }

  const result = await dfdaFetch(
    "GET",
    path,
    urlParams,
    undefined,
    yourUserId,
    additionalHeaders
  )

  console.log('✅ dfdaGET Response:', {
    path,
    responseStatus: 'success',
  })

  return result
}

export async function dfdaPOST(
  path: string,
  body?: any,
  yourUserId?: string,
  urlParams?: Record<string, string>,
  additionalHeaders?: Record<string, string>
) {
  return dfdaFetch("POST", path, urlParams, body, yourUserId, additionalHeaders)
}

export { getDFDAClientId } 