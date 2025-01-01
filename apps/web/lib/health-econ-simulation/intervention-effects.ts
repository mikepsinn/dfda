import { z } from "zod";
import { LanguageModelV1 } from "@ai-sdk/provider";
import { generateObject } from "ai";
import { getModelByName } from "@/lib/utils/modelUtils";
import { ParameterResearchEngine } from "./parameter-research";

// Base schema for any intervention parameter
export const InterventionParameterSchema = z.object({
  name: z.string().describe("Name of the parameter being measured"),
  value: z.number().describe("Magnitude of the change"),
  unit: z.string().describe("Unit of measurement"),
  confidence: z.number().describe("Confidence level in the estimate (0-1)"),
  source: z.string().describe("Source of this parameter estimate"),
  timeframe: z.string().optional().describe("Time period over which the effect occurs"),
  populationAffected: z.string().optional().describe("Specific population segment affected"),
});

export type InterventionParameter = z.infer<typeof InterventionParameterSchema>;

// Physical Health Effects
export const PhysicalHealthEffectSchema = z.object({
  bodyComposition: z.object({
    muscleMassChange: InterventionParameterSchema.optional(),
    fatMassChange: InterventionParameterSchema.optional(),
    bmiChange: InterventionParameterSchema.optional(),
    metabolicRate: InterventionParameterSchema.optional(),
  }).optional(),
  
  cardiovascular: z.object({
    bloodPressureChange: InterventionParameterSchema.optional(),
    cholesterolChange: InterventionParameterSchema.optional(),
    heartDiseaseRisk: InterventionParameterSchema.optional(),
    strokeRisk: InterventionParameterSchema.optional(),
  }).optional(),

  metabolic: z.object({
    diabetesRisk: InterventionParameterSchema.optional(),
    insulinSensitivity: InterventionParameterSchema.optional(),
    metabolicSyndromeRisk: InterventionParameterSchema.optional(),
  }).optional(),
  
  diseaseProgression: z.object({
    diseaseName: z.string(),
    progressionChangePercent: InterventionParameterSchema,
    severityReduction: InterventionParameterSchema.optional(),
    hospitalizationRate: InterventionParameterSchema.optional(),
    readmissionRate: InterventionParameterSchema.optional(),
  }).optional(),
  
  mortality: z.object({
    lifespanChangePercent: InterventionParameterSchema.optional(),
    mortalityRiskReduction: InterventionParameterSchema.optional(),
    qualityAdjustedLifeYears: InterventionParameterSchema.optional(),
    disabilityAdjustedLifeYears: InterventionParameterSchema.optional(),
  }).optional(),

  functionalStatus: z.object({
    mobilityChange: InterventionParameterSchema.optional(),
    strengthChange: InterventionParameterSchema.optional(),
    balanceChange: InterventionParameterSchema.optional(),
    adlIndependence: InterventionParameterSchema.optional(), // Activities of Daily Living
  }).optional(),
}).describe("Physical health impacts tracked by health agencies");

// Cognitive and Mental Health Effects
export const CognitiveEffectSchema = z.object({
  intelligence: z.object({
    iqChange: InterventionParameterSchema.optional(),
    cognitivePerformance: InterventionParameterSchema.optional(),
    learningAbility: InterventionParameterSchema.optional(),
    memoryFunction: InterventionParameterSchema.optional(),
    executiveFunction: InterventionParameterSchema.optional(),
  }).optional(),
  
  mentalHealth: z.object({
    depressionScore: InterventionParameterSchema.optional(),
    anxietyLevel: InterventionParameterSchema.optional(),
    stressLevel: InterventionParameterSchema.optional(),
    qualityOfLife: InterventionParameterSchema.optional(),
  }).optional(),
  
  neurodegeneration: z.object({
    conditionName: z.string().optional(),
    progressionSlowingPercent: InterventionParameterSchema.optional(),
    symptomReduction: InterventionParameterSchema.optional(),
    brainVolumeChange: InterventionParameterSchema.optional(),
    cognitiveDeclineRate: InterventionParameterSchema.optional(),
  }).optional(),
}).describe("Cognitive and mental health impacts");

// Healthcare Utilization Effects
export const HealthcareUtilizationSchema = z.object({
  primaryCare: z.object({
    visitFrequency: InterventionParameterSchema.optional(),
    preventiveServices: InterventionParameterSchema.optional(),
    screeningRates: InterventionParameterSchema.optional(),
  }).optional(),

  hospitalizations: z.object({
    admissionRate: InterventionParameterSchema.optional(),
    lengthOfStay: InterventionParameterSchema.optional(),
    icuUtilization: InterventionParameterSchema.optional(),
    readmissionRate: InterventionParameterSchema.optional(),
  }).optional(),

  medicationUse: z.object({
    prescriptionChanges: InterventionParameterSchema.optional(),
    adherenceRate: InterventionParameterSchema.optional(),
    adverseEvents: InterventionParameterSchema.optional(),
  }).optional(),

  specialtyCare: z.object({
    referralRate: InterventionParameterSchema.optional(),
    specialistVisits: InterventionParameterSchema.optional(),
    procedureRate: InterventionParameterSchema.optional(),
  }).optional(),
}).describe("Healthcare system utilization impacts");

// Public Health Effects
export const PublicHealthEffectSchema = z.object({
  diseasePrevalence: z.object({
    incidenceRate: InterventionParameterSchema.optional(),
    prevalenceRate: InterventionParameterSchema.optional(),
    riskReduction: InterventionParameterSchema.optional(),
  }).optional(),

  healthDisparities: z.object({
    accessGap: InterventionParameterSchema.optional(),
    outcomeDisparity: InterventionParameterSchema.optional(),
    utilizationEquity: InterventionParameterSchema.optional(),
  }).optional(),

  communityHealth: z.object({
    communityWellness: InterventionParameterSchema.optional(),
    socialDeterminants: InterventionParameterSchema.optional(),
    environmentalHealth: InterventionParameterSchema.optional(),
  }).optional(),

  preventiveCare: z.object({
    vaccinationRates: InterventionParameterSchema.optional(),
    screeningRates: InterventionParameterSchema.optional(),
    healthEducation: InterventionParameterSchema.optional(),
  }).optional(),
}).describe("Population-level public health impacts");

// Combined Effects Schema
export const InterventionEffectsSchema = z.object({
  physicalHealth: PhysicalHealthEffectSchema.optional(),
  cognitiveHealth: CognitiveEffectSchema.optional(),
  healthcareUtilization: HealthcareUtilizationSchema.optional(),
  publicHealth: PublicHealthEffectSchema.optional(),
  customEffects: z.array(InterventionParameterSchema).optional(),
}).describe("Complete intervention effects profile with government health agency metrics");

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

    // Research each major category of effects
    const [
      physicalHealth,
      cognitiveHealth,
      healthcareUtilization,
      publicHealth,
    ] = await Promise.all([
      this.researchPhysicalHealth(interventionDescription),
      this.researchCognitiveHealth(interventionDescription),
      this.researchHealthcareUtilization(interventionDescription),
      this.researchPublicHealth(interventionDescription),
    ]);

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
  ): Promise<z.infer<typeof PhysicalHealthEffectSchema> | null> {
    try {
      const parameters = await this.parameterEngine.researchParameter(
        "physical health outcomes",
        interventionDescription
      );
      
      return this.convertToSchemaFormat(parameters, PhysicalHealthEffectSchema);
    } catch (error) {
      console.error("Error researching physical health:", error);
      return null;
    }
  }

  private async researchCognitiveHealth(
    interventionDescription: string
  ): Promise<z.infer<typeof CognitiveEffectSchema> | null> {
    try {
      const parameters = await this.parameterEngine.researchParameter(
        "cognitive and mental health outcomes",
        interventionDescription
      );
      
      return this.convertToSchemaFormat(parameters, CognitiveEffectSchema);
    } catch (error) {
      console.error("Error researching cognitive health:", error);
      return null;
    }
  }

  private async researchHealthcareUtilization(
    interventionDescription: string
  ): Promise<z.infer<typeof HealthcareUtilizationSchema> | null> {
    try {
      const parameters = await this.parameterEngine.researchParameter(
        "healthcare utilization impacts",
        interventionDescription
      );
      
      return this.convertToSchemaFormat(parameters, HealthcareUtilizationSchema);
    } catch (error) {
      console.error("Error researching healthcare utilization:", error);
      return null;
    }
  }

  private async researchPublicHealth(
    interventionDescription: string
  ): Promise<z.infer<typeof PublicHealthEffectSchema> | null> {
    try {
      const parameters = await this.parameterEngine.researchParameter(
        "public health impacts",
        interventionDescription
      );
      
      return this.convertToSchemaFormat(parameters, PublicHealthEffectSchema);
    } catch (error) {
      console.error("Error researching public health:", error);
      return null;
    }
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