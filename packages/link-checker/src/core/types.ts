/**
 * Represents the location of a link within a file
 */
export interface Location {
  filePath: string;
  lineNumber: number;
  columnNumber: number;
}

/**
 * Represents the validation result of a link
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  checkedAt: Date;
}

/**
 * Represents information about a discovered link
 */
export interface LinkInfo {
  url: string;
  location: Location;
  validationResult?: ValidationResult;
  error?: string;
}

/**
 * Represents a link status in the configuration
 */
export interface LinkStatus {
  lastChecked: string;
  locations: string[];
  error?: string;
}

/**
 * Represents the configuration file structure
 */
export interface Config {
  version: string;
  lastUpdated: string;
  successfulLinks: Record<string, Omit<LinkStatus, 'error'>>;
  failedLinks: Record<string, LinkStatus>;
}

/**
 * Represents the result of a link scanning operation
 */
export interface ScanResult {
  valid: LinkInfo[];
  invalid: LinkInfo[];
}

/**
 * Options for scanning links
 */
export interface ScanOptions {
  /** Working directory for resolving relative paths */
  cwd?: string;
  /** Glob patterns to exclude */
  exclude?: string[];
  /** Whether to check if external links are live */
  checkLiveLinks?: boolean;
  configPath?: string;
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

/**
 * Configuration for skipping URLs
 */
export interface SkipConfig {
  links: LinkInfo[];
}

/**
 * Options for skip configuration
 */
export interface SkipConfigOptions {
  configPath?: string;
  createIfMissing?: boolean;
}

export interface SkipConfigResult {
  success: boolean;
  error?: string;
  configPath: string;
}

export interface LinkLocation {
  filePath: string;
  lineNumber: number;
  columnNumber: number;
}
