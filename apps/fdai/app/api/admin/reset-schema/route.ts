import { NextResponse } from "next/server"
import { getCompleteSchemaSql } from "@/lib/sql-loader"

export async function POST(request: Request) {
  // Only allow in development mode
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "This endpoint is only available in development mode" }, { status: 403 })
  }

  // Simply return the SQL for manual execution
  return NextResponse.json({
    sql: getCompleteSchemaSql(),
    message: "Please run this SQL in your Supabase SQL Editor to set up the database schema.",
  })
}
