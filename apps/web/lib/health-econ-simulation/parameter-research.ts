import { LanguageModelV1 } from "@ai-sdk/provider";
import { SearchResult } from "exa-js";
import { getSearchResultsByTopic } from "@/lib/agents/researcher/researcher";
import { getModelByName, ModelName, DEFAULT_MODEL_NAME } from "@/lib/utils/modelUtils";
import { z } from "zod";
import { generateObject } from "ai";

// Constants for context management
const MAX_CHARS_PER_SOURCE = 1000; // Limit each source to 1000 characters
const MAX_SOURCES_PER_QUERY = 5; // Limit number of sources per parameter
const MAX_PROMPT_LENGTH = 32000; // Conservative limit for prompt length

export interface ResearchOptions {
  modelName?: ModelName;
  numberOfSearchResults?: number;
  minConfidence?: number;
  requireSource?: boolean;
}

export const ParameterEstimateSchema = z.object({
  value: z.number().describe("Estimated value of the parameter"),
  unit: z.string().describe("Unit of measurement"),
  confidence: z.number().describe("Confidence in the estimate (0-1)"),
  methodology: z.string().describe("How the estimate was derived"),
  sources: z.array(z.string()).describe("Sources used for the estimate"),
  assumptions: z.array(z.string()).describe("Key assumptions made"),
  limitations: z.array(z.string()).describe("Known limitations of the estimate"),
}).describe("Structured parameter estimate with metadata");

export type ParameterEstimate = z.infer<typeof ParameterEstimateSchema>;

export class ParameterResearchEngine {
  private model: LanguageModelV1;
  private options: Required<ResearchOptions>;

  constructor(options: ResearchOptions = {}) {
    this.options = {
      modelName: DEFAULT_MODEL_NAME,
      numberOfSearchResults: 20,
      minConfidence: 0.7,
      requireSource: true,
      ...options,
    };
    this.model = getModelByName(this.options.modelName);
  }

  async researchParameter(
    parameterName: string,
    context: string,
    searchQueries?: string[]
  ): Promise<ParameterEstimate> {
    // Generate search queries if not provided
    if (!searchQueries) {
      searchQueries = await this.generateSearchQueries(parameterName, context);
    }

    // Gather and process search results
    const searchResults = await this.gatherAndProcessSearchResults(
      searchQueries,
      parameterName
    );

    const estimate = await this.extractParameterEstimate(parameterName, context, searchResults);
    
    const isValid = await this.validateEstimate(estimate, parameterName);
    if (!isValid) {
      throw new Error(`Invalid parameter estimate for ${parameterName}: Failed validation checks`);
    }

    return estimate;
  }

  private async gatherAndProcessSearchResults(
    searchQueries: string[],
    parameterName: string
  ): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];
    
    for (const query of searchQueries) {
      const results = await getSearchResultsByTopic(
        query,
        1,
        Math.ceil(this.options.numberOfSearchResults / searchQueries.length)
      );
      
      // Process and filter results
      const processedResults = results
        .map(result => ({
          ...result,
          text: this.truncateText(result.text, MAX_CHARS_PER_SOURCE),
          relevanceScore: this.calculateRelevanceScore(result, parameterName)
        }))
        .filter(result => result.relevanceScore > 0.5); // Filter out low relevance results
      
      allResults.push(...processedResults);
    }

    // Sort by relevance and take top results
    return allResults
      .sort((a, b) => (b as any).relevanceScore - (a as any).relevanceScore)
      .slice(0, MAX_SOURCES_PER_QUERY);
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    
    // Try to truncate at sentence boundary
    const truncated = text.slice(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    if (lastPeriod > maxLength * 0.7) { // Only truncate at sentence if we keep at least 70% of content
      return truncated.slice(0, lastPeriod + 1);
    }
    return truncated;
  }

  private calculateRelevanceScore(result: SearchResult, parameterName: string): number {
    // Simple relevance scoring based on keyword presence and position
    const lowerText = result.text.toLowerCase();
    const lowerTitle = result.title?.toLowerCase() || '';
    const keywords = parameterName.toLowerCase().split(' ');
    
    let score = 0;
    
    // Title matches are more important
    keywords.forEach(keyword => {
      if (lowerTitle.includes(keyword)) score += 0.4;
      if (lowerText.includes(keyword)) score += 0.2;
    });

    // Bonus for numerical content
    if (/\d+(\.\d+)?%?/.test(result.text)) score += 0.2;
    
    // Bonus for academic/medical sources
    if (result.url?.includes('.edu') || result.url?.includes('.gov')) score += 0.2;
    
    return Math.min(score, 1); // Normalize to 0-1
  }

  private async extractParameterEstimate(
    parameterName: string,
    context: string,
    searchResults: SearchResult[]
  ): Promise<ParameterEstimate> {
    const inputData = searchResults
      .map(
        (item) => `
        SOURCE: ${item.url}
        TITLE: ${item.title}
        CONTENT: ${item.text}
        `
      )
      .join("\n");

    // Ensure prompt doesn't exceed length limits
    const basePrompt = `
      Extract or estimate the value of "${parameterName}" in the context of ${context}.
      
      Requirements:
      1. Provide a numerical estimate with units
      2. Assess confidence level (0-1)
      3. Explain methodology
      4. List key assumptions
      5. Note important limitations
      6. Cite specific sources used
      
      If exact values aren't available, derive reasonable estimates using:
      - Similar parameters from comparable contexts
      - Mathematical modeling from related variables
      - Expert opinions or consensus estimates
    `;

    const maxSourcesLength = MAX_PROMPT_LENGTH - basePrompt.length - 100; // Buffer for formatting
    const truncatedInputData = this.truncateText(inputData, maxSourcesLength);

    const prompt = `${basePrompt}\n\nSources to analyze:\n${truncatedInputData}`;

    const result = await generateObject({
      model: this.model,
      schema: ParameterEstimateSchema,
      prompt,
    });

    return result.object as ParameterEstimate;
  }

  private async generateSearchQueries(
    parameterName: string,
    context: string
  ): Promise<string[]> {
    const prompt = `
      Generate specific search queries to find quantitative data about "${parameterName}"
      in the context of ${context}.
      Focus on finding:
      1. Direct measurements or studies
      2. Economic impact data
      3. Population-level statistics
      4. Meta-analyses or systematic reviews
    `;

    const querySchema = z.object({
      queries: z.array(z.string()).describe(
        "List of specific search queries to find quantitative data. Each query should be focused and include relevant keywords."
      ),
    });

    const result = await generateObject({
      model: this.model,
      schema: querySchema,
      prompt,
    });

    return result.object.queries;
  }

  private async validateEstimate(
    estimate: ParameterEstimate,
    parameterName: string
  ): Promise<boolean> {
    // Check confidence threshold
    if (estimate.confidence < this.options.minConfidence) {
      return false;
    }

    // Check source requirement
    if (this.options.requireSource && (!estimate.sources || estimate.sources.length === 0)) {
      return false;
    }

    // Validate value is reasonable (not extreme outlier)
    const isOutlier = await this.checkForOutlier(estimate.value, parameterName);
    if (isOutlier) {
      return false;
    }

    return true;
  }

  private async checkForOutlier(
    value: number,
    parameterName: string
  ): Promise<boolean> {
    const rangeSchema = z.object({
      min: z.number().describe("Minimum reasonable value based on literature"),
      max: z.number().describe("Maximum reasonable value based on literature"),
    });

    const result = await generateObject({
      model: this.model,
      schema: rangeSchema,
      prompt: `What are the reasonable minimum and maximum values for "${parameterName}" based on scientific literature?`,
    });

    const range = result.object;
    return value < range.min || value > range.max;
  }
} 