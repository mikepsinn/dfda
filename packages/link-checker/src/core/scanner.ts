import { LinkInfo, ScanResult, ScanOptions } from './types';
import fg from 'fast-glob';
import * as fs from 'fs';
import path from 'path';
import { validateUrl } from '../validators';

export async function extractLinksFromFile(filePath: string): Promise<LinkInfo[]> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const links: LinkInfo[] = [];
  
  // Simple regex for demonstration - in production use proper parsers
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = markdownLinkRegex.exec(content)) !== null) {
    const [, text, url] = match;
    links.push({
      url,
      location: {
        filePath,
        lineNumber: getLineNumber(content, match.index),
        columnNumber: getColumnNumber(content, match.index)
      }
    });
  }
  
  return links;
}

export async function scanLinks(
  pattern: string | string[],
  options: ScanOptions = {}
): Promise<ScanResult> {
  const files = await fg(pattern, {
    ignore: options.exclude,
    absolute: true
  });

  const allLinks: LinkInfo[] = [];
  
  for (const file of files) {
    const fileLinks = await extractLinksFromFile(file);
    allLinks.push(...fileLinks);
  }

  const validatedLinks = await Promise.all(
    allLinks.map(async link => {
      const validationResult = await validateUrl(link);
      return {
        ...link,
        validationResult
      };
    })
  );

  return {
    valid: validatedLinks.filter(link => link.validationResult?.isValid),
    invalid: validatedLinks.filter(link => !link.validationResult?.isValid)
  };
}

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function getColumnNumber(content: string, index: number): number {
  const lastNewline = content.lastIndexOf('\n', index);
  return lastNewline === -1 ? index + 1 : index - lastNewline;
}
