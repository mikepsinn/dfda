import { z } from "zod";

// Base schema for any intervention parameter
export const InterventionParameterSchema = z.object({
  name: z.string().describe("Name of the parameter being measured"),
  value: z.number().describe("Magnitude of the change"),
  unit: z.string().describe("Unit of measurement"),
  confidence: z.number().describe("Confidence level in the estimate (0-1)"),
  source: z.string().describe("Source of this parameter estimate"),
});

export type InterventionParameter = z.infer<typeof InterventionParameterSchema>;

// Physical Health Effects
export const PhysicalHealthEffectSchema = z.object({
  bodyComposition: z.object({
    muscleMassChange: InterventionParameterSchema.optional(),
    fatMassChange: InterventionParameterSchema.optional(),
    bmiChange: InterventionParameterSchema.optional(),
  }).optional(),
  
  diseaseProgression: z.object({
    diseaseName: z.string(),
    progressionChangePercent: InterventionParameterSchema,
    severityReduction: InterventionParameterSchema.optional(),
  }).optional(),
  
  mortality: z.object({
    lifespanChangePercent: InterventionParameterSchema.optional(),
    mortalityRiskReduction: InterventionParameterSchema.optional(),
    qualityAdjustedLifeYears: InterventionParameterSchema.optional(),
  }).optional(),
}).describe("Physical health impacts of the intervention");

// Cognitive Effects
export const CognitiveEffectSchema = z.object({
  intelligence: z.object({
    iqChange: InterventionParameterSchema.optional(),
    cognitivePerformance: InterventionParameterSchema.optional(),
    learningAbility: InterventionParameterSchema.optional(),
  }).optional(),
  
  neurodegeneration: z.object({
    conditionName: z.string().optional(),
    progressionSlowingPercent: InterventionParameterSchema.optional(),
    symptomReduction: InterventionParameterSchema.optional(),
  }).optional(),
}).describe("Cognitive and neurological impacts");

// Disease-Specific Effects
export const DiseaseEffectSchema = z.object({
  targetDisease: z.string().describe("Name of the disease being targeted"),
  preventionRate: InterventionParameterSchema.optional(),
  treatmentEfficacy: InterventionParameterSchema.optional(),
  recoveryRate: InterventionParameterSchema.optional(),
  complicationReduction: InterventionParameterSchema.optional(),
}).describe("Disease-specific impacts and outcomes");

// Combined Effects Schema
export const InterventionEffectsSchema = z.object({
  physicalHealth: PhysicalHealthEffectSchema.optional(),
  cognitiveHealth: CognitiveEffectSchema.optional(),
  diseaseSpecific: z.array(DiseaseEffectSchema).optional(),
  customEffects: z.array(InterventionParameterSchema).optional(),
}).describe("Complete intervention effects profile");

export type InterventionEffects = z.infer<typeof InterventionEffectsSchema>;

export class InterventionEffectsAnalyzer {
  static async analyzeEffects(
    interventionDescription: string,
    providedParameters?: Partial<InterventionEffects>
  ): Promise<InterventionEffects> {
    // Implementation will use search and AI to fill in missing parameters
    // This will be implemented in conjunction with the parameter research engine
    throw new Error("Not implemented yet");
  }
} 