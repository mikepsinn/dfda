import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { LanguageModelV1 } from "@ai-sdk/provider";
import { xai } from '@ai-sdk/xai';

export type ModelName = 'claude-3-5-sonnet-20240620' | 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307' |
    'gpt-4o' | 'gpt-4o-2024-05-13' | 'gpt-4o-2024-08-06' | 'gpt-4o-mini' | 'gpt-4o-mini-2024-07-18' | 'gpt-4-turbo' | 'gpt-4-turbo-2024-04-09' | 'gpt-4-turbo-preview' | 'gpt-4-0125-preview' | 'gpt-4-1106-preview' | 'gpt-4' | 'gpt-4-0613' | 'gpt-3.5-turbo-0125' | 'gpt-3.5-turbo' | 'gpt-3.5-turbo-1106' |
    'gemini-1.5-flash-latest' | 'gemini-1.5-flash' | 'gemini-1.5-pro-latest' | 'gemini-1.5-pro' | 'gemini-1.0-pro' |
    'grok-beta' | 'grok-vision-beta' |
    'openai-o1' | 'openai-o3-mini';

export const MODEL_PRICING: Record<ModelName, { input: number; output: number }> = {
  'gpt-4': { input: 0.03, output: 0.06 },
  'gpt-4-turbo': { input: 0.01, output: 0.03 },
  'gpt-4-turbo-2024-04-09': { input: 0.01, output: 0.03 },
  'gpt-4-turbo-preview': { input: 0.01, output: 0.03 },
  'gpt-4-0125-preview': { input: 0.01, output: 0.03 },
  'gpt-4-1106-preview': { input: 0.01, output: 0.03 },
  'gpt-4-0613': { input: 0.03, output: 0.06 },
  'gpt-4o': { input: 0.0025, output: 0.01 },
  'gpt-4o-2024-05-13': { input: 0.0025, output: 0.01 },
  'gpt-4o-2024-08-06': { input: 0.0025, output: 0.01 },
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o-mini-2024-07-18': { input: 0.00015, output: 0.0006 },
  'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
  'gpt-3.5-turbo-0125': { input: 0.0005, output: 0.0015 },
  'gpt-3.5-turbo-1106': { input: 0.0005, output: 0.0015 },
  'claude-3-5-sonnet-20240620': { input: 0.003, output: 0.015 },
  'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
  'claude-3-sonnet-20240229': { input: 0.003, output: 0.015 },
  'claude-3-haiku-20240307': { input: 0.00025, output: 0.00125 },
  'gemini-1.5-pro': { input: 0.0035, output: 0.0105 },
  'gemini-1.5-pro-latest': { input: 0.0035, output: 0.0105 },
  'gemini-1.5-flash': { input: 0.00075, output: 0.0035 },
  'gemini-1.5-flash-latest': { input: 0.00075, output: 0.0035 },
  'gemini-1.0-pro': { input: 0.0035, output: 0.0105 },
  'grok-beta': { input: 0.00015, output: 0.0006 },
  'grok-vision-beta': { input: 0.00015, output: 0.0006 },
  'openai-o1': { input: 0.015, output: 0.06 },
  'openai-o3-mini': { input: 0.0011, output: 0.0044 }
};

export const DEFAULT_MODEL_NAME: ModelName = 'gpt-4o-mini';

// Type guard to validate model names
function isValidModelName(model: string): model is ModelName {
  return Object.keys(MODEL_PRICING).includes(model as ModelName);
}

export function getModelByName(modelName: ModelName = DEFAULT_MODEL_NAME): LanguageModelV1 {
  console.log(`🤖 Using AI model: ${modelName}`);
  
  if (modelName.includes("claude")) {
    return anthropic(modelName)
  }
  if (modelName.includes("gpt") || modelName.includes("openai-")) {
    return openai(modelName)
  }
  if (modelName.includes("grok")) {
    return xai(modelName);
  }
  if (modelName.includes("gemini")) {
    return google("models/" + modelName, {
      safetySettings: [
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
      ],
    })
  }
  return anthropic(DEFAULT_MODEL_NAME) // Default model
} 