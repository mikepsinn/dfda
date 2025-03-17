export interface LinkLocation {
  filePath: string;
  lineNumber: number;
  columnNumber?: number;
}

export interface LinkInfo {
  url: string;
  location: LinkLocation;
  isValid?: boolean;
  error?: string;
  statusCode?: number;
}

export interface ScanOptions {
  // Whether to validate external URLs (HTTP/HTTPS)
  checkLiveLinks?: boolean;
  
  // Glob patterns for files to include in the scan
  includePatterns?: string[];
  
  // Glob patterns for files to exclude from the scan
  excludePatterns?: string[];
  
  // Maximum number of concurrent requests for link validation
  concurrent?: number;
  
  // Timeout in milliseconds for external link validation
  timeout?: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  filePath?: string;
  lineNumber?: number;
}

export interface BrokenLink {
  url: string;
  filePath: string;
  lineNumber: number;
  error: string;
}

export function formatBrokenLinksTable(brokenLinks: BrokenLink[]): string {
  const maxUrlWidth = Math.max(...brokenLinks.map(link => link.url.length), 10);
  const maxPathWidth = Math.max(...brokenLinks.map(link => link.filePath.length), 10);
  const maxErrorWidth = Math.max(...brokenLinks.map(link => link.error.length), 10);

  const header = `| ${'URL'.padEnd(maxUrlWidth)} | ${'File Path'.padEnd(maxPathWidth)} | ${'Line'.toString().padEnd(6)} | ${'Error'.padEnd(maxErrorWidth)} |\n` +
                 `|${'-'.repeat(maxUrlWidth + 2)}|${'-'.repeat(maxPathWidth + 2)}|${'-'.repeat(8)}|${'-'.repeat(maxErrorWidth + 2)}|`;

  const rows = brokenLinks.map(link => 
    `| ${link.url.padEnd(maxUrlWidth)} | ${link.filePath.padEnd(maxPathWidth)} | ${link.lineNumber.toString().padEnd(6)} | ${link.error.padEnd(maxErrorWidth)} |`
  ).join('\n');

  return `${header}\n${rows}`;
}

export interface SkipConfig {
  skippedLinks: {
    url: string;
    statusCode?: number;
    location: LinkLocation;
    lastChecked: number;
  }[];
}

export interface SkipConfigOptions {
  configPath?: string;
  createIfMissing?: boolean;
}

export interface SkipConfigResult {
  success: boolean;
  error?: string;
  configPath: string;
}
