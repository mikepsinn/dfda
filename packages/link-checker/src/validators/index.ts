import { ValidationResult, BrokenLink, formatBrokenLinksTable, LinkInfo } from '../core/types';

type LinkValidator = (url: string, filePath: string, lineNumber: number) => Promise<ValidationResult>;
import { validateInternalLink } from './internal';
import { validateExternalLink } from './external';

export const validateLink: LinkValidator = async (url: string, filePath: string, lineNumber: number): Promise<ValidationResult> => {
  // Clean the URL of any trailing punctuation
  const cleanUrl = url.replace(/[.,;:!?)*\]]+$/, '');

  const linkInfo: LinkInfo = {
    url: cleanUrl,
    location: {
      filePath,
      lineNumber
    }
  };

  try {
    // Route to appropriate validator
    if (cleanUrl.startsWith('/')) {
      return await validateInternalLink(linkInfo, process.cwd());
    } else if (cleanUrl.startsWith('http')) {
      return await validateExternalLink(linkInfo);
    }
    
    return {
      isValid: false,
      error: 'Invalid URL format',
      filePath,
      lineNumber
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      filePath,
      lineNumber
    };
  }
};

export function formatValidationResults(results: ValidationResult[]): string {
  const brokenLinks: BrokenLink[] = results
    .filter(result => !result.isValid)
    .map(result => ({
      url: result.filePath || '',
      filePath: result.filePath || '',
      lineNumber: result.lineNumber || 0,
      error: result.error || 'Unknown error'
    }));

  if (brokenLinks.length === 0) {
    return 'All links are valid!';
  }

  return formatBrokenLinksTable(brokenLinks);
}
