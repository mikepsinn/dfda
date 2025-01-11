import { LinkInfo } from '../types';

// Regex for bare URLs in text
const BARE_URL_REGEX = /https?:\/\/[^\s"'`\]>)]+(?=[.,;:!?)*\]]*(?:\s|$))/g;

export function extractBareLinks(content: string, filePath: string): LinkInfo[] {
  const links: LinkInfo[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip comment lines
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
      return;
    }

    let match;
    while ((match = BARE_URL_REGEX.exec(line)) !== null) {
      const url = match[0].trim();
      links.push({
        url,
        location: {
          filePath,
          lineNumber: index + 1,
          columnNumber: match.index
        }
      });
    }
  });

  return links;
} 