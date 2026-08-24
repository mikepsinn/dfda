"use server"

import {
  fetchDfdaConditions,
  searchRatedConditions,
  addTreatment,
  updateTreatmentReport,
  searchReviewedTreatmentsAndConditions,
  getConditionByNameWithTreatmentRatings,
  createDfdaApplication,
  postMeasurements,
} from "@/lib/dfda/treatments"

import { dfdaGET, dfdaPOST } from "@/lib/dfda/api-client"
import {
  createStudy,
  getStudies,
  getStudy,
  getStudyBySlug,
  joinStudy,
  getTreatmentMetaAnalysis,
  getTreatmentConditionMetaAnalysis,
  getConditionMetaAnalysis,
} from "@/lib/dfda/studies"

import {
  getUserVariable,
  getGlobalVariable,
  getUserVariableWithCharts,
  searchGlobalVariables,
  searchUserVariables,
  getVariable,
  searchVariables,
  searchDfdaVariables,
  getTrackingReminderNotifications,
  trackNotification,
  skipNotification,
  snoozeNotification,
  trackAllNotifications,
  skipAllNotifications,
} from "@/lib/dfda/variables"

import {
  getBenefitStatistics,
  getProblemStatistics,
  getProblems,
} from "@/lib/dfda/statistics"

import { getSafeRedirectUrl } from "@/lib/dfda/auth"
import { GetStudiesResponse } from "@/types/models/GetStudiesResponse"

export {
  // Treatment functions
  fetchDfdaConditions,
  searchRatedConditions,
  addTreatment,
  updateTreatmentReport,
  searchReviewedTreatmentsAndConditions,
  getConditionByNameWithTreatmentRatings,
  createDfdaApplication,
  postMeasurements,

  // API functions
  dfdaGET,
  dfdaPOST,

  // Study functions
  createStudy,
  getStudies,
  getStudy,
  getStudyBySlug,
  joinStudy,
  getTreatmentMetaAnalysis,
  getTreatmentConditionMetaAnalysis,
  getConditionMetaAnalysis,

  // Variable functions
  getUserVariable,
  getGlobalVariable,
  getUserVariableWithCharts,
  searchGlobalVariables,
  searchUserVariables,
  getVariable,
  searchVariables,
  searchDfdaVariables,
  getTrackingReminderNotifications,
  trackNotification,
  skipNotification,
  snoozeNotification,
  trackAllNotifications,
  skipAllNotifications,

  // Statistics functions
  getBenefitStatistics,
  getProblemStatistics,
  getProblems,

  getSafeRedirectUrl,
}


export const getDataSources = async (
  final_callback_url: string,
  userId: string
): Promise<any> => {
  const response = await dfdaGET("connectors/list", {
    final_callback_url,
  }, userId)
  return response.connectors
}

export type SortParam =
  | "-qmScore"
  | "correlationCoefficient"
  | "-correlationCoefficient"
  | "-numberOfUsers"
  | "pValue"

export async function searchPredictors(params: {
  query?: string
  sort?: SortParam
  limit?: number
  offset?: number
  effectVariableName?: string
  causeVariableName?: string
  correlationCoefficient?: string
}) {
  try {
    const apiParams: Record<string, string> = {
      limit: (params.limit || 10).toString(),
      offset: (params.offset || 0).toString(),
    }

    if (params.effectVariableName) {
      apiParams.effectVariableName = params.effectVariableName
    }

    if (params.sort) {
      apiParams.sort = params.sort
    }

    if (params.correlationCoefficient) {
      apiParams.correlationCoefficient = params.correlationCoefficient
    }

    const response = (await dfdaGET("studies", apiParams)) as GetStudiesResponse

    return response.studies || []
  } catch (error) {
    console.error("Error searching studies:", error)
    throw new Error("Failed to search studies")
  }
}
