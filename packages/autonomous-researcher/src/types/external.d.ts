declare module '@ai-sdk/provider' {
  export interface LanguageModelV1 {
    // Add basic type structure for the language model
    name: string;
    [key: string]: any;
  }
}

declare module 'ai' {
  import { z } from 'zod';

  export interface GenerateObjectResult<T = any> {
    object: T;
    usage?: {
      completionTokens?: number;
      promptTokens?: number;
      totalTokens?: number;
    };
  }

  export function generateObject<T = any>(options: {
    model: any;
    schema: z.ZodType<T>;
    prompt: string;
  }): Promise<GenerateObjectResult<T>>;
}

declare module 'exa-js' {
  export interface TextContentsOptions {
    maxCharacters?: number;
    includeHtmlTags?: boolean;
  }

  export interface RegularSearchOptions {
    numResults?: number;
    useAutoprompt?: boolean;
    [key: string]: any;
  }

  export interface SearchResult<T = any> {
    title: string;
    url: string;
    text: string;
    highlights?: string[];
    highlightScores?: number[];
    publishedDate?: Date;
    author?: string;
    score?: number;
    extras?: {
      imageLinks?: string[];
    };
  }

  export default class Exa {
    constructor(apiKey: string);
    searchAndContents(query: string, options?: any): Promise<{ results: SearchResult[] }>;
    getContents(urls: string[], options?: any): Promise<{ results: SearchResult[] }>;
  }
} 