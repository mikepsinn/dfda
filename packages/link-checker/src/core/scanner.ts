import { readFileSync } from 'fs';
import { relative } from 'path';
import { glob } from 'glob';
import { LinkInfo, LinkLocation, ScanOptions, ValidationResult } from './types';
import { validateInternalLink } from '../validators/internal';
import { validateExternalLink } from '../validators/external';
import { extractLinks as extractMarkdownLinks } from '../extractors/markdown';
import { extractLinks as extractJsxLinks } from '../extractors/jsx';
import * as fs from 'fs';
import * as path from 'path';

async function validateLink(link: LinkInfo, rootDir: string, checkLiveLinks: boolean): Promise<ValidationResult> {
  try {
    // Check if it's an external URL
    const isExternal = /^https?:\/\//i.test(link.url);

    if (isExternal) {
      if (checkLiveLinks) {
        return await validateExternalLink(link);
      } else {
        // Basic URL validation for external links when not checking live
        try {
          new URL(link.url);
          return { isValid: true };
        } catch {
          return { isValid: false, error: 'Invalid URL format' };
        }
      }
    } else {
      // Internal link validation
      return await validateInternalLink(link, rootDir);
    }
  } catch (e) {
    return { 
      isValid: false, 
      error: e instanceof Error ? e.message : 'Unknown error' 
    };
  }
}

export async function scanLinks(directory: string, exclude?: string[]): Promise<LinkInfo[]> {
  const links: LinkInfo[] = [];
  const files = glob.sync('**/*.{md,mdx,js,jsx,ts,tsx}', {
    cwd: directory,
    ignore: exclude || [],
    absolute: true
  });

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const ext = path.extname(file);
    const filePath = path.relative(directory, file);

    if (ext === '.md') {
      links.push(...extractMarkdownLinks(content, filePath));
    } else {
      links.push(...extractJsxLinks(content, filePath));
    }
  }

  return links;
}

export function formatReport(results: LinkInfo[]): string {
  const validLinks = results.filter(r => r.isValid);
  const invalidLinks = results.filter(r => !r.isValid);

  let report = 'Link Checker Report\n';
  report += '=================\n\n';
  report += `Total Links: ${results.length}\n`;
  report += `Valid Links: ${validLinks.length}\n`;
  report += `Invalid Links: ${invalidLinks.length}\n`;

  if (invalidLinks.length > 0) {
    report += '\nInvalid Links:\n';
    report += '-------------\n\n';
    invalidLinks.forEach(link => {
      report += `URL: ${link.url}\n`;
      report += `Location: ${link.location.filePath}:${link.location.lineNumber}\n`;
      if (link.error) {
        report += `Error: ${link.error}\n`;
      }
      report += '\n';
    });
  }

  return report;
}
