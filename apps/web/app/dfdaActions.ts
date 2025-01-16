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

// Get list of available data sources
export async function getDataSources() {
  return dfdaGET("connectors/list")
}

// ... rest of the file
