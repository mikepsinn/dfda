/**
 * @jest-environment node
 */

import { scanLinks } from '../../src/core/scanner';
import { LinkInfo } from '../../src/core/types';
import path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';

// Mock external dependencies
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  promises: {
    access: jest.fn()
  }
}));

jest.mock('glob', () => ({
  glob: {
    sync: jest.fn()
  }
}));

// Mock network requests
jest.mock('node-fetch', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve({
    status: 200,
    ok: true
  }))
}));

describe('scanLinks', () => {
  const testDir = path.join(__dirname, '../fixtures');
  const mockFiles: Record<string, string> = {
    'test.md': `# Test\n[Link](https://example.com)`,
    'test.tsx': `<a href="https://test.com">Test</a>`
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock file system
    (fs.readFileSync as jest.Mock).mockImplementation((file) => {
      const basename = path.basename(file);
      return mockFiles[basename] || '';
    });

    // Mock glob
    (glob as any).glob.sync.mockReturnValue(
      Object.keys(mockFiles).map(file => path.join(testDir, file))
    );
  });

  it('should find links in markdown files', async () => {
    const results = await scanLinks(testDir);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].url).toBe('https://example.com');
  });

  it('should respect exclude patterns', async () => {
    const results = await scanLinks(testDir, {
      excludePatterns: ['**/excluded/**']
    });
    expect(results.every(r => !r.location.filePath.includes('excluded'))).toBe(true);
  });

  it('should validate live links when enabled', async () => {
    const results = await scanLinks(testDir, {
      checkLiveLinks: true
    });
    expect(results.some(r => r.isValid !== undefined)).toBe(true);
  });

  it('should group results by file type', async () => {
    const results = await scanLinks(testDir);
    const byFileType = results.reduce<Record<string, LinkInfo[]>>((acc, result) => {
      const ext = path.extname(result.location.filePath);
      acc[ext] = acc[ext] || [];
      acc[ext].push(result);
      return acc;
    }, {});

    expect(Object.keys(byFileType).length).toBeGreaterThan(0);
  });

  it('should report valid and invalid links', async () => {
    const results = await scanLinks(testDir, { 
      checkLiveLinks: true
    });
    const validCount = results.filter((r: LinkInfo) => r.isValid).length;
    const invalidCount = results.filter((r: LinkInfo) => !r.isValid).length;

    expect(validCount + invalidCount).toBe(results.length);
  });

  it('should provide error messages for invalid links', async () => {
    // Mock a failed request
    const fetch = require('node-fetch').default;
    fetch.mockImplementationOnce(() => Promise.resolve({
      status: 404,
      ok: false
    }));
    
    const results = await scanLinks(testDir, { checkLiveLinks: true });
    
    results
      .filter((r: LinkInfo) => !r.isValid)
      .forEach((r: LinkInfo) => {
        expect(r.error).toBeDefined();
        expect(typeof r.error).toBe('string');
      });
  });
});
