import { LanguageModelV1 } from "@ai-sdk/provider";
import { SearchResult } from "exa-js";
import { getSearchResultsByTopic } from "@/lib/agents/researcher/researcher";
import { getModelByName, ModelName, DEFAULT_MODEL_NAME } from "@/lib/utils/modelUtils";
import { z } from "zod";
import { generateObject } from "ai";

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

    // Gather search results
    const searchResults: SearchResult[] = [];
    for (const query of searchQueries) {
      const results = await getSearchResultsByTopic(
        query,
        1,
        Math.ceil(this.options.numberOfSearchResults / searchQueries.length)
      );
      searchResults.push(...results);
    }

    return this.extractParameterEstimate(parameterName, context, searchResults);
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

    // Generate search queries using the model
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

    const prompt = `
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
      
      Sources to analyze:
      ${inputData}
    `;

    const result = await generateObject({
      model: this.model,
      schema: ParameterEstimateSchema,
      prompt,
    });

    return result.object as ParameterEstimate;
  }

  async validateEstimate(
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
    // Query for typical ranges
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