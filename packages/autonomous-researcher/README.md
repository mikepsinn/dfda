# Autonomous Researcher

A powerful autonomous research agent that can search, analyze, and synthesize information from the web into comprehensive reports.

## Features

- Autonomous web research using Exa Search API
- Multi-query generation for comprehensive coverage
- Support for various AI models (GPT-4, Claude, Gemini, etc.)
- Progress tracking through events
- Customizable research parameters
- Cost tracking and estimation
- Support for different citation styles
- Automatic image inclusion

## Installation

```bash
npm install @decentralized-fda/autonomous-researcher
```

## Usage

```typescript
import { AutonomousResearcher } from '@decentralized-fda/autonomous-researcher';

// Initialize the researcher with your Exa API key
const researcher = new AutonomousResearcher('your-exa-api-key');

// Listen for progress updates
researcher.events.on('research-progress', (step) => {
  console.log(`Progress: ${step.progress}% - ${step.step}`);
});

// Start research
const report = await researcher.research('Your research topic', {
  numberOfSearchQueryVariations: 3,
  numberOfWebResultsToInclude: 10,
  format: 'article',
  audience: 'general',
  languageLevel: 'intermediate',
  citationStyle: 'hyperlinked-text'
});

console.log(report);
```

## Configuration Options

The research method accepts various options to customize the research process:

```typescript
type ResearchOptions = {
  numberOfSearchQueryVariations?: number;    // Number of different search queries to generate
  numberOfWebResultsToInclude?: number;      // Number of web results to include
  audience?: string;                         // Target audience
  purpose?: string;                          // Research purpose
  maxCharactersOfSearchContentToUse?: number;// Max characters to use from each source
  tone?: string;                            // Writing tone
  format?: "article" | "bullet-points" | "Q&A"; // Output format
  wordLimit?: number;                        // Word limit for the report
  includeSummary?: boolean;                  // Include a summary
  languageLevel?: "beginner" | "intermediate" | "advanced" | "expert";
  citationStyle?: "footnote" | "hyperlinked-text" | "endnotes";
  modelName?: string;                        // AI model to use
  temperature?: number;                      // Model temperature
  topP?: number;                            // Model top_p
  maxTokens?: number;                        // Max tokens
  presencePenalty?: number;                  // Model presence penalty
  frequencyPenalty?: number;                 // Model frequency penalty
  searchStrategy?: "broad" | "focused" | "recent"; // Search strategy
  dateRangeStart?: Date;                     // Start date for results
  dateRangeEnd?: Date;                       // End date for results
  minSourceRank?: number;                    // Minimum source rank
  categoryName?: string;                     // Category for the report
};
```

## Events

The researcher emits progress events that you can listen to:

```typescript
researcher.events.on('research-progress', (step: ResearchStep) => {
  console.log(`${step.step}: ${step.progress}%`);
});
```

## Output

The research method returns a ResearchReport object containing:

```typescript
type ResearchReport = {
  title: string;              // Generated title
  description: string;        // Brief description
  content: string;           // Main content in markdown
  sources: Source[];         // Used sources
  tags: string[];           // Generated tags
  categoryName: string;      // Report category
  featuredImageUrl?: string; // Featured image URL
  searchResults: SearchResult[]; // Raw search results
  generationOptions?: ResearchOptions; // Used options
};
```

## Requirements

- Node.js 16+
- Exa Search API key
- One of the supported AI model providers (OpenAI, Anthropic, Google, etc.)

## License

MIT 