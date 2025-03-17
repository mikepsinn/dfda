/**
 * @jest-environment node
 */

import { scanLinks } from '../../src/core/scanner';
import { LinkInfo } from '../../src/core/types';
import path from 'path';
import * as fs from 'fs';

jest.mock('fs', () => ({
  readFileSync: jest.fn()
}));

jest.mock('fast-glob', () => jest.fn());

describe('Scanner', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(__dirname, 'test-'));
  });

  afterEach(() => {
    fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('finds external links in markdown files', async () => {
    const filePath = path.join(testDir, 'test.md');
    const content = `
# Test Document
[External Link](https://example.com)
[Another External](https://api.example.com)
[Email Link](mailto:test@example.com)
    `;
    fs.writeFileSync(filePath, content);

    const links = await scanLinks(testDir);
    expect(links).toEqual([
      {
        url: 'https://example.com',
        location: {
          filePath: 'test.md',
          lineNumber: 3,
          columnNumber: 15
        }
      },
      {
        url: 'https://api.example.com',
        location: {
          filePath: 'test.md',
          lineNumber: 4,
          columnNumber: 17
        }
      },
      {
        url: 'mailto:test@example.com',
        location: {
          filePath: 'test.md',
          lineNumber: 5,
          columnNumber: 13
        }
      }
    ]);
  });

  it('excludes specified patterns', async () => {
    // Create a markdown file in the excluded directory
    const excludedDir = path.join(testDir, 'excluded');
    fs.mkdirSync(excludedDir);
    fs.writeFileSync(
      path.join(excludedDir, 'excluded.md'),
      '[Excluded Link](https://excluded.com)'
    );

    // Create a markdown file in the included directory
    const includedDir = path.join(testDir, 'included');
    fs.mkdirSync(includedDir);
    fs.writeFileSync(
      path.join(includedDir, 'included.md'),
      '[Included Link](https://included.com)'
    );

    const links = await scanLinks(testDir, { exclude: ['**/excluded/**'] });
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe('https://included.com');
  });

  it('handles files with mixed content types', async () => {
    const content = `
# Documentation
[External API](https://api.example.com)
\`\`\`jsx
<Link href="/about">About</Link>
\`\`\`
[Another Link](https://docs.example.com)
    `;
    fs.writeFileSync(path.join(testDir, 'mixed.md'), content);

    const links = await scanLinks(testDir);
    expect(links.map(l => l.url)).toEqual([
      'https://api.example.com',
      'https://docs.example.com'
    ]);
  });

  it('handles malformed URLs', async () => {
    const content = `
[Valid Link](https://example.com)
[Missing Protocol](example.com)
[Malformed](http:/broken.com)
[Empty]()
    `;
    fs.writeFileSync(path.join(testDir, 'malformed.md'), content);

    const links = await scanLinks(testDir);
    // Should only include the valid URL
    expect(links).toHaveLength(1);
    expect(links[0].url).toBe('https://example.com');
  });
});

describe('scanLinks', () => {
  const mockFiles = [
    path.join(process.cwd(), 'test1.md'),
    path.join(process.cwd(), 'test2.md')
  ];

  beforeEach(() => {
    jest.resetAllMocks();
    const fg = require('fast-glob');
    fg.mockResolvedValue(mockFiles);
  });

  it('should scan markdown files and extract links', async () => {
    const fs = require('fs');
    fs.readFileSync.mockReturnValue('# Test\n[Link](https://example.com)');

    const result = await scanLinks('**/*.md');
    const allLinks = [...result.valid, ...result.invalid];
    expect(allLinks.length).toBe(2);
    expect(allLinks[0]).toEqual({
      url: 'https://example.com',
      filePath: 'test1.md',
      lineNumber: 1
    });
  });

  it('should validate links when checkLiveLinks is true', async () => {
    const fs = require('fs');
    fs.readFileSync.mockReturnValue('# Test\n[Link](https://example.com)');

    const result = await scanLinks('**/*.md', { checkLiveLinks: true });
    const allLinks = [...result.valid, ...result.invalid];
    expect(allLinks.length).toBe(2);
    expect(allLinks[0].validationResult).toBeDefined();
  });

  it('should handle multiple links in a file', async () => {
    const fs = require('fs');
    fs.readFileSync.mockReturnValue(`
      # Test
      [Link 1](https://example1.com)
      [Link 2](https://example2.com)
    `);

    const result = await scanLinks('**/*.md');
    const allLinks = [...result.valid, ...result.invalid];
    const urls = allLinks.map(l => l.url);
    expect(urls).toContain('https://example1.com');
    expect(urls).toContain('https://example2.com');
  });
});
