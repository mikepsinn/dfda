/**
 * @jest-environment node
 */
import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { AutonomousResearcher } from '../researcher';

describe("Autonomous Researcher tests", () => {
  jest.setTimeout(600000); // 10 minutes timeout

  const exaApiKey = process.env.EXASEARCH_API_KEY || '';
  let researcher: AutonomousResearcher;

  beforeAll(() => {
    if (!exaApiKey) {
      throw new Error('EXASEARCH_API_KEY environment variable is required');
    }
    researcher = new AutonomousResearcher(exaApiKey);
  });

  it("Generates report by URL", async () => {
    const url = `https://www.thelancet.com/journals/laninf/article/PIIS1473-3099(23)00685-0/fulltext`;
    
    const report = await researcher.research(url, {
      numberOfSearchQueryVariations: 1,
      numberOfWebResultsToInclude: 10,
      audience: "researchers",
      purpose: "research",
      maxCharactersOfSearchContentToUse: 5000,
      tone: "neutral",
      format: "article",
    });

    expect(report).toBeDefined();
    expect(report.title).toBeDefined();
    expect(report.content).toBeDefined();
    expect(report.sources).toBeInstanceOf(Array);
    expect(report.tags).toBeInstanceOf(Array);
    expect(report.searchResults).toBeInstanceOf(Array);
  });

  it("Generates report by topic", async () => {
    const topic = `IDO1 inhibitors for depression`;
    
    const report = await researcher.research(topic, {
      numberOfSearchQueryVariations: 1,
      numberOfWebResultsToInclude: 10,
      audience: "researchers",
      purpose: "research",
      maxCharactersOfSearchContentToUse: 5000,
      tone: "neutral",
      format: "article",
    });

    expect(report).toBeDefined();
    expect(report.title).toBeDefined();
    expect(report.content).toBeDefined();
    expect(report.sources).toBeInstanceOf(Array);
    expect(report.tags).toBeInstanceOf(Array);
    expect(report.searchResults).toBeInstanceOf(Array);
  });

  it("Emits progress events", async () => {
    const topic = "Brief history of aspirin";
    const progressEvents: string[] = [];

    researcher.events.on('research-progress', (step) => {
      progressEvents.push(step.step);
    });

    await researcher.research(topic, {
      numberOfSearchQueryVariations: 1,
      numberOfWebResultsToInclude: 5,
      format: "article",
    });

    expect(progressEvents).toContain('Initializing research process');
    expect(progressEvents).toContain('Gathering information from reliable sources');
    expect(progressEvents).toContain('Analyzing and synthesizing information');
    expect(progressEvents).toContain('Writing comprehensive analysis');
    expect(progressEvents).toContain('Research complete');
  });
}); 