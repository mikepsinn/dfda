import { z } from "zod";





export interface OutcomeMetric {
  displayName: string;
  description: string;
  emoji: string;
  sourceUrl: string;
  modelParameters: ModelParameter[];
  generateDisplayValue: (value: number) => string;
  calculateSensitivity: (value: number, baselineMetrics: Record<string, number>) => {
    bestCase: number;
    worstCase: number;
    assumptions: string[];
  };
  generateCalculationExplanation: (value: number, baselineMetrics: Record<string, number>) => string;
}

export interface ModelParameter {
  displayName: string;
  defaultValue: number;
  unitName: string;
  description: string;
  sourceUrl: string;
  emoji: string;
  sourceQuote?: string;
  generateDisplayValue?: (value: number) => string;
}

// Zod schema for validation
export const modelParameterSchema = z.object({
  displayName: z.string(),
  defaultValue: z.number(),
  unitName: z.string(),
  description: z.string(),
  sourceUrl: z.string().url(),
  emoji: z.string(),
  generateDisplayValue: z.function().args(z.number()).returns(z.string()).optional()
});

export const modelParametersSchema = z.record(modelParameterSchema)

export interface RemainingCostItem {
  item: string
  cost: number
}

export interface CostItem {
  name: string
  currentCost: number
  currentExplanation: string
  newCost: number
  reductionExplanation: string
  remainingExplanation: string
  emoji?: string
  remainingCosts?: RemainingCostItem[]
}
