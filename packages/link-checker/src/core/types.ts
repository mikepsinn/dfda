export interface LinkLocation {
  filePath: string;
  lineNumber: number;
  columnNumber: number;
}

export interface LinkInfo {
  url: string;
  filePath: string;
  lineNumber: number;
  validationResult?: ValidationResult;
}

export interface ScanOptions {
  /** Working directory for resolving relative paths */
  cwd?: string;
  /** Glob patterns to exclude */
  exclude?: string[];
  /** Whether to check if external links are live */
  checkLiveLinks?: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  statusCode?: number;
  error?: string;
}

export interface BrokenLink {
  url: string;
  filePath: string;
  lineNumber: number;
  error: string;
}

export function formatBrokenLinksTable(links: BrokenLink[]): string {
  if (links.length === 0) return 'No broken links found!';

  const table = ['File | Line | URL | Error', '-----|------|-----|-------'];

  links.forEach(link => {
    table.push(`${link.filePath} | ${link.lineNumber} | ${link.url} | ${link.error}`);
  });

  return table.join('\n');
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
