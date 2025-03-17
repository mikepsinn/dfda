import { LinkInfo } from '../core/types';

// Regex for JSX attributes
const HREF_REGEX = /href=["']([^"']+)["']/g;
const SRC_REGEX = /src=["']([^"']+)["']/g;

// Regex for dynamic imports
const DYNAMIC_IMPORT_REGEX = /import\(['"]([^'"]+)['"]\)/g;

function isValidUrl(url: string): boolean {
  return url.startsWith('/') || url.startsWith('./') || url.startsWith('../') || url.startsWith('http');
}

export function extractLinks(content: string, filePath: string): LinkInfo[] {
  const links: LinkInfo[] = [];
  const seenUrls = new Set<string>();

  const lines = content.split('\n');
  lines.forEach((line, lineIndex) => {
    let match;

    // Extract href attributes
    while ((match = HREF_REGEX.exec(line)) !== null) {
      const [, url] = match;
      if (isValidUrl(url) && !seenUrls.has(url)) {
        seenUrls.add(url);
        links.push({
          url,
          location: {
            filePath,
            lineNumber: lineIndex + 1,
            columnNumber: match.index + 6 // href="
          }
        });
      }
    }

    // Extract src attributes
    while ((match = SRC_REGEX.exec(line)) !== null) {
      const [, url] = match;
      if (isValidUrl(url) && !seenUrls.has(url)) {
        seenUrls.add(url);
        links.push({
          url,
          location: {
            filePath,
            lineNumber: lineIndex + 1,
            columnNumber: match.index + 5 // src="
          }
        });
      }
    }

    // Extract dynamic imports
    while ((match = DYNAMIC_IMPORT_REGEX.exec(line)) !== null) {
      const [, url] = match;
      if (isValidUrl(url) && !seenUrls.has(url)) {
        seenUrls.add(url);
        links.push({
          url,
          location: {
            filePath,
            lineNumber: lineIndex + 1,
            columnNumber: match.index + 8 // import('
          }
        });
      }
    }
  });

  return links;
} 