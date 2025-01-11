/**
 * @jest-environment node
 */

import { extractLinks } from '../../src/extractors';
import { validateInternalLink } from '../../src/validators/internal';
import { validateExternalLink } from '../../src/validators/external';
import { LinkInfo } from '../../src/core/types';
import path from 'path';
import fetch, { RequestInfo, RequestInit } from 'node-fetch';

// Mock node-fetch
jest.mock('node-fetch', () => jest.fn());
const { Response } = jest.requireActual('node-fetch');
const mockedFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('Link Checker', () => {
  const testDir = path.join(__dirname, '../fixtures');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractLinks', () => {
    it('should extract markdown links from links.md', () => {
      const content = `
# Test
[Internal Link](#section)
[Relative Link](./other-file.md)
[Absolute Link](/docs/api.md)
[External Link](https://example.com)
      `;
      const links = extractLinks(content, 'links.md');
      expect(links).toHaveLength(4);
    });

    it('should extract edge case links from edge-cases.md', () => {
      const content = `
[Windows Path](C:\Users\test\file.md)
[Unix Path](/usr/local/bin/file)
[URL Encoded Path](%2Fpath%2Fto%2Ffile.md)
[Spaces in Path](./path with spaces/file.md)
      `;
      const links = extractLinks(content, 'edge-cases.md');
      expect(links).toHaveLength(4);
    });

    it('should extract Next.js specific links', () => {
      const content = `
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Component.module.css';
import api from '../pages/api/hello';

const DynamicComponent = dynamic(() => import('./DynamicComponent'));

function App() {
  return (
    <div>
      <Link href="/about">
        <a>About</a>
      </Link>
      <Image
        src="/public/logo.png"
        alt="Logo"
        width={200}
        height={100}
      />
      <DynamicComponent />
      <button onClick={() => api()}>Call API</button>
      <div className={styles.content}>
        <p>Styled content</p>
      </div>
      <img src="/images/hero.jpg" alt="Hero" />
    </div>
  );
}
      `;
      const links = extractLinks(content, 'nextjs-sample.tsx');
      expect(links).toEqual([
        { url: '/about', location: expect.any(Object) },
        { url: '/public/logo.png', location: expect.any(Object) },
        { url: '/images/hero.jpg', location: expect.any(Object) },
        { url: './DynamicComponent', location: expect.any(Object) },
        { url: './Component.module.css', location: expect.any(Object) }
      ]);
    });

  });

  describe('validateInternalLink', () => {
    it('should validate local file links', async () => {
      const link: LinkInfo = {
        url: './sample.md',
        location: {
          filePath: 'test.md',
          lineNumber: 1
        }
      };
      const result = await validateInternalLink(link, testDir);
      expect(result.isValid).toBe(true);
    });

    it('should fail for non-existent files', async () => {
      const link: LinkInfo = {
        url: './non-existent.md',
        location: {
          filePath: 'test.md',
          lineNumber: 1
        }
      };
      const result = await validateInternalLink(link, testDir);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle URL encoded paths', async () => {
      const link: LinkInfo = {
        url: '%2Fpath%2Fto%2Ffile.md',
        location: {
          filePath: 'test.md',
          lineNumber: 1
        }
      };
      const result = await validateInternalLink(link, testDir);
      expect(result.isValid).toBe(false);
    });

    it('should handle paths with spaces', async () => {
      const link: LinkInfo = {
        url: './path with spaces/file.md',
        location: {
          filePath: 'test.md',
          lineNumber: 1
        }
      };
      const result = await validateInternalLink(link, testDir);
      expect(result.isValid).toBe(false);
    });
  });

  describe('validateExternalLink', () => {
    beforeEach(() => {
      mockedFetch.mockImplementation(async (url: RequestInfo, init?: RequestInit) => {
        const urlStr = typeof url === 'string' ? url : url.toString();
        if (urlStr === 'https://www.google.com') {
          return new Response('', { status: 200 });
        }
        throw new Error('Failed to fetch');
      });
    });

    it('should validate external URLs', async () => {
      const link: LinkInfo = {
        url: 'https://www.google.com',
        location: {
          filePath: 'test.md',
          lineNumber: 1
        }
      };
      const result = await validateExternalLink(link);
      expect(result.isValid).toBe(true);
    });

    it('should fail for invalid URLs', async () => {
      const link: LinkInfo = {
        url: 'https://this-is-an-invalid-domain-12345.com',
        location: {
          filePath: 'test.md',
          lineNumber: 1
        }
      };
      const result = await validateExternalLink(link);
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle malformed URLs', async () => {
      const link: LinkInfo = {
        url: 'https://example .com',
        location: {
          filePath: 'test.md',
          lineNumber: 1
        }
      };
      const result = await validateExternalLink(link);
      expect(result.isValid).toBe(false);
    });
  });
});
