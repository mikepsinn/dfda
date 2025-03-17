import { readFileSync } from 'fs';
import { relative } from 'path';
import fg from 'fast-glob';
import { remark } from 'remark';
import remarkHtml from 'remark-html';
import { visit } from 'unist-util-visit';
import { LinkInfo } from './types';
import { validateLink } from '../validators';

async function extractLinks(content: string, filePath: string): Promise<LinkInfo[]> {
  const links: LinkInfo[] = [];
  const processor = remark().use(remarkHtml);
  const ast = processor.parse(content);

  visit(ast, 'link', (node: any) => {
    links.push({
      url: node.url,
      filePath,
      lineNumber: node.position?.start.line || 0
    });
  });

  return links;
}

export async function scanLinks(patterns: string | string[], options: {
  cwd?: string;
  exclude?: string[];
  checkLiveLinks?: boolean;
} = {}): Promise<{
  valid: LinkInfo[];
  invalid: LinkInfo[];
}> {
  const globOptions = {
    cwd: options.cwd || process.cwd(),
    ignore: options.exclude || [],
    absolute: true
  };

  const files = await fg(patterns, globOptions);
  const results: LinkInfo[] = [];

  for (const file of files) {
    const content = readFileSync(file, 'utf-8');
    const relativeFilePath = relative(globOptions.cwd, file);
    const fileLinks = await extractLinks(content, relativeFilePath);
    
    if (options.checkLiveLinks) {
      for (const link of fileLinks) {
        const validationResult = await validateLink(link, globOptions.cwd, true);
        link.validationResult = validationResult;
      }
    }

    results.push(...fileLinks);
  }

  return {
    valid: results.filter(link => !link.validationResult || link.validationResult.isValid),
    invalid: results.filter(link => link.validationResult && !link.validationResult.isValid)
  };
}

export function filterValidLinks(links: LinkInfo[]): { valid: LinkInfo[]; invalid: LinkInfo[] } {
  return {
    valid: links.filter(link => !link.error),
    invalid: links.filter(link => link.error)
  };
}
