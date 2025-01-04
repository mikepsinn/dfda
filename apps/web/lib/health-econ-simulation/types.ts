import { z } from 'zod';

export interface ModelParameter {
  displayName: string;
  defaultValue: number;
  unitName: string;
  description: string;
  sourceUrl: string;
  emoji: string;
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

export const modelParametersSchema = z.record(modelParameterSchema); 