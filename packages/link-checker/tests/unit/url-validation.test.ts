/**
 * @jest-environment node
 */

import { extractLinks } from '../../src/extractors';
import { validateExternalLink } from '../../src/validators/external-link';
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

describe('URL Validation and Extraction', () => {
  describe('Link Extraction', () => {
    it('extracts markdown links', () => {
      const content = `
# Title
[Link 1](https://example.com)
[Link 2](./local-file.md)
      `;
      const links = extractLinks(content, 'test.md');
      expect(links).toHaveLength(2);
      expect(links[0].url).toBe('https://example.com');
      expect(links[1].url).toBe('./local-file.md');
    });

    it('extracts MDX/JSX links', () => {
      const content = `
import Component from './Component.mdx';

export default function Page() {
  return (
    <div>
      <Component />
      <img src="/images/hero.jpg" alt="Hero" />
      <a href="https://example.com">Link</a>
      <Link href="/about">About</Link>
    </div>
  );
}
      `;
      const links = extractLinks(content, 'page.mdx');
      expect(links).toHaveLength(4);
      expect(links.map(l => l.url)).toEqual([
        './Component.mdx',
        '/images/hero.jpg',
        'https://example.com',
        '/about'
      ]);
    });

    it('extracts Next.js specific links', () => {
      const content = `
import dynamic from 'next/dynamic';
import Image from 'next/image';

const DynamicComponent = dynamic(() => import('./DynamicComponent'));

export default function Page() {
  return (
    <div>
      <DynamicComponent />
      <Link href="/about">About</Link>
      <Image src="/public/logo.png" alt="Logo" />
      <img src="/images/hero.jpg" alt="Hero" />
    </div>
  );
}
      `;
      const links = extractLinks(content, 'page.tsx');
      expect(links).toHaveLength(4);
      expect(links.map(l => l.url)).toEqual([
        './DynamicComponent',
        '/about',
        '/public/logo.png',
        '/images/hero.jpg'
      ]);
    });
  });

  describe('External Link Validation', () => {
    it('validates external links', async () => {
      const link: LinkInfo = {
        url: 'https://example.com',
        location: { line: 1, column: 1 }
      };
      const result = await validateExternalLink(link);
      expect(result).toBe(true);
    });

    it('handles invalid external links', async () => {
      const link: LinkInfo = {
        url: 'https://invalid.example.com',
        location: { line: 1, column: 1 }
      };
      const result = await validateExternalLink(link);
      expect(result).toBe(false);
    });

    it('handles network errors', async () => {
      const link: LinkInfo = {
        url: 'https://error.example.com',
        location: { line: 1, column: 1 }
      };
      const result = await validateExternalLink(link);
      expect(result).toBe(false);
    });
  });
});
