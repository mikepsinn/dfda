import { z } from "zod"

import { getUserIdServer } from "@/lib/api/getUserIdServer"
import { handleError } from "@/lib/errorHandler"
import {dfdaGET, dfdaPOST} from "@/app/dfdaActions";

const routeContextSchema = z.object({
  params: z.object({
    dfdaPath: z.array(z.string()),
  }),
})

export async function GET(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  const { params } = routeContextSchema.parse(context)
  const urlParams = Object.fromEntries(new URL(req.url).searchParams)
  const userId = await getUserIdServer()
  try {
    const fullPath = params.dfdaPath.join('/')
    const response = await dfdaGET(fullPath, urlParams, userId)
    const data = response.data ?? response
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return handleError(error, "GET dfdaPath")
  }
}

export async function POST(
  req: Request,
  context: z.infer<typeof routeContextSchema>
) {
  const { params } = routeContextSchema.parse(context)
  const urlParams = Object.fromEntries(new URL(req.url).searchParams)
  const body = await req.json()
  const userId = await getUserIdServer()
  try {
    const fullPath = params.dfdaPath.join('/')
    const response = await dfdaPOST(fullPath, body, userId, urlParams)
    const data = response.data ?? response
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    return handleError(error, "POST dfdaPath")
  }
} 