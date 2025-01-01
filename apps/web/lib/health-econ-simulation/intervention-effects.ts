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
  bodyComposition: z.object({
    muscleMassChange: InterventionParameterSchema.optional().describe("Change in lean muscle mass"),
    fatMassChange: InterventionParameterSchema.optional().describe("Change in body fat percentage or mass"),
    bmiChange: InterventionParameterSchema.optional().describe("Change in Body Mass Index"),
    metabolicRate: InterventionParameterSchema.optional().describe("Change in basal metabolic rate"),
  }).optional().describe("Changes in body composition and metabolism"),
  
  cardiovascular: z.object({
    bloodPressureChange: InterventionParameterSchema.optional().describe("Change in systolic/diastolic blood pressure"),
    cholesterolChange: InterventionParameterSchema.optional().describe("Change in cholesterol levels (LDL/HDL)"),
    heartDiseaseRisk: InterventionParameterSchema.optional().describe("Change in cardiovascular disease risk"),
    strokeRisk: InterventionParameterSchema.optional().describe("Change in stroke risk probability"),
  }).optional().describe("Cardiovascular health impacts"),

  metabolic: z.object({
    diabetesRisk: InterventionParameterSchema.optional().describe("Change in type 2 diabetes risk"),
    insulinSensitivity: InterventionParameterSchema.optional().describe("Change in insulin response"),
    metabolicSyndromeRisk: InterventionParameterSchema.optional().describe("Change in metabolic syndrome risk"),
  }).optional().describe("Metabolic health impacts"),
  
  diseaseProgression: z.object({
    diseaseName: z.string().describe("Name of the specific disease being tracked"),
    progressionChangePercent: InterventionParameterSchema.optional().describe("Rate of disease progression change"),
    severityReduction: InterventionParameterSchema.optional().describe("Reduction in disease severity"),
    hospitalizationRate: InterventionParameterSchema.optional().describe("Change in disease-related hospitalization rate"),
    readmissionRate: InterventionParameterSchema.optional().describe("Change in hospital readmission rate"),
  }).optional().describe("Disease progression metrics"),
  
  mortality: z.object({
    lifespanChangePercent: InterventionParameterSchema.optional().describe("Percent change in life expectancy"),
    mortalityRiskReduction: InterventionParameterSchema.optional().describe("Reduction in mortality risk"),
    qualityAdjustedLifeYears: InterventionParameterSchema.optional().describe("QALYs gained from intervention"),
    disabilityAdjustedLifeYears: InterventionParameterSchema.optional().describe("DALYs averted by intervention"),
  }).optional().describe("Mortality and life expectancy impacts"),

  functionalStatus: z.object({
    mobilityChange: InterventionParameterSchema.optional().describe("Change in physical mobility"),
    strengthChange: InterventionParameterSchema.optional().describe("Change in muscular strength"),
    balanceChange: InterventionParameterSchema.optional().describe("Change in balance and stability"),
    adlIndependence: InterventionParameterSchema.optional().describe("Change in Activities of Daily Living independence"),
  }).optional().describe("Functional capacity and independence metrics"),
}).describe("Comprehensive physical health impacts tracked by health agencies");

// Cognitive and Mental Health Effects
export const CognitiveEffectSchema = z.object({
  intelligence: z.object({
    iqChange: InterventionParameterSchema.optional().describe("Change in Intelligence Quotient"),
    cognitivePerformance: InterventionParameterSchema.optional().describe("Change in cognitive test performance"),
    learningAbility: InterventionParameterSchema.optional().describe("Change in learning capacity"),
    memoryFunction: InterventionParameterSchema.optional().describe("Change in memory performance"),
    executiveFunction: InterventionParameterSchema.optional().describe("Change in executive function capacity"),
  }).optional().describe("Cognitive performance metrics"),
  
  mentalHealth: z.object({
    depressionScore: InterventionParameterSchema.optional().describe("Change in depression assessment scores"),
    anxietyLevel: InterventionParameterSchema.optional().describe("Change in anxiety levels"),
    stressLevel: InterventionParameterSchema.optional().describe("Change in stress levels"),
    qualityOfLife: InterventionParameterSchema.optional().describe("Change in quality of life scores"),
  }).optional().describe("Mental health and wellbeing metrics"),
  
  neurodegeneration: z.object({
    conditionName: z.string().describe("Name of the neurodegenerative condition"),
    progressionSlowingPercent: InterventionParameterSchema.optional().describe("Reduction in neurodegeneration rate"),
    symptomReduction: InterventionParameterSchema.optional().describe("Reduction in neurological symptoms"),
    brainVolumeChange: InterventionParameterSchema.optional().describe("Change in brain volume measurements"),
    cognitiveDeclineRate: InterventionParameterSchema.optional().describe("Change in cognitive decline rate"),
  }).optional().describe("Neurodegenerative disease impacts"),
}).describe("Cognitive function and mental health impacts");

// Healthcare Utilization Effects
export const HealthcareUtilizationSchema = z.object({
  primaryCare: z.object({
    visitFrequency: InterventionParameterSchema.optional().describe("Change in primary care visit frequency"),
    preventiveServices: InterventionParameterSchema.optional().describe("Change in preventive service utilization"),
    screeningRates: InterventionParameterSchema.optional().describe("Change in health screening rates"),
  }).optional().describe("Primary care utilization metrics"),

  hospitalizations: z.object({
    admissionRate: InterventionParameterSchema.optional().describe("Change in hospital admission rates"),
    lengthOfStay: InterventionParameterSchema.optional().describe("Change in average length of stay"),
    icuUtilization: InterventionParameterSchema.optional().describe("Change in ICU utilization"),
    readmissionRate: InterventionParameterSchema.optional().describe("Change in hospital readmission rates"),
  }).optional().describe("Hospital utilization metrics"),

  medicationUse: z.object({
    prescriptionChanges: InterventionParameterSchema.optional().describe("Change in prescription medication use"),
    adherenceRate: InterventionParameterSchema.optional().describe("Change in medication adherence"),
    adverseEvents: InterventionParameterSchema.optional().describe("Change in medication adverse events"),
  }).optional().describe("Medication utilization metrics"),

  specialtyCare: z.object({
    referralRate: InterventionParameterSchema.optional().describe("Change in specialty care referrals"),
    specialistVisits: InterventionParameterSchema.optional().describe("Change in specialist visit frequency"),
    procedureRate: InterventionParameterSchema.optional().describe("Change in medical procedure rates"),
  }).optional().describe("Specialty care utilization metrics"),
}).describe("Healthcare system utilization impacts");

// Public Health Effects
export const PublicHealthEffectSchema = z.object({
  diseasePrevalence: z.object({
    incidenceRate: InterventionParameterSchema.optional().describe("Change in new case rates"),
    prevalenceRate: InterventionParameterSchema.optional().describe("Change in total case prevalence"),
    riskReduction: InterventionParameterSchema.optional().describe("Population-level risk reduction"),
  }).optional().describe("Disease prevalence metrics"),

  healthDisparities: z.object({
    accessGap: InterventionParameterSchema.optional().describe("Change in healthcare access disparities"),
    outcomeDisparity: InterventionParameterSchema.optional().describe("Change in health outcome disparities"),
    utilizationEquity: InterventionParameterSchema.optional().describe("Change in care utilization equity"),
  }).optional().describe("Health equity metrics"),

  communityHealth: z.object({
    communityWellness: InterventionParameterSchema.optional().describe("Change in community health scores"),
    socialDeterminants: InterventionParameterSchema.optional().describe("Impact on social health determinants"),
    environmentalHealth: InterventionParameterSchema.optional().describe("Impact on environmental health factors"),
  }).optional().describe("Community health metrics"),

  preventiveCare: z.object({
    vaccinationRates: InterventionParameterSchema.optional().describe("Change in vaccination coverage"),
    screeningRates: InterventionParameterSchema.optional().describe("Change in health screening participation"),
    healthEducation: InterventionParameterSchema.optional().describe("Impact of health education programs"),
  }).optional().describe("Preventive care metrics"),
}).describe("Population-level public health impacts");

// Combined Effects Schema
export const InterventionEffectsSchema = z.object({
  physicalHealth: PhysicalHealthEffectSchema.optional(),
  cognitiveHealth: CognitiveEffectSchema.optional(),
  healthcareUtilization: HealthcareUtilizationSchema.optional(),
  publicHealth: PublicHealthEffectSchema.optional(),
  customEffects: z.array(InterventionParameterSchema).optional().describe("Additional custom parameters not covered by standard categories"),
}).describe("Complete intervention effects profile with comprehensive health metrics");

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
    let effects: Partial<InterventionEffects> = providedParameters || {};

    // Research each major category of effects sequentially
    const physicalHealth = await this.researchPhysicalHealth(interventionDescription);
    const cognitiveHealth = await this.researchCognitiveHealth(interventionDescription);
    const healthcareUtilization = await this.researchHealthcareUtilization(interventionDescription);
    const publicHealth = await this.researchPublicHealth(interventionDescription);

    // Combine all effects
    const result: InterventionEffects = {
      physicalHealth: physicalHealth || undefined,
      cognitiveHealth: cognitiveHealth || undefined,
      healthcareUtilization: healthcareUtilization || undefined,
      publicHealth: publicHealth || undefined,
      customEffects: effects.customEffects,
    };

    return result;
  }

  private async researchPhysicalHealth(
    interventionDescription: string
  ): Promise<z.infer<typeof PhysicalHealthEffectSchema>> {
    const parameters = await this.parameterEngine.researchParameter(
      "physical health outcomes",
      interventionDescription
    );
    
    return this.convertToSchemaFormat(parameters, PhysicalHealthEffectSchema);
  }

  private async researchCognitiveHealth(
    interventionDescription: string
  ): Promise<z.infer<typeof CognitiveEffectSchema>> {
    const parameters = await this.parameterEngine.researchParameter(
      "cognitive and mental health outcomes",
      interventionDescription
    );
    
    return this.convertToSchemaFormat(parameters, CognitiveEffectSchema);
  }

  private async researchHealthcareUtilization(
    interventionDescription: string
  ): Promise<z.infer<typeof HealthcareUtilizationSchema>> {
    const parameters = await this.parameterEngine.researchParameter(
      "healthcare utilization impacts",
      interventionDescription
    );
    
    return this.convertToSchemaFormat(parameters, HealthcareUtilizationSchema);
  }

  private async researchPublicHealth(
    interventionDescription: string
  ): Promise<z.infer<typeof PublicHealthEffectSchema>> {
    const parameters = await this.parameterEngine.researchParameter(
      "public health impacts",
      interventionDescription
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