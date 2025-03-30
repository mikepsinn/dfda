"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { handleDatabaseResponse } from '@/lib/actions-helpers'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

export type ReportedSideEffect = Database['public']['Tables']['reported_side_effects']['Row']
export type ReportedSideEffectInsert = Database['public']['Tables']['reported_side_effects']['Insert']
export type ReportedSideEffectUpdate = Database['public']['Tables']['reported_side_effects']['Update']

export type SideEffectStats = {
  id: string
  description: string
  total_reports: number
  avg_severity: number
  min_severity: number
  max_severity: number
}

// Get side effects for a treatment with stats
export async function getTreatmentSideEffectsAction(treatmentId: string): Promise<SideEffectStats[]> {
  const supabase = await createClient()

  const response = await supabase
    .from('reported_side_effects')
    .select('id, description, severity_out_of_ten')
    .eq('treatment_id', treatmentId)
    .is('deleted_at', null)

  if (response.error) {
    logger.error('Error fetching side effects:', { error: response.error })
    throw new Error('Failed to fetch side effects')
  }

  // Group side effects and calculate stats
  const sideEffectMap = new Map<string, { id: string; severities: number[] }>()
  response.data.forEach(report => {
    if (report.severity_out_of_ten === null) return
    
    const existing = sideEffectMap.get(report.description) || { id: report.id, severities: [] }
    existing.severities.push(report.severity_out_of_ten)
    sideEffectMap.set(report.description, existing)
  })

  return Array.from(sideEffectMap.entries()).map(([description, data]) => ({
    id: data.id,
    description,
    total_reports: data.severities.length,
    avg_severity: data.severities.reduce((a, b) => a + b, 0) / data.severities.length,
    min_severity: Math.min(...data.severities),
    max_severity: Math.max(...data.severities)
  }))
}

// Get individual side effect reports
export async function getTreatmentSideEffectReportsAction(treatmentId: string, limit = 10) {
  const supabase = await createClient()

  const response = await supabase
    .from('reported_side_effects')
    .select(`
      id,
      description,
      severity_out_of_ten,
      created_at,
      profiles (
        id,
        first_name,
        last_name
      )
    `)
    .eq('treatment_id', treatmentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (response.error) {
    logger.error('Error fetching side effect reports:', { error: response.error })
    throw new Error('Failed to fetch side effect reports')
  }

  return response.data
}

// Report a side effect
export async function reportSideEffectAction(sideEffect: ReportedSideEffectInsert): Promise<ReportedSideEffect> {
  const supabase = await createClient()

  const response = await supabase
    .from('reported_side_effects')
    .insert(sideEffect)
    .select()
    .single()

  if (response.error) {
    logger.error('Error reporting side effect:', { error: response.error })
    throw new Error('Failed to report side effect')
  }

  revalidatePath(`/treatment/${sideEffect.treatment_id}`)
  return handleDatabaseResponse<ReportedSideEffect>(response)
}

// Update a side effect report
export async function updateSideEffectReportAction(
  id: string,
  updates: ReportedSideEffectUpdate
): Promise<ReportedSideEffect> {
  const supabase = await createClient()

  const response = await supabase
    .from('reported_side_effects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (response.error) {
    logger.error('Error updating side effect report:', { error: response.error })
    throw new Error('Failed to update side effect report')
  }

  // Get the report to revalidate the correct paths
  const report = await getSideEffectReportByIdAction(id)
  if (report?.treatment_id) {
    revalidatePath(`/treatment/${report.treatment_id}`)
  }

  return handleDatabaseResponse<ReportedSideEffect>(response)
}

// Delete a side effect report
export async function deleteSideEffectReportAction(id: string): Promise<void> {
  const supabase = await createClient()

  // Get the report before deleting to revalidate the correct paths
  const report = await getSideEffectReportByIdAction(id)

  const response = await supabase
    .from('reported_side_effects')
    .delete()
    .eq('id', id)

  if (response.error) {
    logger.error('Error deleting side effect report:', { error: response.error })
    throw new Error('Failed to delete side effect report')
  }

  if (report?.treatment_id) {
    revalidatePath(`/treatment/${report.treatment_id}`)
  }
}

// Get a side effect report by ID
export async function getSideEffectReportByIdAction(id: string): Promise<ReportedSideEffect | null> {
  const supabase = await createClient()

  const response = await supabase
    .from('reported_side_effects')
    .select()
    .eq('id', id)
    .single()

  if (response.error) {
    logger.error('Error fetching side effect report:', { error: response.error })
    throw new Error('Failed to fetch side effect report')
  }

  return handleDatabaseResponse<ReportedSideEffect>(response)
} 