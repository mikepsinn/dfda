/**
 * @jest-environment node
 */

import { scanLinks } from '../../src/core/scanner';
import { loadSkipConfig, saveSkipConfig, updateSkipConfig } from '../../src/core/skip-config';
import type { LinkInfo, SkipConfig } from '../../src/core/types';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('Configuration', () => {
  let testDir: string;
  let skipConfigPath: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'link-checker-test-'));
    skipConfigPath = path.join(testDir, 'link-checker-skip.json');
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  describe('Basic Configuration', () => {
    it('scans files with default configuration', async () => {
      const filePath = path.join(testDir, 'test.md');
      const content = '[Test Link](https://example.com)';
      fs.writeFileSync(filePath, content);

      const links = await scanLinks([filePath]);
      expect(links).toHaveLength(1);
      expect(links[0].url).toBe('https://example.com');
    });

    it('scans files with exclude patterns', async () => {
      const mdFilePath = path.join(testDir, 'test.md');
      const mdContent = '[Test Link](https://example.com)';
      fs.writeFileSync(mdFilePath, mdContent);

      const jsxFilePath = path.join(testDir, 'test.jsx');
      const jsxContent = '<Link href="/about">About</Link>';
      fs.writeFileSync(jsxFilePath, jsxContent);

      const results = await scanLinks(testDir, { exclude: ['*.md'] });
      expect(results).toHaveLength(1);
      expect(results[0].url).toBe('/about');
    });
  });

  describe('Skip Configuration', () => {
    it('should create and load skip configuration', async () => {
      const config: SkipConfig = {
        skippedLinks: [{
          url: 'https://example.com',
          statusCode: 404,
          location: { filePath: 'test.md', lineNumber: 1, columnNumber: 1 },
          lastChecked: Date.now()
        }]
      };

      await saveSkipConfig(config, { configPath: skipConfigPath });
      const loadedConfig = await loadSkipConfig({ configPath: skipConfigPath });
      expect(loadedConfig).toEqual(config);
    });

    it('should update skip configuration', async () => {
      const initialConfig: SkipConfig = {
        skippedLinks: [],
      };

      await saveSkipConfig(initialConfig, { configPath: skipConfigPath });

      const linkToSkip: LinkInfo = {
        url: 'https://example.com',
        location: { filePath: 'test.md', lineNumber: 1, columnNumber: 1 }
      };

      await updateSkipConfig([linkToSkip], { configPath: skipConfigPath });
      const updatedConfig = await loadSkipConfig({ configPath: skipConfigPath });
      expect(updatedConfig.skippedLinks).toHaveLength(1);
      expect(updatedConfig.skippedLinks[0].url).toBe(linkToSkip.url);
    });
  });

  const mockFiles = [
    path.join(process.cwd(), 'test1.md'),
    path.join(process.cwd(), 'test2.md')
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    const fg = require('fast-glob');
    fg.mockResolvedValue(mockFiles);
  });

  it('should respect custom cwd option', async () => {
    const fs = require('fs');
    fs.readFileSync.mockReturnValue('# Test\n[Link](https://example.com)');

    const customCwd = '/custom/path';
    const result = await scanLinks('**/*.md', { cwd: customCwd });
    const allLinks = [...result.valid, ...result.invalid];
    
    expect(allLinks.length).toBe(2);
    expect(allLinks[0]).toEqual({
      url: 'https://example.com',
      filePath: 'test1.md',
      lineNumber: 1
    });
  });

  it('should respect exclude patterns', async () => {
    const fs = require('fs');
    fs.readFileSync.mockReturnValue('# Test\n[Link](https://example.com)');

    const result = await scanLinks('**/*.md', { exclude: ['test2.md'] });
    const allLinks = [...result.valid, ...result.invalid];
    expect(allLinks.length).toBe(1);
  });
});
