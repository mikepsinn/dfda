import { LinkInfo } from '../types';

// Regex for Next.js Link components
const NEXT_LINK_REGEX = /(?:<Link[^>]*href=["']([^"']+)["'][^>]*>|href=["']([^"']+)["'])/g;

// Regex for string literals in JSX attributes
const STRING_LITERAL_REGEX = /(?:href|to|url|path)=["']([^"']+)["']/g;

export function extractJsxLinks(content: string, filePath: string): LinkInfo[] {
  const links: LinkInfo[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Find Next.js Link components and href attributes
    let match;
    while ((match = NEXT_LINK_REGEX.exec(line)) !== null) {
      const url = (match[1] || match[2]).trim();
      links.push({
        url,
        location: {
          filePath,
          lineNumber: index + 1,
          columnNumber: match.index + match[0].indexOf(url)
        }
      });
    }

    // Find other URL string literals
    while ((match = STRING_LITERAL_REGEX.exec(line)) !== null) {
      const url = match[1].trim();
      // Skip if already found by NEXT_LINK_REGEX
      if (!links.some(link => 
        link.location.lineNumber === index + 1 && 
        link.url === url
      )) {
        links.push({
          url,
          location: {
            filePath,
            lineNumber: index + 1,
            columnNumber: match.index + match[0].indexOf(url)
          }
        });
      }
    }
  });

  return links;
} 