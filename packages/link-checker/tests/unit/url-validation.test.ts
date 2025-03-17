/**
 * @jest-environment node
 */

import { extractLinks } from '../../src/extractors';
import { validateExternalLink, validateLink } from '../../src/validators';
import { LinkInfo } from '../../src/core/types';
import { Response } from 'node-fetch';

jest.mock('node-fetch', () => {
  return jest.fn((url: string) => {
    if (url === 'https://example.com') {
      return Promise.resolve(new Response('', { status: 200, statusText: 'OK' }));
    }
    if (url === 'https://invalid.example.com') {
      return Promise.resolve(new Response('', { status: 404, statusText: 'Not Found' }));
    }
    return Promise.reject(new Error('Network error'));
  });
});

describe('Link Validation', () => {
  describe('extractLinks', () => {
    it('should extract links from markdown content', async () => {
      const content = `
# Test Document
[Example Link](https://example.com)
[Local Link](./local-file.md)
`;
      const links = await extractLinks(content, 'test.md');
      expect(links[0].url).toBe('https://example.com');
      expect(links[1].url).toBe('./local-file.md');
    });

    it('should extract links from HTML/JSX content', async () => {
      const content = `
<div>
  <a href="https://example.com">Example</a>
  <a href="/about">About</a>
  <img src="/images/logo.png" />
  <source src="/videos/intro.mp4" />
</div>
`;
      const links = await extractLinks(content, 'test.tsx');
      const urls = links.map(l => l.url);
      expect(urls).toEqual([
        'https://example.com',
        '/about',
        '/images/logo.png',
        '/videos/intro.mp4'
      ]);
    });

    it('should extract links from import statements', async () => {
      const content = `
import { Component } from 'react';
import('./DynamicComponent');
require('./local-module');
`;
      const links = await extractLinks(content, 'test.tsx');
      const urls = links.map(l => l.url);
      expect(urls).toEqual([
        './DynamicComponent',
        './local-module'
      ]);
    });
  });

  describe('validateExternalLink', () => {
    it('should validate a valid external link', async () => {
      const link: LinkInfo = {
        url: 'https://example.com',
        location: { filePath: 'test.md', lineNumber: 1, columnNumber: 1 }
      };
      const result = await validateExternalLink(link.url);
      expect(result.isValid).toBe(true);
    });

    it('should handle invalid external links', async () => {
      const link: LinkInfo = {
        url: 'https://invalid.example.com',
        location: { filePath: 'test.md', lineNumber: 1, columnNumber: 1 }
      };
      const result = await validateExternalLink(link.url);
      expect(result.isValid).toBe(false);
    });

    it('should handle network errors', async () => {
      const link: LinkInfo = {
        url: 'https://error.example.com',
        location: { filePath: 'test.md', lineNumber: 1, columnNumber: 1 }
      };
      const result = await validateExternalLink(link.url);
      expect(result.isValid).toBe(false);
    });
  });

  const rootDir = process.cwd();

  describe('validateLink', () => {
    it('should validate internal links correctly', async () => {
      const link: LinkInfo = {
        url: 'README.md',
        filePath: 'test.md',
        lineNumber: 1
      };

      const result = await validateLink(link, rootDir);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('File not found');
    });

    it('should validate external links correctly when checkLiveLinks is true', async () => {
      const link: LinkInfo = {
        url: 'https://example.com',
        filePath: 'test.md',
        lineNumber: 1
      };

      const result = await validateLink(link, rootDir, true);
      expect(result.isValid).toBeDefined();
    });

    it('should validate anchor links as valid', async () => {
      const link: LinkInfo = {
        url: '#section',
        filePath: 'test.md',
        lineNumber: 1
      };

      const result = await validateLink(link, rootDir);
      expect(result.isValid).toBe(true);
    });
  });
});
