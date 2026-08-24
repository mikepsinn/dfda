/**
 * @jest-environment node
 */

import { CacheService } from '@/lib/services/cache-service';
import { getSerializableResult } from '@/lib/agents/researcher/getSearchResults';

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = CacheService.getInstance();
  });

  it('should store and retrieve simple values', async () => {
    const key = 'test:simple';
    const value = { message: 'hello world' };

    await cacheService.set(key, value);
    const retrieved = await cacheService.get<typeof value>(key);

    expect(retrieved).toEqual(value);
  });

  it('should store and retrieve complex nested objects', async () => {
    const key = 'test:complex';
    const value = {
      title: 'Test Article',
      url: 'https://example.com',
      text: 'Sample text content',
      highlights: {
        sentences: ['sentence 1', 'sentence 2'],
        urls: ['url1', 'url2']
      },
      publishedDate: '2024-01-01',
      author: 'Test Author',
      score: 0.95,
      metadata: {
        tags: ['test', 'cache'],
        views: 1000
      }
    };

    await cacheService.set(key, value);
    const retrieved = await cacheService.get<typeof value>(key);

    expect(retrieved).toEqual(value);
  });

  it('should handle arrays of objects', async () => {
    const key = 'test:array';
    const value = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ];

    await cacheService.set(key, value);
    const retrieved = await cacheService.get<typeof value>(key);

    expect(retrieved).toEqual(value);
  });

  it('should return null for non-existent keys', async () => {
    const key = 'test:nonexistent';
    const retrieved = await cacheService.get(key);

    expect(retrieved).toBeNull();
  });

  it('should handle special characters in keys', async () => {
    const key = 'test:special/chars?&=+';
    const value = { data: 'test' };

    await cacheService.set(key, value);
    const retrieved = await cacheService.get<typeof value>(key);

    expect(retrieved).toEqual(value);
  });

  it('should handle search result caching', async () => {
    const key = 'test:search-results';
    const mockSearchResult = {
      title: 'Test Article',
      url: 'https://example.com',
      text: 'Sample text content',
      highlights: {
        sentences: ['relevant sentence 1', 'relevant sentence 2'],
        urls: ['url1', 'url2']
      },
      publishedDate: '2024-01-01',
      author: 'Test Author',
      score: 0.95,
      // Add some non-serializable properties that should be excluded
      someFunction: () => console.log('test'),
      circularRef: {},
    };
    // Create circular reference
    mockSearchResult.circularRef = { parent: mockSearchResult };

    // Get serializable version
    const serializableResult = getSerializableResult(mockSearchResult as any);
    
    // Store in cache
    await cacheService.set(key, serializableResult);
    
    // Retrieve from cache
    const retrieved = await cacheService.get(key);

    // Verify only serializable properties are present
    expect(retrieved).toHaveProperty('title');
    expect(retrieved).toHaveProperty('url');
    expect(retrieved).toHaveProperty('text');
    expect(retrieved).toHaveProperty('highlights');
    expect(retrieved).toHaveProperty('publishedDate');
    expect(retrieved).toHaveProperty('author');
    expect(retrieved).toHaveProperty('score');
    
    // Verify non-serializable properties are excluded
    expect(retrieved).not.toHaveProperty('someFunction');
    expect(retrieved).not.toHaveProperty('circularRef');

    // Verify the content matches
    expect(retrieved).toEqual(serializableResult);
  });

  // Clean up test keys after all tests
  afterAll(async () => {
    await cacheService.cleanup();
  });
}); 