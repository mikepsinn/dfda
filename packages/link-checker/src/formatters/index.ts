import { LinkInfo } from '../core/types';

export function formatLinkInfo(link: LinkInfo): string {
  return `${link.url} (${link.location.filePath}:${link.location.lineNumber})`;
}

export function formatValidationResults(links: LinkInfo[]): string {
  const validLinks = links.filter(link => link.validationResult?.isValid);
  const invalidLinks = links.filter(link => !link.validationResult?.isValid);

  let output = '';

  if (validLinks.length > 0) {
    output += '\nValid Links:\n';
    validLinks.forEach(link => {
      output += `✓ ${formatLinkInfo(link)}\n`;
    });
  }

  if (invalidLinks.length > 0) {
    output += '\nInvalid Links:\n';
    invalidLinks.forEach(link => {
      output += `✗ ${formatLinkInfo(link)}`;
      if (link.validationResult?.error) {
        output += ` - ${link.validationResult.error}`;
      }
      output += '\n';
    });
  }

  return output;
}

export function formatJsonOutput(links: LinkInfo[]): string {
  const result = {
    summary: {
      total: links.length,
      valid: links.filter(link => link.validationResult?.isValid).length,
      invalid: links.filter(link => !link.validationResult?.isValid).length
    },
    links: links.map(link => ({
      url: link.url,
      location: link.location,
      status: link.validationResult?.isValid ? 'valid' : 'invalid',
      error: link.validationResult?.error
    }))
  };

  return JSON.stringify(result, null, 2);
} 