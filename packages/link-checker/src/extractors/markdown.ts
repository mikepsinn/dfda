import { LinkInfo } from '../core/types';

// Regex for markdown links [text](url)
const MARKDOWN_LINK_REGEX = /\[([^\]]*)\]\(([^)]+)\)/g;

// Regex for reference-style links [text][ref] and [ref]: url
const REFERENCE_LINK_REGEX = /\[([^\]]+)\]:\s*(\S+)/g;

function getLineNumber(content: string, index: number): number {
  const lines = content.slice(0, index).split('\n');
  return lines.length;
}

function getColumnNumber(content: string, index: number): number {
  const lines = content.slice(0, index).split('\n');
  const lastLine = lines[lines.length - 1];
  return lastLine.length + 1;
}

export function extractLinks(content: string, filePath: string): LinkInfo[] {
  const links: LinkInfo[] = [];
  const seenUrls = new Set<string>();

  const lines = content.split('\n');
  lines.forEach((line, lineIndex) => {
    let match;
    while ((match = MARKDOWN_LINK_REGEX.exec(line)) !== null) {
      const [, text, url] = match;
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        links.push({
          url,
          location: {
            filePath,
            lineNumber: lineIndex + 1,
            columnNumber: match.index + text.length + 3 // [text] = text.length + 2 for [ and ], +1 for ]
          }
        });
      }
    }
  });

  return links;
}

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