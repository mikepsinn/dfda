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

      const results = await scanLinks(testDir, ['*.md']);
      expect(results).toHaveLength(1);
      expect(results[0].url).toBe('/about');
    });
  });

  describe('Skip Configuration', () => {
    it('should create and load skip configuration', async () => {
      const config: SkipConfig = {
        skippedLinks: [
          {
            url: 'https://example.com',
            reason: 'Test skip',
            addedAt: new Date().toISOString(),
          },
        ],
      };

      await saveSkipConfig(config, skipConfigPath);
      const loadedConfig = await loadSkipConfig(skipConfigPath);
      expect(loadedConfig).toEqual(config);
    });

    it('should update skip configuration', async () => {
      const initialConfig: SkipConfig = {
        skippedLinks: [],
      };

      await saveSkipConfig(initialConfig, skipConfigPath);

      const linkToSkip: LinkInfo = {
        url: 'https://example.com',
        filePath: 'test.md',
        line: 1,
        column: 1,
      };

      const reason = 'Test skip';
      await updateSkipConfig(skipConfigPath, linkToSkip, reason);

      const updatedConfig = await loadSkipConfig(skipConfigPath);
      expect(updatedConfig.skippedLinks).toHaveLength(1);
      expect(updatedConfig.skippedLinks[0].url).toBe(linkToSkip.url);
      expect(updatedConfig.skippedLinks[0].reason).toBe(reason);
    });
  });
});
