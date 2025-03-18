import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { LinkInfo, SkipConfig, SkipConfigOptions, SkipConfigResult, ValidationResult } from './types';

const DEFAULT_CONFIG_PATH = 'link-checker-skip.json';

export function loadSkipConfig(options: SkipConfigOptions = {}): SkipConfig {
  const configPath = options.configPath || DEFAULT_CONFIG_PATH;
  const absolutePath = resolve(process.cwd(), configPath);

  try {
    if (!existsSync(absolutePath)) {
      if (options.createIfMissing) {
        const defaultConfig: SkipConfig = { lastChecked: '', skipUrls: {} };
        saveSkipConfig(defaultConfig, { configPath });
        return defaultConfig;
      }
      return { lastChecked: '', skipUrls: {} };
    }

    const content = readFileSync(absolutePath, 'utf8');
    const config = JSON.parse(content) as SkipConfig;
    return config;
  } catch (error) {
    console.error(`Error loading skip config from ${absolutePath}:`, error);
    return { lastChecked: '', skipUrls: {} };
  }
}

export function saveSkipConfig(config: SkipConfig, options: SkipConfigOptions = {}): SkipConfigResult {
  const configPath = options.configPath || DEFAULT_CONFIG_PATH;
  const absolutePath = resolve(process.cwd(), configPath);

  try {
    // Ensure directory exists
    const dir = dirname(absolutePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Write config file
    writeFileSync(absolutePath, JSON.stringify(config, null, 2), 'utf8');

    // Verify write was successful
    if (existsSync(absolutePath)) {
      const content = readFileSync(absolutePath, 'utf8');
      const parsed = JSON.parse(content);
      if (JSON.stringify(parsed) === JSON.stringify(config)) {
        return {
          success: true,
          configPath: absolutePath
        };
      }
    }

    return {
      success: false,
      error: 'Failed to verify config file after write',
      configPath: absolutePath
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      configPath: absolutePath
    };
  }
}

export function shouldSkipUrl(url: string, config: SkipConfig): boolean {
  const skipInfo = config.skipUrls[url];
  if (!skipInfo) {
    return false;
  }

  const lastChecked = new Date(skipInfo.lastChecked);
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  return lastChecked > oneDayAgo;
}

export function updateSkipConfig(results: LinkInfo[]): SkipConfig {
  const now = new Date().toISOString();
  const skipUrls: SkipConfig['skipUrls'] = {};

  results
    .filter(result => result.validationResult && !result.validationResult.isValid)
    .forEach(result => {
      skipUrls[result.url] = {
        lastChecked: now,
        statusCode: result.validationResult?.statusCode,
        error: result.validationResult?.error
      };
    });

  return {
    lastChecked: now,
    skipUrls
  };
} 