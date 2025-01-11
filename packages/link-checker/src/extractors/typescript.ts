import { LinkInfo } from '../types';

// Regex for string literals containing URLs
const URL_STRING_REGEX = /["'`]((?:https?:\/\/[^\s"'`\]>)]+|\/[^\s"'`\]>)]+))["'`]/g;

// Regex for template literals containing URLs
const TEMPLATE_URL_REGEX = /`([^`]+)`/g;

export function extractTypeScriptLinks(content: string, filePath: string): LinkInfo[] {
  const links: LinkInfo[] = [];
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip comment lines
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
      return;
    }

    // Find URLs in string literals
    let match;
    while ((match = URL_STRING_REGEX.exec(line)) !== null) {
      const url = match[1].trim();
      // Skip if it looks like a file path
      if (!url.includes('\\') && !url.match(/^[A-Za-z]:/)) {
        links.push({
          url,
          location: {
            filePath,
            lineNumber: index + 1,
            columnNumber: match.index + 1 // +1 for the quote
          }
        });
      }
    }

    // Find URLs in template literals
    while ((match = TEMPLATE_URL_REGEX.exec(line)) !== null) {
      const content = match[1];
      // Look for URLs in the template literal content
      const urlMatch = content.match(/(?:https?:\/\/[^\s"'`\]>)]+|\/[^\s"'`\]>)]+)/);
      if (urlMatch && !urlMatch[0].includes('\\') && !urlMatch[0].match(/^[A-Za-z]:/)) {
        links.push({
          url: urlMatch[0].trim(),
          location: {
            filePath,
            lineNumber: index + 1,
            columnNumber: match.index + match[0].indexOf(urlMatch[0])
          }
        });
      }
    }
  });

  return links;
} 