'use server'

import { createClient } from '@/utils/supabase/server'
import { Tables } from '@/lib/database.types'
import { logger } from '@/lib/logger'

// Type for the returned form definition including questions
export type FormDefinition = Tables<'forms'> & {
  form_questions: Tables<'form_questions'>[]
}

/**
 * Fetches a form and its questions by ID.
 * Includes basic RLS check (user must be authenticated).
 * TODO: Add more specific RLS based on form assignment/visibility if needed.
 * @param formId The UUID of the form to fetch.
 * @returns The form definition or null if not found or on error.
 */
export async function getFormDefinition(formId: string): Promise<FormDefinition | null> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    logger.error('Auth error fetching form definition', { formId, error: authError })
    return null
  }

  const { data: form, error } = await supabase
    .from('forms')
    .select(`
      *,
      form_questions (*)
    `)
    .eq('id', formId)
    .order('order', { foreignTable: 'form_questions', ascending: true })
    .maybeSingle() // Use maybeSingle to return null if not found

  if (error) {
    logger.error('Error fetching form definition from DB', { formId, userId: user.id, error })
    return null
  }

  if (!form) {
     logger.warn('Form definition not found', { formId, userId: user.id })
     return null;
  }

  // RLS implicitly handles whether the user *can* fetch this row.
  // The structure matches FormDefinition type due to the select query.
  return form as FormDefinition;
}


// --- Submission Action Placeholder --- 
// We'll implement this after creating the component

interface AnswerData {
  [questionId: string]: any; // Can be string, number, boolean, string[] (for multi-select/checkbox), or file ID(s)
}

/**
 * Submits answers for a given form.
 * @param formId The ID of the form being submitted.
 * @param answers An object mapping question IDs to their answers.
 * @returns True if submission was successful, false otherwise.
 */
export async function submitFormAnswers(
  formId: string, 
  answers: AnswerData
): Promise<boolean> {
  logger.info('submitFormAnswers called', { formId, answerKeys: Object.keys(answers) })
  // TODO: Implement submission logic
  // 1. Get user ID
  // 2. Create form_submissions record (linking form_id and patient_id (user_id))
  // 3. Loop through answers, creating form_answers records (linking submission_id, question_id, answer_value (JSONB))
  await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
  return true; // Placeholder
} 