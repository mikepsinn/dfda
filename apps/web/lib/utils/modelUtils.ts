import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import {createOpenAI, openai} from "@ai-sdk/openai";
import { LanguageModelV1 } from "@ai-sdk/provider";
import { xai } from '@ai-sdk/xai';
import {createOllama} from "ollama-ai-provider";
import {createAzure} from "@ai-sdk/azure";

const validModels = [
  'claude-3-5-sonnet-20240620',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
  'gpt-4o',                                    // $30/1M input, $60/1M output tokens
  'gpt-4o-mini',                              // $10/1M input, $30/1M output tokens
  'gpt-4-turbo',                              // $10/1M input, $30/1M output tokens
  'gpt-4',                                    // $30/1M input, $60/1M output tokens
  'gpt-3.5-turbo',                            // $0.50/1M input, $1.50/1M output tokens
  'gemini-2.0-pro-exp-02-05',                  // $0.10/1M input, $0.40/1M output - Supports structured output
  'gemini-2.0-flash-thinking-exp-01-21',       // $0.15/1M input, $0.60/1M output - No JSON support
  'gemini-2.0-flash-lite',                     // $0.075/1M input, $0.30/1M output - Supports structured output
  'gemini-1.5-flash',                          // $0.075/1M input, $0.30/1M output (<128k) - No JSON support
  'gemini-1.5-flash-8b',                       // $0.0375/1M input, $0.15/1M output (<128k) - Supports JSON mode
  'gemini-1.5-flash-8b-latest',                // $0.0375/1M input, $0.15/1M output (<128k) - Supports JSON mode
  'gemini-1.5-pro-latest',                     // $1.25/1M input, $5.00/1M output (<128k) - Supports JSON output
  'gemini-1.5-pro',                            // $1.25/1M input, $5.00/1M output (<128k) - Supports JSON output
  'gemini-1.0-pro',                            // Legacy model, pricing varies - Limited JSON support
  'gemini-1.0-pro-vision',                     // Vision model pricing - Text & image input, text output only
  'grok-beta',
  'grok-vision-beta'
] as const;

export type ModelName = typeof validModels[number];

export function getDefaultModelName(): ModelName {
  const defaultModel = 'gpt-4o-mini';
  console.log('🔍 Starting model selection...');
  console.log('📁 Current working directory:', process.cwd());
  
  const envModel = process.env.DEFAULT_AI_MODEL;
  console.log('🔍 Model Selection Debug:', {
    defaultModel,
    envModel,
    processEnv: process.env.DEFAULT_AI_MODEL,
    isValid: envModel ? isValidModelName(envModel) : false,
    envKeys: Object.keys(process.env).filter(key => key.includes('AI') || key.includes('MODEL'))
  });
  
  if (!envModel) {
    console.log('⚠️ No environment model found, using default:', defaultModel);
    return defaultModel;
  }
  
  // Validate that the env value is a valid ModelName
  if (isValidModelName(envModel)) {
    console.log('✅ Environment model is valid:', envModel);
    return envModel as ModelName;
  }
  
  console.log('❌ Invalid model specified:', envModel);
  throw new Error(`Invalid model name in DEFAULT_AI_MODEL: ${envModel}. Valid models are: ${validModels.join(', ')}`);
}

// Type guard to validate model names
function isValidModelName(model: string): model is ModelName {
  return validModels.includes(model as ModelName);
}

export function DEFAULT_MODEL_NAME(): ModelName {
  return getDefaultModelName();
}

export function getModelByName(modelName?: ModelName): LanguageModelV1 {
  const model = modelName || DEFAULT_MODEL_NAME();
  console.log(`🤖 Using AI model: ${model}`);
  
  if (model.includes("claude")) {
    return anthropic(model)
  }
  if (model.includes("gpt")) {
    return openai(model)
  }
  if (model.includes("grok")) {
    return xai(model);
  }
  if (model.includes("gemini")) {
    return google("models/" + model, {
      //topK: 0,
      safetySettings: [
        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
      ],
    })
  }
  return anthropic(DEFAULT_MODEL_NAME()) // Default model
}

export function getModelByEnv(useSubModel = false): LanguageModelV1 {
  // Check for Ollama configuration first since it's a special case
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL
  const ollamaModel = process.env.OLLAMA_MODEL
  const ollamaSubModel = process.env.OLLAMA_SUB_MODEL

  if (ollamaBaseUrl && ollamaModel) {
    const ollama = createOllama({ baseURL: ollamaBaseUrl + "/api" })
    return ollama(useSubModel && ollamaSubModel ? ollamaSubModel : ollamaModel)
  }

  // Get the model name from environment variable or default
  const modelName = process.env.DEFAULT_AI_MODEL

  // If we have a valid model name, use it with getModelByName
  if (modelName && isValidModelName(modelName)) {
    return getModelByName(modelName)
  }

  // Otherwise, determine the model based on available API keys
  if (process.env.ANTHROPIC_API_KEY) {
    return getModelByName('claude-3-5-sonnet-20240620')
  }
  
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return getModelByName('gemini-1.5-pro-latest')
  }

  if (process.env.AZURE_API_KEY && process.env.AZURE_RESOURCE_NAME) {
    const azure = createAzure({
      apiKey: process.env.AZURE_API_KEY,
      resourceName: process.env.AZURE_RESOURCE_NAME,
    })
    return azure.chat(process.env.AZURE_DEPLOYMENT_NAME || 'gpt-4o')
  }

  if (process.env.GROQ_API_KEY) {
    const groq = createOpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    })
    return groq.chat(process.env.GROQ_API_MODEL || 'mixtral-8x7b-32768')
  }

  if (process.env.OPENAI_API_KEY) {
    const customOpenAI = process.env.OPENAI_API_BASE ? createOpenAI({
      baseURL: process.env.OPENAI_API_BASE,
      apiKey: process.env.OPENAI_API_KEY,
    }) : openai

    return customOpenAI.chat(process.env.OPENAI_API_MODEL || 'gpt-4o')
  }

  throw new Error(
    "No valid AI configuration found. Please set up at least one provider (OpenAI, Anthropic, Google, Azure, Groq, or Ollama)"
  )
}

