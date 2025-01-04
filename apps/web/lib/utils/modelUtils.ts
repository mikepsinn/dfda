import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import {createOpenAI, openai} from "@ai-sdk/openai";
import { LanguageModelV1 } from "@ai-sdk/provider";
import { xai } from '@ai-sdk/xai';
import {createOllama} from "ollama-ai-provider";
import {createAzure} from "@ai-sdk/azure";

function getDefaultModelName(): ModelName {
  const defaultModel = 'gpt-4o-mini';
  const envModel = process.env.DEFAULT_AI_MODEL;
  if (!envModel) return defaultModel;
  
  // Validate that the env value is a valid ModelName
  if (isValidModelName(envModel)) {
    return envModel as ModelName;
  }
  
  console.warn(`Invalid model name in DEFAULT_AI_MODEL: ${envModel}, falling back to ${defaultModel}`);
  return defaultModel;
}

// Type guard to validate model names
function isValidModelName(model: string): model is ModelName {
  const validModels = [
    'claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307', 'gpt-4o', 'gpt-4o-2024-05-13', 'gpt-4o-2024-08-06',
    'gpt-4o-mini', 'gpt-4o-mini-2024-07-18', 'gpt-4-turbo', 'gpt-4-turbo-2024-04-09',
    'gpt-4-turbo-preview', 'gpt-4-0125-preview', 'gpt-4-1106-preview', 'gpt-4',
    'gpt-4-0613', 'gpt-3.5-turbo-0125', 'gpt-3.5-turbo', 'gpt-3.5-turbo-1106',
    'gemini-1.5-flash-latest', 'gemini-1.5-flash', 'gemini-1.5-pro-latest',
    'gemini-1.5-pro', 'gemini-1.0-pro', 'grok-beta', 'grok-vision-beta'
  ] as const;
  
  return validModels.includes(model as ModelName);
}

export const DEFAULT_MODEL_NAME = getDefaultModelName();

export type ModelName = 'claude-3-5-sonnet-20240620' | 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307' |
    'gpt-4o' | 'gpt-4o-2024-05-13' | 'gpt-4o-2024-08-06' | 'gpt-4o-mini' | 'gpt-4o-mini-2024-07-18' | 'gpt-4-turbo' | 'gpt-4-turbo-2024-04-09' | 'gpt-4-turbo-preview' | 'gpt-4-0125-preview' | 'gpt-4-1106-preview' | 'gpt-4' | 'gpt-4-0613' | 'gpt-3.5-turbo-0125' | 'gpt-3.5-turbo' | 'gpt-3.5-turbo-1106' |
    'gemini-1.5-flash-latest' | 'gemini-1.5-flash' | 'gemini-1.5-pro-latest' | 'gemini-1.5-pro' | 'gemini-1.0-pro'
    | 'grok-beta' | 'grok-vision-beta';


export function getModelByName(modelName: ModelName = DEFAULT_MODEL_NAME): LanguageModelV1 {
  console.log(`🤖 Using AI model: ${modelName}`);
  
  if (modelName.includes("claude")) {
    return anthropic(modelName)
  }
  if (modelName.includes("gpt")) {
    return openai(modelName)
  }
  if (modelName.includes("grok")) {
    return xai(modelName);
  }
  if (modelName.includes("gemini")) {
    return google("models/" + modelName, {
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
  return anthropic(DEFAULT_MODEL_NAME) // Default model
}

export function getModelByEnv(useSubModel = false) {
  const ollamaBaseUrl = process.env.OLLAMA_BASE_URL + "/api"
  const ollamaModel = process.env.OLLAMA_MODEL
  const ollamaSubModel = process.env.OLLAMA_SUB_MODEL

  const openaiApiBase = process.env.OPENAI_API_BASE
  const openaiApiKey = process.env.OPENAI_API_KEY
  const openaiApiModel = process.env.OPENAI_API_MODEL || "gpt-4o"
  const azureResourceName = process.env.AZURE_RESOURCE_NAME
  const azureApiKey = process.env.AZURE_API_KEY
  const azureDeploymentName = process.env.AZURE_DEPLOYMENT_NAME || "gpt-4o"
  const googleApiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  const groqApiKey = process.env.GROQ_API_KEY
  const groqApiModel = process.env.GROQ_API_MODEL

  if (
      !(ollamaBaseUrl && ollamaModel) &&
      !openaiApiKey &&
      !googleApiKey &&
      !anthropicApiKey &&
      !(azureApiKey && azureResourceName)
  ) {
    throw new Error(
        "Missing environment variables for Ollama, OpenAI, Azure OpenAI, Google or Anthropic"
    )
  }
  // Ollama
  if (ollamaBaseUrl && ollamaModel) {
    const ollama = createOllama({ baseURL: ollamaBaseUrl })

    if (useSubModel && ollamaSubModel) {
      return ollama(ollamaSubModel)
    }

    return ollama(ollamaModel)
  }

  if (googleApiKey) {
    return google("gemini-1.5-pro-002")
  }

  if (anthropicApiKey) {
    return anthropic("claude-3-5-sonnet-20240620")
  }

  if (azureApiKey && azureResourceName) {
    const azure = createAzure({
      apiKey: azureApiKey,
      resourceName: azureResourceName,
    })

    return azure.chat(azureDeploymentName)
  }

  if (groqApiKey && groqApiModel) {
    const groq = createOpenAI({
      apiKey: groqApiKey,
      baseURL: "https://api.groq.com/openai/v1",
    })

    return groq.chat(groqApiModel)
  }

  // Fallback to OpenAI instead
  const openai = createOpenAI({
    baseURL: openaiApiBase, // optional base URL for proxies etc.
    apiKey: openaiApiKey, // optional API key, default to env property OPENAI_API_KEY
    organization: "", // optional organization
  })

  return openai.chat(openaiApiModel)
}

