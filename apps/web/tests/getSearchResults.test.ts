/**
 * @jest-environment node
 */

import { getSearchResults, getSearchResultsByDomain, getSearchResultsByUrl } from '@/lib/agents/researcher/getSearchResults';
import { CacheService } from '@/lib/services/cache-service';

describe('Search Results', () => {
  let cacheService: CacheService;

  beforeEach(async () => {
    cacheService = CacheService.getInstance();
    await cacheService.cleanup();
  });

  describe('getSearchResults', () => {
    it('should fetch and cache search results', async () => {
      const queries = ['What is the average cost to develop a new pharmaceutical drug?'];
      const options = { numResults: 5, useAutoprompt: true };

      // First call - should fetch from API and cache
      const results1 = await getSearchResults(queries, options);
      expect(results1.length).toBeGreaterThan(0);
      expect(results1[0]).toHaveProperty('title');
      expect(results1[0]).toHaveProperty('url');
      expect(results1[0]).toHaveProperty('text');

      // Second call - should retrieve from cache
      const results2 = await getSearchResults(queries, options);
      expect(results2).toEqual(results1);
    }, 30000);
  });

  describe('getSearchResultsByDomain', () => {
    it('should fetch and cache domain-specific results', async () => {
      const domain = 'fda.gov';
      const queries = ['drug approval process'];
      const options = { numResults: 5 };

      // First call - should fetch from API and cache
      const results1 = await getSearchResultsByDomain(domain, queries, options);
      expect(results1.length).toBeGreaterThan(0);
      expect(results1[0].url).toContain(domain);

      // Second call - should retrieve from cache
      const results2 = await getSearchResultsByDomain(domain, queries, options);
      expect(results2).toEqual(results1);
    }, 30000);
  });

  describe('getSearchResultsByUrl', () => {
    it('should fetch and cache URL-specific results', async () => {
      const url = 'https://www.fda.gov/drugs/development-approval-process-drugs';

      // First call - should fetch from API and cache
      const results1 = await getSearchResultsByUrl(url);
      expect(results1.length).toBeGreaterThan(0);
      expect(results1[0].url).toBe(url);

      // Second call - should retrieve from cache
      const results2 = await getSearchResultsByUrl(url);
      expect(results2).toEqual(results1);
    }, 30000);
  });

  // Clean up after all tests
  afterAll(async () => {
    if (cacheService) {
      await cacheService.cleanup();
    }
  });
}); 