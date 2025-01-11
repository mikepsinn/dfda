import { readFileSync } from 'fs';
import { relative } from 'path';
import { glob } from 'glob';
import { LinkInfo, LinkLocation, ScanOptions, ValidationResult } from './types';
import { validateInternalLink } from '../validators/internal';
import { validateExternalLink } from '../validators/external';
import { extractLinks } from '../extractors';

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

export async function scanLinks(rootDir: string, options: ScanOptions = {}): Promise<LinkInfo[]> {
  const {
    checkLiveLinks = false,
    includePatterns = ['**/*'],
    excludePatterns = ['node_modules', '.git', '.next', 'dist', 'coverage'],
    concurrent = 5,
    timeout = 5000
  } = options;

  // Build glob pattern for each file type
  const patterns = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '**/*.md',
    '**/*.mdx'
  ];

  const results: LinkInfo[] = [];

  // Process each pattern
  for (const pattern of patterns) {
    // Find all files matching the pattern
    const files = glob.sync(pattern, {
      ignore: excludePatterns,
      nodir: true,
      absolute: true,
      cwd: rootDir
    });

    // Process each file
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf8');
        const relativePath = relative(rootDir, file);
        
        // Extract links from file
        const links = extractLinks(content, relativePath);
        
        // Validate each link
        for (const link of links) {
          const { isValid, error } = await validateLink(link, rootDir, checkLiveLinks);
          results.push({
            ...link,
            isValid,
            error
          });
        }
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }
  }

  return results;
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
