import { SearchResult, TextContentsOptions } from "exa-js";

export type DefaultContentsOptions = {
  text: TextContentsOptions;
};

export type Source = {
  url: string;
  title: string;
  description: string;
  relevantQuotes?: string[];
  imageUrls?: string[];
};

export type ResearchStep = {
  step: string;
  progress: number;
};

export type ResearchOptions = {
  numberOfSearchQueryVariations?: number;
  numberOfWebResultsToInclude?: number;
  audience?: string;
  purpose?: string;
  maxCharactersOfSearchContentToUse?: number;
  tone?: string;
  format?: "article" | "bullet-points" | "Q&A";
  wordLimit?: number;
  includeSummary?: boolean;
  languageLevel?: "beginner" | "intermediate" | "advanced" | "expert";
  citationStyle?: "footnote" | "hyperlinked-text" | "endnotes";
  modelName?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  presencePenalty?: number;
  frequencyPenalty?: number;
  searchStrategy?: "broad" | "focused" | "recent";
  dateRangeStart?: Date;
  dateRangeEnd?: Date;
  minSourceRank?: number;
  categoryName?: string;
};

export type ResearchReport = {
  title: string;
  description: string;
  content: string;
  sources: Source[];
  tags: string[];
  categoryName: string;
  featuredImageUrl?: string;
  searchResults: SearchResult<DefaultContentsOptions>[];
  generationOptions?: ResearchOptions;
}; 