import { dfdaGET, dfdaPOST } from "./api-client"
import { findArticleByTopic, writeArticle } from "@/lib/agents/researcher/researcher"
import { searchClinicalTrialConditions, searchClinicalTrialInterventions } from '@/lib/clinicaltables'
import { prisma } from '@repo/mysql-database'
import { Study } from '@/types/models/Study'

export async function createStudy(
  causeVariableName: string,
  effectVariableName: string,
  type: string,
  userId: string
) {
  return dfdaPOST("study/create", {
    causeVariableName,
    effectVariableName,
    type,
  }, userId)
}

export async function getStudies(limit: number = 10) {
  return dfdaGET(`studies`, { limit: limit.toString() })
}

export async function getStudy(studyId: string, userId?: string) {
  console.log('🔍 Fetching study with ID:', studyId)
  try {
    const response = await dfdaGET(`study`, {
      studyId,
      includeCharts: "true",
    }, userId)
    const study = response
    return study
  } catch (error) {
    console.error('❌ Error fetching study:', {
      studyId,
      error: error instanceof Error ? error.message : 'Unknown error',
      fullError: error
    })
    throw error
  }
}

export async function getStudyBySlug(causeVariableId: number, effectVariableId: number, userId?: string): Promise<Study> {
  console.log('🔍 Fetching study by slug:', { causeVariableId, effectVariableId })

  try {
    // Query MySQL database for the aggregate correlation
    const correlation = await prisma.aggregate_correlations.findFirst({
      where: {
        cause_variable_id: causeVariableId,
        effect_variable_id: effectVariableId,
        deleted_at: null,
        is_public: true,
      },
      include: {
        variables_aggregate_correlations_cause_variable_idTovariables: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variables_aggregate_correlations_effect_variable_idTovariables: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (!correlation) {
      throw new Error(`Study not found for cause ${causeVariableId} and effect ${effectVariableId}`)
    }

    // Now fetch the full study data from the API using the correlation ID
    return await getStudy(correlation.id.toString(), userId)
  } catch (error) {
    console.error('❌ Error fetching study by slug:', {
      causeVariableId,
      effectVariableId,
      error: error instanceof Error ? error.message : 'Unknown error',
      fullError: error
    })
    throw error
  }
}

export async function joinStudy(studyId: string, userId: string) {
  console.log("Starting joinStudy with:", { studyId, userId })

  if (!studyId) {
    throw new Error("Study ID is required")
  }

  if (!userId) {
    console.error("Missing userId in session:", userId)
    throw new Error("User ID is required")
  }

  try {
    console.log("Making POST request to join study with params:", {
      studyId,
      clientId: process.env.DFDA_CLIENT_ID,
    })

    const response = await dfdaPOST(
      "study/join",
      {
        studyId,
        clientId: process.env.DFDA_CLIENT_ID,
      },
      userId
    )

    console.log("Join study response:", response)

    // Return the URL instead of redirecting
    return "/dfda/inbox"
  } catch (error) {
    console.error("Error joining study:", {
      studyId,
      clientId: process.env.DFDA_CLIENT_ID,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    })
    throw new Error("Failed to join study")
  }
}

export async function getTreatmentMetaAnalysis(
  treatmentName: string
) {
  if (!treatmentName?.trim()) {
    throw new Error("Treatment name is required")
  }

  // Validate treatment exists in ClinicalTrials.gov
  const treatments = await searchClinicalTrialInterventions(treatmentName)
  const treatmentExists = treatments.some(t => 
    t.toLowerCase() === treatmentName.toLowerCase()
  )

  if (!treatmentExists) {
    throw new Error(`Treatment "${treatmentName}" was not found in clinical trials database`)
  }

  const topic = `Meta-analysis on the safety and effectiveness of ${treatmentName}`
  return findOrWriteArticle(topic)
}

export async function getTreatmentConditionMetaAnalysis(
  treatmentName: string,
  conditionName: string
) {
  if (!treatmentName?.trim() || !conditionName?.trim()) {
    throw new Error("Treatment name and condition name are required")
  }

  // Validate condition and treatment exist in ClinicalTrials.gov
  const [conditions, treatments] = await Promise.all([
    searchClinicalTrialConditions(conditionName),
    searchClinicalTrialInterventions(treatmentName)
  ])

  const conditionExists = conditions.some(c => 
    c.toLowerCase() === conditionName.toLowerCase()
  )
  const treatmentExists = treatments.some(t => 
    t.toLowerCase() === treatmentName.toLowerCase()
  )

  if (!conditionExists && !treatmentExists) {
    throw new Error(`Neither "${treatmentName}" nor "${conditionName}" were found in clinical trials database`)
  } else if (!conditionExists) {
    throw new Error(`Condition "${conditionName}" was not found in clinical trials database`)
  } else if (!treatmentExists) {
    throw new Error(`Treatment "${treatmentName}" was not found in clinical trials database`)
  }

  const topic = `Meta-analysis on the safety and effectiveness of ${treatmentName} for ${conditionName}`
  return findOrWriteArticle(topic)
}

export async function getConditionMetaAnalysis(
  conditionName: string
) {
  if (!conditionName?.trim()) {
    throw new Error("Condition name is required")
  }

  // Validate condition exists in ClinicalTrials.gov
  const conditions = await searchClinicalTrialConditions(conditionName)
  const conditionExists = conditions.some(c => 
    c.toLowerCase() === conditionName.toLowerCase()
  )

  if (!conditionExists) {
    throw new Error(`Condition "${conditionName}" was not found in clinical trials database`)
  }

  const topic = `Meta-analysis on the most effective treatments for ${conditionName}`
  return findOrWriteArticle(topic)
}

async function findOrWriteArticle(topic: string) {
  try {
    const article = await findArticleByTopic(topic)
    if(article) {
      return article
    }
    return writeArticle(topic, "test-user")
  } catch (error) {
    console.error("Failed to generate meta-analysis:", error)
    throw new Error("Failed to generate meta-analysis. Please try again later.")
  }
} 