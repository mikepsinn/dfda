import { ValidationResult, LinkInfo } from '../core/types';
import 'isomorphic-fetch';
import fs from 'fs/promises';
import path from 'path';

export async function validateExternalLink(url: string): Promise<ValidationResult> {
  try {
    const response = await fetch(url);
    return { isValid: response.ok, statusCode: response.status };
  } catch (error) {
    return { isValid: false, statusCode: 0 };
  }
}

export async function validateLink(link: LinkInfo, rootDir: string, checkLiveLinks = false): Promise<ValidationResult> {
  // Handle anchor links
  if (link.url.startsWith('#')) {
    return { isValid: true };
  }

  // Check if it's an external URL
  const isExternal = /^https?:\/\//i.test(link.url);

  if (isExternal) {
    if (!checkLiveLinks) {
      return { isValid: true };
    }

    try {
      const response = await fetch(link.url);
      return { isValid: response.ok, statusCode: response.status };
    } catch (error) {
      return { isValid: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  // Handle internal links
  try {
    const targetPath = path.resolve(rootDir, link.url);
    await fs.access(targetPath);
    return { isValid: true };
  } catch {
    return { isValid: false, error: `File not found: ${link.url}` };
  }
}

export async function validateLinks(links: LinkInfo[], rootDir: string, checkLiveLinks = false): Promise<ValidationResult[]> {
  return Promise.all(links.map(link => validateLink(link, rootDir, checkLiveLinks)));
}
