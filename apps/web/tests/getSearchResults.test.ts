/**
 * @jest-environment node
 */

import { getSearchResults, getSearchResultsByDomain, getSearchResultsByUrl } from '@/lib/agents/researcher/getSearchResults';
import { CacheService } from '@/lib/services/cache-service';

// Mock the Exa API
const mockSearchAndContents = jest.fn();
const mockGetContents = jest.fn();

jest.mock('exa-js', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      searchAndContents: mockSearchAndContents.mockResolvedValue({
        results: [
          {
            title: 'Test Article 1',
            url: 'https://example.com/1',
            text: 'Sample content 1',
            highlights: { sentences: ['highlight 1'], urls: ['url1'] },
            publishedDate: '2024-01-01',
            author: 'Author 1',
            score: 0.9
          },
          {
            title: 'Test Article 2',
            url: 'https://example.com/2',
            text: 'Sample content 2',
            highlights: { sentences: ['highlight 2'], urls: ['url2'] },
            publishedDate: '2024-01-02',
            author: 'Author 2',
            score: 0.8
          }
        ]
      }),
      getContents: mockGetContents.mockImplementation((urls) => {
        if (urls[0] === 'invalid-url') {
          return Promise.resolve({ results: [] });
        }
        return Promise.resolve({
          results: [
            {
              title: 'Test URL Content',
              url: urls[0],
              text: 'Sample URL content',
              highlights: { sentences: ['url highlight'], urls: ['url-test'] },
              publishedDate: '2024-01-03',
              author: 'Author 3',
              score: 0.95
            }
          ]
        });
      })
    }))
  };
});

describe('Search Results', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = CacheService.getInstance();
    // Clear cache before each test
    return cacheService.cleanup();
  });

  describe('getSearchResults', () => {
    it('should fetch and cache search results', async () => {
      const queries = ['test query'];
      const options = { numResults: 2, useAutoprompt: true };

      // First call - should fetch from API and cache
      const results1 = await getSearchResults(queries, options);
      expect(results1).toHaveLength(2);
      expect(results1[0]).toHaveProperty('title', 'Test Article 1');
      expect(results1[1]).toHaveProperty('title', 'Test Article 2');

      // Second call - should retrieve from cache
      const results2 = await getSearchResults(queries, options);
      expect(results2).toHaveLength(2);
      expect(results2).toEqual(results1);
    });

    it('should handle multiple queries', async () => {
      const queries = ['query1', 'query2'];
      const results = await getSearchResults(queries);
      expect(results).toHaveLength(4); // 2 results per query
    });

    it('should handle API errors gracefully', async () => {
      mockSearchAndContents.mockRejectedValueOnce(new Error('API error'));
      const results = await getSearchResults(['error query']);
      expect(results).toEqual([]);
    });
  });

  describe('getSearchResultsByDomain', () => {
    it('should fetch and cache domain-specific results', async () => {
      const domain = 'example.com';
      const queries = ['domain test'];
      const options = { numResults: 2 };

      // First call - should fetch from API and cache
      const results1 = await getSearchResultsByDomain(domain, queries, options);
      expect(results1).toHaveLength(2);
      expect(results1[0].url).toContain('example.com');

      // Second call - should retrieve from cache
      const results2 = await getSearchResultsByDomain(domain, queries, options);
      expect(results2).toHaveLength(2);
      expect(results2).toEqual(results1);
    });

    it('should handle API errors gracefully', async () => {
      mockSearchAndContents.mockRejectedValueOnce(new Error('API error'));
      const results = await getSearchResultsByDomain('example.com', ['error query']);
      expect(results).toEqual([]);
    });
  });

  describe('getSearchResultsByUrl', () => {
    it('should fetch and cache URL-specific results', async () => {
      const url = 'https://example.com/test';

      // First call - should fetch from API and cache
      const results1 = await getSearchResultsByUrl(url);
      expect(results1).toHaveLength(1);
      expect(results1[0].url).toBe(url);

      // Second call - should retrieve from cache
      const results2 = await getSearchResultsByUrl(url);
      expect(results2).toHaveLength(1);
      expect(results2).toEqual(results1);
    });

    it('should handle invalid URLs', async () => {
      const url = 'invalid-url';
      const results = await getSearchResultsByUrl(url);
      expect(results).toEqual([]);
    });

    it('should handle API errors gracefully', async () => {
      mockGetContents.mockRejectedValueOnce(new Error('API error'));
      const results = await getSearchResultsByUrl('error-url');
      expect(results).toEqual([]);
    });
  });

  // Clean up after all tests
  afterAll(async () => {
    await cacheService.cleanup();
  });
}); 