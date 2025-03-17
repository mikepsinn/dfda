import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeParse from 'rehype-parse';
import { visit } from 'unist-util-visit';
import { LinkInfo } from '../core/types';

function getLineNumber(content: string, index: number): number {
  const lines = content.slice(0, index).split('\n');
  return lines.length;
}

function getColumnNumber(content: string, index: number): number {
  const lines = content.slice(0, index).split('\n');
  const lastLine = lines[lines.length - 1];
  return lastLine.length + 1;
}

export async function extractLinks(content: string, filePath: string): Promise<LinkInfo[]> {
  const links: LinkInfo[] = [];

  // Extract import statements using regex
  const importRegex = /(?:import|require)\s*\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    links.push({
      url: match[1],
      location: {
        filePath,
        lineNumber: getLineNumber(content, match.index),
        columnNumber: getColumnNumber(content, match.index)
      }
    });
  }

  // Parse Markdown content
  if (filePath.endsWith('.md') || filePath.endsWith('.mdx')) {
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype);

    const ast = processor.parse(content);

    visit(ast, ['link', 'image'], (node: any) => {
      if (node.url) {
        links.push({
          url: node.url,
          location: {
            filePath,
            lineNumber: node.position?.start.line || 1,
            columnNumber: node.position?.start.column || 1
          }
        });
      }
    });
  }

  // Parse HTML/JSX content
  const processor = unified()
    .use(rehypeParse, { fragment: true });

  const htmlAst = processor.parse(content);

  visit(htmlAst, 'element', (node: any) => {
    if (node.tagName === 'a' && node.properties?.href) {
      links.push({
        url: node.properties.href.toString(),
        location: {
          filePath,
          lineNumber: node.position?.start.line || 1,
          columnNumber: node.position?.start.column || 1
        }
      });
    } else if ((node.tagName === 'img' || node.tagName === 'source') && node.properties?.src) {
      links.push({
        url: node.properties.src.toString(),
        location: {
          filePath,
          lineNumber: node.position?.start.line || 1,
          columnNumber: node.position?.start.column || 1
        }
      });
    }
  });

  return links;
}
