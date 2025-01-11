import { LinkInfo } from '../core/types';

// Regular expressions for different types of links
const EDGE_CASE_REGEX = /(?:\[([^\]]+)\]\(([^)]+)\)|([^<>"')\]\s]+))/g;
const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/g;
const MARKDOWN_LINK_REGEX = /\[([^\]]*?)\]\(([^\s)]+)\)/g;
const HTML_LINK_REGEX = /(?:href|src)=["']([^"']+)["']/g;
const IMPORT_REGEX = /(?:import|require)\(?['"]([^'"]+)['"]\)?/g;
const DYNAMIC_IMPORT_REGEX = /dynamic\(\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)\)/g;
const CSS_MODULE_REGEX = /from\s+['"]([^'"]+\.module\.css)['"]/g;
const MDX_IMPORT_REGEX = /import\s+(?:[A-Z][A-Za-z0-9]*\s+from\s+)?['"]([^'"]+\.(?:jsx?|tsx?|mdx?))['"]/g;
const NEXTJS_LINK_REGEX = /<Link\s+[^>]*href=["']([^"']+)["']/g;
const NEXTJS_IMAGE_REGEX = /<Image\s+[^>]*src=["']([^"']+)["']/g;

export function extractLinks(content: string, filePath: string): LinkInfo[] {
  const links: LinkInfo[] = [];
  const regexes = [
    NEXTJS_LINK_REGEX,
    NEXTJS_IMAGE_REGEX,
    MARKDOWN_LINK_REGEX,
    URL_REGEX,
    HTML_LINK_REGEX,
    IMPORT_REGEX,
    DYNAMIC_IMPORT_REGEX,
    CSS_MODULE_REGEX,
    MDX_IMPORT_REGEX,
    EDGE_CASE_REGEX
  ];

  for (const regex of regexes) {
    let match;
    while ((match = regex.exec(content)) !== null) {
      const url = (match[1] || match[2] || match[0]).trim();
      if (url) {
        links.push({
          url,
          location: {
            filePath,
            lineNumber: getLineNumber(content, match.index),
            columnNumber: getColumnNumber(content, match.index)
          }
        });
      }
    }
  }

  return links;
}

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function getColumnNumber(content: string, index: number): number {
  const lastNewline = content.lastIndexOf('\n', index);
  return lastNewline === -1 ? index + 1 : index - lastNewline;
}
