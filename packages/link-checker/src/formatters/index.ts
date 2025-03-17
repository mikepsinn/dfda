import { ValidationResult, LinkInfo, BrokenLink } from '../core/types';

export function formatValidationResults(results: ValidationResult[], links: LinkInfo[]): string {
  const brokenLinks: BrokenLink[] = results
    .map((result, index) => {
      if (result.isValid) return null;
      const link = links[index];
      return {
        url: link.url,
        filePath: link.filePath,
        lineNumber: link.lineNumber,
        error: result.error || `HTTP ${result.statusCode}`
      };
    })
    .filter((link): link is BrokenLink => link !== null);

  if (brokenLinks.length === 0) {
    return 'All links are valid!';
  }

  return formatTable(brokenLinks);
}

function formatTable(links: BrokenLink[]): string {
  const table = ['File | Line | URL | Error', '-----|------|-----|-------'];

  links.forEach(link => {
    table.push(`${link.filePath} | ${link.lineNumber} | ${link.url} | ${link.error}`);
  });

  return table.join('\n');
} 