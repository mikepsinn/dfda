/**
 * @jest-environment node
 */
import { beforeAll, describe, expect, it, jest, beforeEach } from '@jest/globals';
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

  beforeEach(() => {
    jest.setTimeout(120000); // 2 minutes per test
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

    expect(report.title).toMatch(/^[\w\s\-:,]+$/);
    expect(report.content.length).toBeGreaterThan(500);
    expect(report.sources.length).toBeGreaterThan(0);
    expect(report.sources[0]).toHaveProperty('url');
    expect(report.sources[0]).toHaveProperty('title');
    expect(report.tags).toHaveLength(expect.any(Number));
    expect(report.tags[0]).toMatch(/^[\w\s\-]+$/);
    expect(report.searchResults.length).toBeLessThanOrEqual(10);
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

    expect(report.title.toLowerCase()).toContain('ido1');
    expect(report.content.length).toBeGreaterThan(500);
    expect(report.content.toLowerCase()).toContain('depression');
    expect(report.sources).toSatisfyAll(source => {
      return (
        typeof source.url === 'string' &&
        typeof source.title === 'string' &&
        source.url.startsWith('http')
      );
    });
    expect(report.tags).toContain(expect.stringMatching(/depression|ido1/i));
    expect(report.searchResults.length).toBeLessThanOrEqual(10);
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

  it("Handles invalid URLs gracefully", async () => {
    const invalidUrl = "https://invalid-url-that-doesnt-exist.com/article";
    
    await expect(researcher.research(invalidUrl, {
      numberOfSearchQueryVariations: 1,
      numberOfWebResultsToInclude: 5,
      format: "article",
    })).rejects.toThrow();
  });

});
