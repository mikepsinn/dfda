import { LinkInfo } from '../core/types';

// Regular expressions for different types of links
const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/g;
const MARKDOWN_LINK_REGEX = /\[([^\]]*?)\]\(([^\s)]+)\)/g;
const HTML_LINK_REGEX = /(?:href|src)=["']([^"']+)["']/g;
const IMPORT_REGEX = /(?:import|require)\(?['"]([^'"]+)['"]\)?/g;
const DYNAMIC_IMPORT_REGEX = /dynamic\(\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)\)/g;
const MDX_IMPORT_REGEX = /import\s+(?:[A-Z][A-Za-z0-9]*\s+from\s+)?['"]([^'"]+\.(?:jsx?|tsx?|mdx?))['"]/g;
const NEXTJS_LINK_REGEX = /<Link\s+[^>]*href=["']([^"']+)["']/g;
const NEXTJS_IMAGE_REGEX = /<Image\s+[^>]*src=["']([^"']+)["']/g;

export function extractLinks(content: string, filePath: string): LinkInfo[] {
  const links: LinkInfo[] = [];
  const seenUrls = new Set<string>();
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip comment lines
    if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
      return;
    }

    const regexes = [
      NEXTJS_LINK_REGEX,
      NEXTJS_IMAGE_REGEX,
      MARKDOWN_LINK_REGEX,
      HTML_LINK_REGEX,
      IMPORT_REGEX,
      DYNAMIC_IMPORT_REGEX,
      MDX_IMPORT_REGEX,
      URL_REGEX
    ];

    for (const regex of regexes) {
      let match;
      while ((match = regex.exec(line)) !== null) {
        const url = match[1] || match[0];
        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          links.push({
            url,
            location: {
              filePath,
              lineNumber: index + 1,
              columnNumber: getColumnNumber(line, match.index)
            }
          });
        }
      }
    }
  });

  return links;
}

function getColumnNumber(line: string, index: number): number {
  return line.slice(0, index).length + 1;
}
