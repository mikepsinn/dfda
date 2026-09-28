"use server"

import { createClient } from '@/utils/supabase/server'
import { logger } from '@/lib/logger'
import type { Database } from '@/lib/database.types'
import { handleDatabaseCollectionResponse } from '@/lib/actions-helpers'

export async function getFeaturedTrialsAction() {
  const supabase = await createClient()

  const response = await supabase
    .from('trials')
    .select(`
      id,
      title,
      description,
      research_partner_id,
      treatment_id,
      condition_id,
      status,
      enrollment_target,
      current_enrollment,
      start_date,
      end_date,
      created_at,
      updated_at
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(3)

  if (response.error) {
    logger.error('Error fetching featured trials:', { error: response.error })
    return []
  }

  return handleDatabaseCollectionResponse<Database['public']['Tables']['trials']['Row']>(response)
}

export type PatientDashboardData = {
  enrollments: Database['public']['Tables']['trial_enrollments']['Row'][]
  submissions: Database['public']['Tables']['data_submissions']['Row'][]
}

export async function getPatientDashboardDataAction(): Promise<PatientDashboardData> {
  const supabase = await createClient()

  const [enrollmentsResponse, submissionsResponse] = await Promise.all([
    supabase
      .from('trial_enrollments')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('data_submissions')
      .select('*')
      .order('created_at', { ascending: false }),
  ])

  if (enrollmentsResponse.error) {
    logger.error('Error fetching enrollments:', { error: enrollmentsResponse.error })
    throw enrollmentsResponse.error
  }

  if (submissionsResponse.error) {
    logger.error('Error fetching submissions:', { error: submissionsResponse.error })
    throw submissionsResponse.error
  }

  return {
    enrollments: enrollmentsResponse.data,
    submissions: submissionsResponse.data,
  }
}
