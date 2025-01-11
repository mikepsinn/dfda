import { LinkInfo } from '../types';

// Regex for markdown links [text](url)
const MARKDOWN_LINK_REGEX = /\[([^\]]*)\]\(([^)]+)\)/g;

// Regex for reference-style links [text][ref] and [ref]: url
const REFERENCE_LINK_REGEX = /\[([^\]]+)\]:\s*(\S+)/g;

export function extractMarkdownLinks(content: string, filePath: string): LinkInfo[] {
  const links: LinkInfo[] = [];
  const lines = content.split('\n');

  // Process each line to get correct line numbers
  lines.forEach((line, index) => {
    // Find inline links [text](url)
    let match;
    while ((match = MARKDOWN_LINK_REGEX.exec(line)) !== null) {
      const url = match[2].trim();
      links.push({
        url,
        location: {
          filePath,
          lineNumber: index + 1,
          columnNumber: match.index + match[1].length + 3 // [text]( = length + 3
        }
      });
    }

    // Find reference links [ref]: url
    while ((match = REFERENCE_LINK_REGEX.exec(line)) !== null) {
      const url = match[2].trim();
      links.push({
        url,
        location: {
          filePath,
          lineNumber: index + 1,
          columnNumber: match.index + match[1].length + 3 // [ref]:  = length + 3
        }
      });
    }
  });

  return links;
} 