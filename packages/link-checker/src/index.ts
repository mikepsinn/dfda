import * as fs from 'fs/promises';
import * as path from 'path';
import * as cheerio from 'cheerio';
import { loadConfig, saveConfig, updateLinkStatus } from './core/config';
import type { Config, LinkInfo } from './core/types';
const glob = require('fast-glob');
const got = require('got');

interface Link {
  url: string;
  file: string;
  line: number;
  error?: string;
}

// Regular expressions for finding links
const MD_LINK_REGEX = /\[([^\]]*)\]\(([^)]+)\)/g;
const HTML_LINK_REGEX = /<a[^>]+href=["']([^"']+)["'][^>]*>/g;

async function checkLinks(pattern: string | string[]): Promise<{ valid: Link[], invalid: Link[] }> {
  const files = await glob(pattern);
  const validLinks: Link[] = [];
  const invalidLinks: Link[] = [];
  
  // Load or create config file
  const config = await loadConfig('.link-checker.json');
  
  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const links: Link[] = [];
    
    // Find markdown links
    let match;
    let lineNumber = 1;
    const lines = content.split('\n');
    
    for (const line of lines) {
      while ((match = MD_LINK_REGEX.exec(line)) !== null) {
        links.push({
          url: match[2],
          file,
          line: lineNumber
        });
      }
      
      while ((match = HTML_LINK_REGEX.exec(line)) !== null) {
        links.push({
          url: match[1],
          file,
          line: lineNumber
        });
      }
      
      lineNumber++;
    }
    
    // Check each link
    for (const link of links) {
      try {
        // Skip if checked within last 24 hours
        const existingStatus = config.successfulLinks[link.url] || config.failedLinks[link.url];
        if (existingStatus) {
          const lastChecked = new Date(existingStatus.lastChecked);
          const now = new Date();
          const hoursSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceLastCheck < 24) {
            // Use cached result
            if (config.successfulLinks[link.url]) {
              validLinks.push(link);
            } else {
              const failedLink = config.failedLinks[link.url];
              invalidLinks.push({ ...link, error: failedLink.error || 'Unknown error' });
            }
            continue;
          }
        }
        
        // Check the link
        await got.head(link.url);
        validLinks.push(link);
        await updateLinkStatus(config, link.url, link.file, true);
      } catch (error: any) {
        const errorMessage = error?.message || 'Unknown error';
        invalidLinks.push({ ...link, error: errorMessage });
        await updateLinkStatus(config, link.url, link.file, false, errorMessage);
      }
    }
  }
  
  // Save updated config
  await saveConfig(config, '.link-checker.json');
  
  return { valid: validLinks, invalid: invalidLinks };
}

function formatResults(results: { valid: Link[], invalid: Link[] }): string {
  let output = '';
  
  if (results.valid.length > 0) {
    output += '\nValid Links:\n';
    for (const link of results.valid) {
      output += `✓ ${link.url} (${link.file}:${link.line})\n`;
    }
  }
  
  if (results.invalid.length > 0) {
    output += '\nInvalid Links:\n';
    for (const link of results.invalid) {
      output += `✗ ${link.url} (${link.file}:${link.line}) - ${link.error || 'Unknown error'}\n`;
    }
  }
  
  if (results.valid.length === 0 && results.invalid.length === 0) {
    output = 'No links found.';
  }
  
  return output;
}

export { checkLinks, formatResults }; 