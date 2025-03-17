import { LinkInfo, ValidationResult } from '../core/types';
import fetch from 'node-fetch';

export async function validateExternalLink(link: LinkInfo): Promise<ValidationResult> {
  try {
    const response = await fetch(link.url);
    return {
      isValid: response.ok,
      error: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
} 