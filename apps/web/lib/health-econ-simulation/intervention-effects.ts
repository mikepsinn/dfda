import { z } from "zod";
import { LanguageModelV1 } from "@ai-sdk/provider";
import { generateObject } from "ai";
import { getModelByName } from "@/lib/utils/modelUtils";
import { ParameterResearchEngine } from "./parameter-research";

// Base schema for any intervention parameter
export const InterventionParameterSchema = z.object({
  name: z.string().describe("Name of the parameter being measured - should be specific and descriptive"),
  value: z.number().describe("Quantitative magnitude of the change or effect"),
  unit: z.string().describe("Standard unit of measurement for the parameter (e.g., percent, years, dollars)"),
  confidence: z.number().describe("Statistical confidence level in the estimate, ranging from 0 to 1"),
  source: z.string().describe("Citation or reference for the data source"),
  timeframe: z.string().describe("Time period over which the effect occurs (e.g., annual, 5-year, per incident)"),
  populationAffected: z.string().describe("Specific demographic or population segment experiencing the effect"),
}).describe("Standard format for any measurable intervention parameter");

export type InterventionParameter = z.infer<typeof InterventionParameterSchema>;

// Physical Health Effects
export const PhysicalHealthEffectSchema = z.object({
  diseaseProgression: z.object({
    diseaseName: z.string().describe("Name of the specific disease being tracked"),
    progressionChangePercent: InterventionParameterSchema.describe("Rate of disease progression change"),
    severityReduction: InterventionParameterSchema.describe("Reduction in disease severity"),
    hospitalizationRate: InterventionParameterSchema.optional().describe("Change in disease-related hospitalization rate"),
    readmissionRate: InterventionParameterSchema.optional().describe("Change in hospital readmission rate"),
  }).partial().describe("Disease progression metrics"),
  
  mortality: z.object({
    lifespanChangePercent: InterventionParameterSchema.describe("Percent change in life expectancy"),
    mortalityRiskReduction: InterventionParameterSchema.describe("Reduction in mortality risk"),
    qualityAdjustedLifeYears: InterventionParameterSchema.optional().describe("QALYs gained from intervention"),
    disabilityAdjustedLifeYears: InterventionParameterSchema.optional().describe("DALYs averted by intervention"),
  }).partial().describe("Mortality and life expectancy impacts"),

  bodyComposition: z.object({
    muscleMassChange: InterventionParameterSchema.describe("Change in lean muscle mass"),
    fatMassChange: InterventionParameterSchema.describe("Change in body fat percentage or mass"),
    bmiChange: InterventionParameterSchema.optional().describe("Change in Body Mass Index"),
    metabolicRate: InterventionParameterSchema.optional().describe("Change in basal metabolic rate"),
  }).partial().describe("Changes in body composition and metabolism"),
  
  cardiovascular: z.object({
    bloodPressureChange: InterventionParameterSchema.describe("Change in systolic/diastolic blood pressure"),
    cholesterolChange: InterventionParameterSchema.describe("Change in cholesterol levels (LDL/HDL)"),
    heartDiseaseRisk: InterventionParameterSchema.optional().describe("Change in cardiovascular disease risk"),
    strokeRisk: InterventionParameterSchema.optional().describe("Change in stroke risk probability"),
  }).partial().describe("Cardiovascular health impacts"),

  metabolic: z.object({
    diabetesRisk: InterventionParameterSchema.describe("Change in type 2 diabetes risk"),
    insulinSensitivity: InterventionParameterSchema.describe("Change in insulin response"),
    metabolicSyndromeRisk: InterventionParameterSchema.optional().describe("Change in metabolic syndrome risk"),
  }).partial().describe("Metabolic health impacts"),

  functionalStatus: z.object({
    mobilityChange: InterventionParameterSchema.describe("Change in physical mobility"),
    strengthChange: InterventionParameterSchema.describe("Change in muscular strength"),
    balanceChange: InterventionParameterSchema.optional().describe("Change in balance and stability"),
    adlIndependence: InterventionParameterSchema.optional().describe("Change in Activities of Daily Living independence"),
  }).partial().describe("Functional capacity and independence metrics"),
}).partial().describe("Comprehensive physical health impacts tracked by health agencies");

// Cognitive and Mental Health Effects
export const CognitiveEffectSchema = z.object({
  intelligence: z.object({
    iqChange: InterventionParameterSchema.describe("Change in Intelligence Quotient"),
    cognitivePerformance: InterventionParameterSchema.describe("Change in cognitive test performance"),
    learningAbility: InterventionParameterSchema.optional().describe("Change in learning capacity"),
    memoryFunction: InterventionParameterSchema.optional().describe("Change in memory performance"),
    executiveFunction: InterventionParameterSchema.optional().describe("Change in executive function capacity"),
  }).describe("Cognitive performance metrics"),
  
  mentalHealth: z.object({
    depressionScore: InterventionParameterSchema.describe("Change in depression assessment scores"),
    anxietyLevel: InterventionParameterSchema.describe("Change in anxiety levels"),
    stressLevel: InterventionParameterSchema.optional().describe("Change in stress levels"),
    qualityOfLife: InterventionParameterSchema.optional().describe("Change in quality of life scores"),
  }).describe("Mental health and wellbeing metrics"),
  
  neurodegeneration: z.object({
    conditionName: z.string().describe("Name of the neurodegenerative condition"),
    progressionSlowingPercent: InterventionParameterSchema.describe("Reduction in neurodegeneration rate"),
    symptomReduction: InterventionParameterSchema.describe("Reduction in neurological symptoms"),
    brainVolumeChange: InterventionParameterSchema.optional().describe("Change in brain volume measurements"),
    cognitiveDeclineRate: InterventionParameterSchema.optional().describe("Change in cognitive decline rate"),
  }).describe("Neurodegenerative disease impacts"),
}).partial().describe("Cognitive function and mental health impacts");

// Healthcare Utilization Effects
export const HealthcareUtilizationSchema = z.object({
  hospitalizations: z.object({
    admissionRate: InterventionParameterSchema.describe("Change in hospital admission rates"),
    lengthOfStay: InterventionParameterSchema.describe("Change in average length of stay"),
    icuUtilization: InterventionParameterSchema.optional().describe("Change in ICU utilization"),
    readmissionRate: InterventionParameterSchema.optional().describe("Change in hospital readmission rates"),
  }).describe("Hospital utilization metrics"),

  medicationUse: z.object({
    prescriptionChanges: InterventionParameterSchema.describe("Change in prescription medication use"),
    adherenceRate: InterventionParameterSchema.describe("Change in medication adherence"),
    adverseEvents: InterventionParameterSchema.optional().describe("Change in medication adverse events"),
  }).describe("Medication utilization metrics"),

  primaryCare: z.object({
    visitFrequency: InterventionParameterSchema.describe("Change in primary care visit frequency"),
    preventiveServices: InterventionParameterSchema.optional().describe("Change in preventive service utilization"),
    screeningRates: InterventionParameterSchema.optional().describe("Change in health screening rates"),
  }).describe("Primary care utilization metrics"),

  specialtyCare: z.object({
    referralRate: InterventionParameterSchema.describe("Change in specialty care referrals"),
    specialistVisits: InterventionParameterSchema.optional().describe("Change in specialist visit frequency"),
    procedureRate: InterventionParameterSchema.optional().describe("Change in medical procedure rates"),
  }).describe("Specialty care utilization metrics"),
}).partial().describe("Healthcare system utilization impacts");

// Public Health Effects
export const PublicHealthEffectSchema = z.object({
  diseasePrevalence: z.object({
    incidenceRate: InterventionParameterSchema.describe("Change in new case rates"),
    prevalenceRate: InterventionParameterSchema.describe("Change in total case prevalence"),
    riskReduction: InterventionParameterSchema.optional().describe("Population-level risk reduction"),
  }).describe("Disease prevalence metrics"),

  healthDisparities: z.object({
    accessGap: InterventionParameterSchema.describe("Change in healthcare access disparities"),
    outcomeDisparity: InterventionParameterSchema.describe("Change in health outcome disparities"),
    utilizationEquity: InterventionParameterSchema.optional().describe("Change in care utilization equity"),
  }).describe("Health equity metrics"),

  communityHealth: z.object({
    communityWellness: InterventionParameterSchema.describe("Change in community health scores"),
    socialDeterminants: InterventionParameterSchema.optional().describe("Impact on social health determinants"),
    environmentalHealth: InterventionParameterSchema.optional().describe("Impact on environmental health factors"),
  }).describe("Community health metrics"),

  preventiveCare: z.object({
    vaccinationRates: InterventionParameterSchema.describe("Change in vaccination coverage"),
    screeningRates: InterventionParameterSchema.describe("Change in health screening participation"),
    healthEducation: InterventionParameterSchema.optional().describe("Impact of health education programs"),
  }).describe("Preventive care metrics"),
}).partial().describe("Population-level public health impacts");

// Combined Effects Schema
export const InterventionEffectsSchema = z.object({
  physicalHealth: PhysicalHealthEffectSchema,
  cognitiveHealth: CognitiveEffectSchema,
  healthcareUtilization: HealthcareUtilizationSchema,
  publicHealth: PublicHealthEffectSchema,
  customEffects: z.array(InterventionParameterSchema).optional().describe("Additional custom parameters not covered by standard categories"),
}).partial().describe("Complete intervention effects profile with comprehensive health metrics");

export type InterventionEffects = z.infer<typeof InterventionEffectsSchema>;

export class InterventionEffectsAnalyzer {
  private parameterEngine: ParameterResearchEngine;
  private model: LanguageModelV1;

  constructor(parameterEngine: ParameterResearchEngine) {
    this.parameterEngine = parameterEngine;
    this.model = getModelByName();
  }

  async analyzeEffects(
    interventionDescription: string,
    providedParameters?: Partial<InterventionEffects>
  ): Promise<InterventionEffects> {
    // Start with provided parameters if any
    const effects: Partial<InterventionEffects> = providedParameters || {};

    // Only research if we don't have any provided parameters
    // or if we're missing specific subcategories we need
    const result: InterventionEffects = {
      physicalHealth: effects.physicalHealth,
      cognitiveHealth: undefined,
      healthcareUtilization: undefined,
      publicHealth: undefined,
      customEffects: effects.customEffects,
    };

    // Only research additional effects if we need them for economic calculations
    if (effects.physicalHealth?.bodyComposition?.muscleMassChange) {
      // If we have muscle mass data, we don't need to research anything else
      // The economic calculator can work with just this data
      return result;
    }

    // If we don't have the specific data we need, research everything
    if (!effects.physicalHealth) {
      result.physicalHealth = await this.researchPhysicalHealth(interventionDescription);
    }
    if (!effects.cognitiveHealth) {
      result.cognitiveHealth = await this.researchCognitiveHealth(interventionDescription);
    }
    if (!effects.healthcareUtilization) {
      result.healthcareUtilization = await this.researchHealthcareUtilization(interventionDescription);
    }
    if (!effects.publicHealth) {
      result.publicHealth = await this.researchPublicHealth(interventionDescription);
    }

    return result;
  }

  private async researchPhysicalHealth(
    interventionDescription: string
  ): Promise<z.infer<typeof PhysicalHealthEffectSchema>> {
    const parameters = await this.parameterEngine.researchParameter(
      "physical health outcomes and effects on body composition, cardiovascular health, and functional status",
      ""
    );
    
    return this.convertToSchemaFormat(parameters, PhysicalHealthEffectSchema);
  }

  private async researchCognitiveHealth(
    interventionDescription: string
  ): Promise<z.infer<typeof CognitiveEffectSchema>> {
    const parameters = await this.parameterEngine.researchParameter(
      "cognitive and mental health outcomes and effects on intelligence, mental health, and neurodegeneration",
      ""
    );
    
    return this.convertToSchemaFormat(parameters, CognitiveEffectSchema);
  }

  private async researchHealthcareUtilization(
    interventionDescription: string
  ): Promise<z.infer<typeof HealthcareUtilizationSchema>> {
    const parameters = await this.parameterEngine.researchParameter(
      "healthcare utilization impacts on hospitalizations, medication use, and care delivery",
      ""
    );
    
    return this.convertToSchemaFormat(parameters, HealthcareUtilizationSchema);
  }

  private async researchPublicHealth(
    interventionDescription: string
  ): Promise<z.infer<typeof PublicHealthEffectSchema>> {
    const parameters = await this.parameterEngine.researchParameter(
      "public health impacts on disease prevalence, health disparities, and community health",
      ""
    );
    
    return this.convertToSchemaFormat(parameters, PublicHealthEffectSchema);
  }

  private async convertToSchemaFormat<T>(
    parameters: any,
    schema: z.ZodType<T>
  ): Promise<T> {
    const prompt = `
      Convert the following parameter estimates into the required schema format:
      ${JSON.stringify(parameters, null, 2)}
      
      Target schema:
      ${schema.toString()}
    `;

    const result = await generateObject({
      model: this.model,
      schema: schema,
      prompt,
    });

    return result.object as T;
  }
} 