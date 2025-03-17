/**
 * @jest-environment node
 */

import { scanLinks } from '../../src/core/scanner';
import { LinkInfo } from '../../src/core/types';
import path from 'path';
import * as fs from 'fs';

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

    const links = await scanLinks(testDir, ['**/excluded/**']);
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
