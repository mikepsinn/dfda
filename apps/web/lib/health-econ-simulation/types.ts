import { z } from 'zod';

export interface ModelParameter {
  displayName: string;
  defaultValue: number;
  unitName: string;
  description: string;
  sourceUrl: string;
  emoji: string;
}

// Zod schema for validation
export const modelParameterSchema = z.object({
  displayName: z.string(),
  defaultValue: z.number(),
  unitName: z.string(),
  description: z.string(),
  sourceUrl: z.string().url(),
  emoji: z.string()
});

export const modelParametersSchema = z.record(modelParameterSchema); 