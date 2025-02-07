import { LanguageModelV1 } from "@ai-sdk/provider";
import { generateObject, GenerateObjectResult } from "ai";
import { RegularSearchOptions, SearchResult } from "exa-js";
import { z } from "zod";
import { EventEmitter } from 'events';
import { getSearchResults, getSearchResultsByUrl } from "./utils/getSearchResults";
import { generateSearchQueries } from "./utils/searchQueryGenerator";
import { DEFAULT_MODEL_NAME, getModelByName, ModelName, MODEL_PRICING } from "./utils/modelUtils";
import { DefaultContentsOptions, ResearchOptions, ResearchReport, ResearchStep } from "./types";

const GeneratedReportSchema = z.object({
  title: z.string().describe("The title of the report"),
  description: z.string().describe("A brief description or summary of the report"),
  content: z.string().describe(
    "The main content of the report in markdown format. DO NOT include the title. Use the provided highlights as relevant quotes in the content."
  ),
  sources: z.array(
    z.object({
      url: z.string(),
      title: z.string(),
      description: z.string(),
      relevantQuotes: z.array(z.string()).optional().describe("Key quotes from this source"),
      imageUrls: z.array(z.string()).optional().describe("Relevant images from this source")
    })
  ).describe("An array of sources used in the report"),
  tags: z.array(z.string()).describe("Relevant tags for the report"),
  categoryName: z.string().describe("The main category of the report"),
  featuredImageUrl: z.string().optional().describe("URL of the most relevant image to use as featured image")
});

type GeneratedReport = z.infer<typeof GeneratedReportSchema>;

export class AutonomousResearcher {
  private model: LanguageModelV1;
  private exaApiKey: string;
  public events: EventEmitter;

  constructor(exaApiKey: string, modelName: ModelName = DEFAULT_MODEL_NAME) {
    this.exaApiKey = exaApiKey;
    this.model = getModelByName(modelName);
    this.events = new EventEmitter();
  }

  private emitProgress(step: ResearchStep) {
    this.events.emit('research-progress', step);
  }

  private async getSearchResultsByTopic(
    topic: string,
    numberOfSearchQueryVariations: number,
    numberOfWebResultsToInclude: number,
    options?: RegularSearchOptions
  ): Promise<SearchResult<DefaultContentsOptions>[]> {
    const searchQueries = await generateSearchQueries(topic, numberOfSearchQueryVariations);
    
    console.log(`🔍 Search Generation:
• Topic: "${topic}"
• Queries Generated: ${searchQueries.length}
• Queries: ${searchQueries.join(' | ')}`);

    if (!options) {
      options = {};
    }
    options.numResults = numberOfWebResultsToInclude;

    const searchResults = await getSearchResults(searchQueries, options, this.exaApiKey);

    console.log(`📊 Search Results:
• Results Found: ${searchResults.length}
• Top Sources: ${searchResults.slice(0,3).map(r => r.url).join('\n  ')}`);

    return searchResults;
  }

  private isUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch (e) {
      return false;
    }
  }

  public async research(topic: string, options: ResearchOptions = {}): Promise<ResearchReport> {
    const startTime = Date.now();

    this.emitProgress({
      step: 'Initializing research process',
      progress: 0
    });

    const {
      numberOfSearchQueryVariations = 1,
      numberOfWebResultsToInclude = 10,
      audience = "general",
      purpose = "inform",
      maxCharactersOfSearchContentToUse = 999999,
      tone = "neutral",
      format = "article",
      wordLimit,
      includeSummary = false,
      languageLevel = "intermediate",
      citationStyle = "hyperlinked-text",
      temperature,
      topP,
      maxTokens,
      presencePenalty,
      frequencyPenalty,
      searchStrategy,
      dateRangeStart,
      dateRangeEnd,
      minSourceRank,
    } = options;

    console.log(`🚀 Starting Research:
• Topic: "${topic}"
• Model: ${this.model}
• Format: ${format}
• Sources: ${numberOfWebResultsToInclude}`);

    this.emitProgress({
      step: 'Gathering information from reliable sources',
      progress: 20
    });

    let searchResults: SearchResult<DefaultContentsOptions>[];
    if (this.isUrl(topic)) {
      searchResults = await getSearchResultsByUrl(topic, numberOfWebResultsToInclude, this.exaApiKey);
    } else {
      searchResults = await this.getSearchResultsByTopic(
        topic,
        numberOfSearchQueryVariations,
        numberOfWebResultsToInclude
      );
    }

    console.log("Synthesizing report...");

    this.emitProgress({
      step: 'Analyzing and synthesizing information',
      progress: 40
    });

    let inputData = searchResults
      .map(
        (item: SearchResult<DefaultContentsOptions>) => `--START ITEM: ${item.title}--\n
      TITLE: ${item.title}\n
      URL: ${item.url}\n
      CONTENT: ${item.text.slice(0, maxCharactersOfSearchContentToUse)}\n
      RELEVANT QUOTES:
      ${(item as any).highlights?.map((quote: string, i: number) => 
          `${i + 1}. "${quote}" (Score: ${(item as any).highlightScores?.[i] || 'N/A'})`
      ).join('\n    ') || 'No relevant quotes found'}\n
      IMAGES:
      ${(item as any).extras?.imageLinks?.map((url: string, i: number) => 
          `${i + 1}. ${url}`
      ).join('\n    ') || 'No images found'}\n
      --END ITEM: ${item.title}--\n`
      )
      .join("");

    // strip numerical footnote brackets from the text like [1] or [12], etc
    inputData = inputData.replace(/\[\d+]/g, "");

    let citationInstructions = "";
    if (citationStyle === "footnote") {
      citationInstructions =
        "Provide citations in the text using markdown footnote notation like [^1].";
    } else if (citationStyle === "hyperlinked-text") {
      citationInstructions = `'YOU MUST HYPERLINK THE RELEVANT text in the report to the source 
      URLs used using markdown hyperlink notation 
      like [text](https://link-where-you-got-the-information).';`;
    }

    const prompt = `
      Write an extremely information-dense and comprehensive ${format} on the topic of "${topic}" based on the Web Search Results below.
      
      # Guidelines
      
      Avoid fluff and filler content. Focus on providing the most relevant and useful information.
      DO NOT include the title in the content.
      Be as quantitative and data-driven as possible!  
      Use tables as much as appropriate.
      If the topic is a question with a quantitative answer, please answer in the first sentence.
      Separate sections with headings.
      
      IMPORTANT: Use the provided relevant quotes (highlights) from sources to support key points.
      Include relevant images where they add value to the content.
      
      Audience: ${audience}
      Purpose: ${purpose}
      Tone: ${tone}
      Language Level: ${languageLevel}
      Citation Style: ${citationInstructions}
      ${wordLimit ? `Word Limit: ${wordLimit} words` : ""}
      ${includeSummary ? "Include a brief summary at the beginning." : ""}

      # Web Search Results
      Here is a list of web pages and excerpts from them that you can use to write the report.
      For each result, I'm providing the full text, relevant quotes (highlights), and any relevant images:
      ${inputData}
    `;

    this.emitProgress({
      step: 'Writing comprehensive analysis',
      progress: 60
    });

    const result = await generateObject<GeneratedReport>({
      model: this.model,
      schema: GeneratedReportSchema,
      prompt,
    });

    const report: ResearchReport = {
      ...result.object,
      searchResults,
      generationOptions: options
    };

    // Calculate token usage and costs
    const modelName = DEFAULT_MODEL_NAME;
    const pricing = MODEL_PRICING[modelName] || { input: 0, output: 0 };
    
    const tokenUsage = {
      completionTokens: result.usage?.completionTokens || 0,
      promptTokens: result.usage?.promptTokens || 0,
      totalTokens: result.usage?.totalTokens || 0
    };

    // Calculate cost in USD
    const estimatedCost = 
      (tokenUsage.promptTokens / 1000 * pricing.input) +
      (tokenUsage.completionTokens / 1000 * pricing.output);

    console.log(`✅ Research Complete:
• Title: "${report.title}"
• Category: ${report.categoryName}
• Tags: ${report.tags.join(', ')}
• Sources Used: ${report.sources.length}
• Time: ${((Date.now() - startTime) / 1000).toFixed(2)}s
• Tokens: ${tokenUsage.totalTokens.toLocaleString()}
• Cost: $${estimatedCost.toFixed(4)}`);

    this.emitProgress({
      step: 'Research complete',
      progress: 100
    });

    return report;
  }
} 