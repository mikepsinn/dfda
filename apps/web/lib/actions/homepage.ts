"use server"

import { getUserDb } from '@/lib/db/server'
import { logger } from '@/lib/logger'
import type { Database } from '@/lib/database.types'

export async function getFeaturedTrialsAction() {
  const db = await getUserDb()

  try {
    return await db.trials.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        research_partner_id: true,
        treatment_id: true,
        condition_id: true,
        status: true,
        enrollment_target: true,
        current_enrollment: true,
        start_date: true,
        end_date: true,
        created_at: true,
        updated_at: true,
      },
      where: { status: 'active' },
      orderBy: { created_at: 'desc' },
      take: 3,
    })
  } catch (error) {
    logger.error('Error fetching featured trials:', { error })
    return []
  }
}

export type PatientDashboardData = {
  enrollments: Database['public']['Tables']['trial_enrollments']['Row'][]
  submissions: Database['public']['Tables']['data_submissions']['Row'][]
}

export async function getPatientDashboardDataAction(): Promise<PatientDashboardData> {
  const db = await getUserDb()

  const [enrollments, submissions] = await Promise.all([
    db.trial_enrollments.findMany({ orderBy: { created_at: 'desc' } }),
    db.data_submissions.findMany({ orderBy: { created_at: 'desc' } }),
  ])

  return { enrollments, submissions }
}
