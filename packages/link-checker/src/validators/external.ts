import { LinkInfo, ValidationResult } from '../core/types';
import fetch from 'node-fetch';

export async function validateExternalLink(link: LinkInfo, timeout = 5000): Promise<ValidationResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(link.url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Link Validator Bot (https://github.com/mikepsinn/link-validator)'
      }
    });

    clearTimeout(timeoutId);
    
    if (response.ok) {
      return { isValid: true };
    }

    return { 
      isValid: false, 
      error: `HTTP ${response.status}: ${response.statusText}` 
    };
  } catch (e) {
    return { 
      isValid: false, 
      error: e instanceof Error ? e.message : 'Failed to fetch URL'
    };
  }
} 