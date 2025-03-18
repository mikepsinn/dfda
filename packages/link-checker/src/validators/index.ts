import { LinkInfo, ValidationResult } from '../core/types';
import fetch from 'isomorphic-fetch';
import * as fs from 'fs';
import path from 'path';

export async function validateExternalUrl(url: string): Promise<ValidationResult> {
  try {
    const response = await fetch(url);
    return { 
      isValid: response.ok, 
      statusCode: response.status,
      checkedAt: new Date()
    };
  } catch (error) {
    return { 
      isValid: false, 
      statusCode: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      checkedAt: new Date()
    };
  }
}

export async function validateLocalUrl(link: LinkInfo, baseDir: string): Promise<ValidationResult> {
  // Skip validation for special protocols
  if (link.url.startsWith('mailto:') || link.url.startsWith('tel:')) {
    return { 
      isValid: true,
      checkedAt: new Date()
    };
  }

  try {
    const filePath = path.join(baseDir, link.url);
    if (fs.existsSync(filePath)) {
      return { 
        isValid: true,
        checkedAt: new Date()
      };
    }

    const response = await fetch(link.url);
    return { 
      isValid: response.ok, 
      statusCode: response.status,
      checkedAt: new Date()
    };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Network error',
      checkedAt: new Date()
    };
  }
}

export async function validateUrl(link: LinkInfo, options: { baseUrl?: string } = {}): Promise<ValidationResult> {
  if (link.url.startsWith('mailto:') || link.url.startsWith('tel:')) {
    return { 
      isValid: true,
      checkedAt: new Date()
    };
  }

  try {
    const url = link.url.startsWith('/') && options.baseUrl
      ? `${options.baseUrl}${link.url}`
      : link.url;

    const response = await fetch(url);
    return { 
      isValid: response.ok, 
      statusCode: response.status,
      checkedAt: new Date()
    };
  } catch (error) {
    return { 
      isValid: false, 
      error: error instanceof Error ? error.message : 'Network error',
      checkedAt: new Date()
    };
  }
}
