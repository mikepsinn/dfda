"use server"

import { getUserDb } from '@/lib/db/server'
import type { Database } from '@/lib/database.types'
import { logger } from "@/lib/logger"

export type DataSubmission = Database["public"]["Tables"]["data_submissions"]["Row"]
export type DataSubmissionInsert = Database["public"]["Tables"]["data_submissions"]["Insert"]
export type DataSubmissionUpdate = Database["public"]["Tables"]["data_submissions"]["Update"]

export async function getDataSubmissionsByEnrollmentAction(enrollmentId: string) {
  try {
    const db = await getUserDb()
    return await db.data_submissions.findMany({
      where: { enrollment_id: enrollmentId },
      orderBy: { submission_date: "desc" },
    })
  } catch (error) {
    logger.error(`Error fetching data submissions for enrollment ${enrollmentId}:`, error)
    throw error
  }
}

export async function createDataSubmissionAction(data: DataSubmissionInsert): Promise<DataSubmission | null> {
  try {
    const db = await getUserDb()
    return await db.data_submissions.create({ data })
  } catch (error) {
    logger.error('Error creating data submission:', error)
    return null
  }
}

export async function updateDataSubmissionAction(id: string, updates: DataSubmissionUpdate) {
  try {
    const db = await getUserDb()
    return await db.data_submissions.update({
      where: { id },
      data: { ...updates, updated_at: new Date() },
    })
  } catch (error) {
    logger.error(`Error updating data submission with id ${id}:`, error)
    throw error
  }
}

export async function deleteDataSubmissionAction(id: string): Promise<boolean> {
  try {
    const db = await getUserDb()
    await db.data_submissions.deleteMany({ where: { id } })
    return true
  } catch (error) {
    logger.error(`Error deleting data submission with id ${id}:`, error)
    return false
  }
}

export async function getDataSubmissionByIdAction(id: string): Promise<DataSubmission | null> {
  try {
    const db = await getUserDb()
    return await db.data_submissions.findUnique({ where: { id } })
  } catch (error) {
    logger.error(`Error fetching data submission with id ${id}:`, error)
    return null
  }
}

export async function getDataSubmissionsAction(): Promise<DataSubmission[]> {
  try {
    const db = await getUserDb()
    return await db.data_submissions.findMany()
  } catch (error) {
    logger.error('Error getting data submissions:', error)
    return []
  }
}

// Get latest data submission for an enrollment
export async function getLatestDataSubmissionAction(enrollmentId: string) {
  try {
    const db = await getUserDb()
    return await db.data_submissions.findFirst({
      where: { enrollment_id: enrollmentId },
      orderBy: { created_at: "desc" },
    })
  } catch (error) {
    logger.error("Error fetching data submission:", error)
    throw new Error("Failed to fetch data submission")
  }
}

// Submit trial data
export async function submitTrialDataAction(submission: DataSubmissionInsert) {
  try {
    const db = await getUserDb()
    await db.data_submissions.create({
      // Clients send the submission date as an ISO string
      data: { ...submission, submission_date: new Date(submission.submission_date) },
      select: { id: true },
    })
  } catch (error) {
    logger.error("Error submitting trial data:", error)
    throw new Error("Failed to submit trial data")
  }
}

// Get metrics for a user's data submissions
export async function getDataSubmissionMetricsAction(enrollmentId: string) {
  try {
    const db = await getUserDb()
    const submissionCount = await db.data_submissions.count({
      where: { enrollment_id: enrollmentId },
    })

    // In a real app, completion rate would be calculated based on expected vs actual submissions
    // For now using a placeholder calculation
    const completionRate = submissionCount > 0 ? 85 : 0

    // Next submission is 3 days from now (placeholder logic)
    const nextSubmission = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()

    return {
      submissions: submissionCount,
      completionRate,
      nextSubmission
    }
  } catch (error) {
    logger.error("Error getting data submission metrics:", error)
    return {
      submissions: 0,
      completionRate: 0,
      nextSubmission: null
    }
  }
}

// Add action functions here later if needed
