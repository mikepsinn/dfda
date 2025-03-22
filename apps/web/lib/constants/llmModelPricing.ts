import { ModelName } from '@/lib/utils/modelUtils';

export const MODEL_PRICING: Record<ModelName, { input: number; output: number }> = {
  // Anthropic Claude Models
  'claude-3-5-sonnet-20240620': { input: 0.003, output: 0.015 },
  'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  
  // OpenAI GPT-4 Models
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4o': { input: 0.03, output: 0.06 },
  'gpt-4o-mini': { input: 0.01, output: 0.03 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  
  // Google Gemini Models
  'gemini-2.0-pro-exp-02-05': { input: 0.0001, output: 0.0004 },
  'gemini-2.0-flash-thinking-exp-01-21': { input: 0.00015, output: 0.0006 },
  'gemini-2.0-flash-lite': { input: 0.000075, output: 0.0003 },
  'gemini-1.5-flash': { input: 0.000075, output: 0.0003 },
  'gemini-1.5-flash-8b': { input: 0.0000375, output: 0.00015 },
  'gemini-1.5-flash-8b-latest': { input: 0.0000375, output: 0.00015 },
  'gemini-1.5-pro-latest': { input: 0.00125, output: 0.005 },
  'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
  'gemini-1.0-pro': { input: 0.0035, output: 0.0105 },
  'gemini-1.0-pro-vision': { input: 0.0035, output: 0.0105 },
  
  // Grok Models
  'grok-beta': { input: 0.00015, output: 0.0006 },
  'grok-vision-beta': { input: 0.00015, output: 0.0006 }
} as const; 
