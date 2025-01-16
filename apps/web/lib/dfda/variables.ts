import { dfdaGET, dfdaPOST, getDFDAClientId } from "./api-client"
import { GlobalVariable } from "@/types/models/GlobalVariable"
import { UserVariable } from "@/types/models/UserVariable"
import { TrackingReminderNotification } from "@/types/models/TrackingReminderNotification"
import type { GetTrackingReminderNotificationsResponse } from "@/types/models/GetTrackingReminderNotificationsResponse"

export async function getUserVariable(
  variableId: number,
  params?: any
): Promise<UserVariable> {
  let path = `/api/dfda/userVariables?variableId=${variableId}`
  if (params) {
    path += `?${new URLSearchParams(params).toString()}`
  }
  const response = await fetch(path)
  const jsonResponse = await response.json()
  return jsonResponse[0]
}

export async function getGlobalVariable(
  variableId: number
): Promise<GlobalVariable> {
  return await dfdaGET(`variables/${variableId}`)
}

export async function getUserVariableWithCharts(
  variableId: number
): Promise<UserVariable> {
  return await getUserVariable(variableId, { includeCharts: true })
}

export async function searchGlobalVariables(
  name: string,
  limit: number = 10
): Promise<GlobalVariable[]> {
  return await dfdaGET("variables", {
    name,
    limit: limit.toString(),
  })
}

export async function searchUserVariables(
  name: string,
  limit: number = 10
): Promise<UserVariable[]> {
  return await dfdaGET("userVariables", {
    name,
    limit: limit.toString(),
  })
}

export async function getVariable(params: {
  id?: number | string
  name?: string
  type?: "global" | "user"
}): Promise<GlobalVariable | UserVariable | undefined> {
  const { id, name, type = "user" } = params

  try {
    // If ID is provided, use direct fetch methods
    if (id) {
      const numericId = typeof id === "string" ? parseInt(id) : id
      if (!Number.isNaN(numericId)) {
        return type === "global"
          ? await getGlobalVariable(numericId)
          : await getUserVariable(numericId)
      }
    }

    // If name is provided, use search methods
    if (name) {
      const results =
        type === "global"
          ? await searchGlobalVariables(name, 1)
          : await searchUserVariables(name, 1)
      return results?.[0]
    }

    return undefined
  } catch (error) {
    console.error(`Error fetching ${type} variable:`, error)
    return undefined
  }
}

export async function searchVariables(searchPhrase: string) {
  try {
    const results = await dfdaGET("variables", {
      includePublic: "true",
      fallbackToAggregatedCorrelations: "true",
      numberOfCorrelationsAsEffect: "(gt)1",
      sort: "-numberOfCorrelationsAsEffect",
      outcome: "true",
      limit: "10",
      searchPhrase,
    })
    return results
  } catch (error) {
    console.error("Error searching variables:", error)
    throw new Error("Failed to search variables")
  }
}

export async function searchDfdaVariables(
  searchPhrase?: string,
  additionalParams: Record<string, string> = {}
): Promise<GlobalVariable[]> {
  try {
    const baseUrl = "https://safe.fdai.earth/api/v3/variables"
    const params = new URLSearchParams({
      appName: "The Decentralized FDA",
      clientId: getDFDAClientId(),
      limit: "10",
      includePublic: "true",
      ...(searchPhrase ? { searchPhrase } : {}),
      ...additionalParams,
    })

    const url = `${baseUrl}?${params.toString()}`
    console.log(`Fetching from URL: ${url}`)

    const response = await fetch(url)

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(
        `HTTP error! status: ${response.status}, statusText: ${response.statusText}, body: ${errorBody}`
      )
    }

    const data = await response.json()

    if (!Array.isArray(data)) {
      console.error(
        "Unexpected response structure:",
        JSON.stringify(data, null, 2)
      )
      throw new Error(
        "Unexpected response format: 'data' field is missing or not an array"
      )
    }

    const variables = data

    console.log(`Found ${variables.length} variables`)
    return variables
  } catch (error) {
    console.error("Error in searchDfdaVariables:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
    throw new Error(
      `Failed to search DFDA variables: ${error instanceof Error ? error.message : "Unknown error"}`
    )
  }
}

export async function getTrackingReminderNotifications(
  userId: string
): Promise<TrackingReminderNotification[]> {
  try {
    const response = (await dfdaGET(
      "trackingReminderNotifications",
      { clientId: getDFDAClientId() },
      userId
    )) as GetTrackingReminderNotificationsResponse

    if (!response.data) {
      console.log("No notifications in response:", response)
      return []
    }

    return response.data
  } catch (error) {
    console.error("Error fetching tracking reminder notifications:", error)
    throw new Error("Failed to fetch notifications")
  }
}

export async function trackNotification(
  notification: TrackingReminderNotification,
  ourUserId: string,
  value?: number
) {
  try {
    const response = await dfdaPOST(
      "trackingReminderNotifications/track",
      {
        id: notification.id,
        modifiedValue: value !== undefined ? value : notification.modifiedValue,
      },
      ourUserId
    )
    return response
  } catch (error) {
    console.error("Error tracking notification:", error)
    throw new Error("Failed to track notification")
  }
}

export async function skipNotification(
  notification: TrackingReminderNotification,
  ourUserId: string
) {
  try {
    const response = await dfdaPOST(
      "trackingReminderNotifications/skip",
      { id: notification.id },
      ourUserId
    )
    return response
  } catch (error) {
    console.error("Error skipping notification:", error)
    throw new Error("Failed to skip notification")
  }
}

export async function snoozeNotification(
  notification: TrackingReminderNotification,
  ourUserId: string
) {
  try {
    const response = await dfdaPOST(
      "trackingReminderNotifications/snooze",
      { id: notification.id },
      ourUserId
    )
    return response
  } catch (error) {
    console.error("Error snoozing notification:", error)
    throw new Error("Failed to snooze notification")
  }
}

export async function trackAllNotifications(
  notification: TrackingReminderNotification,
  ourUserId: string,
  value: number
) {
  try {
    const response = await dfdaPOST(
      "trackingReminderNotifications/trackAll",
      {
        variableId: notification.variableId,
        modifiedValue: value,
      },
      ourUserId
    )
    return response
  } catch (error) {
    console.error("Error tracking all notifications:", error)
    throw new Error("Failed to track all notifications")
  }
}

export async function skipAllNotifications(
  notification: TrackingReminderNotification,
  ourUserId: string
) {
  try {
    const response = await dfdaPOST(
      "trackingReminderNotifications/skipAll",
      { variableId: notification.variableId },
      ourUserId
    )
    return response
  } catch (error) {
    console.error("Error skipping all notifications:", error)
    throw new Error("Failed to skip all notifications")
  }
} 