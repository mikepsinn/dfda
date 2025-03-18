import { promises as fs } from 'fs';
import path from 'path';
import { LinkInfo, Config, LinkStatus } from './types';

const DEFAULT_CONFIG_PATH = '.link-checker.json';
const DEFAULT_CONFIG: Config = {
  version: '1.0',
  lastUpdated: new Date().toISOString(),
  successfulLinks: {},
  failedLinks: {}
};

export async function loadConfig(configPath: string): Promise<Config> {
  try {
    const content = await fs.readFile(configPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return { ...DEFAULT_CONFIG };
  }
}

export async function saveConfig(config: Config, configPath: string): Promise<void> {
  const updatedConfig = {
    ...config,
    lastUpdated: new Date().toISOString()
  };
  await fs.writeFile(configPath, JSON.stringify(updatedConfig, null, 2));
}

export async function updateLinkStatus(
  config: Config,
  url: string,
  location: string,
  isValid: boolean,
  error?: string
): Promise<void> {
  const now = new Date().toISOString();

  if (isValid) {
    // Remove from failed links if it was previously there
    delete config.failedLinks[url];

    // Update successful links
    if (!config.successfulLinks[url]) {
      config.successfulLinks[url] = {
        lastChecked: now,
        locations: []
      };
    }
    if (!config.successfulLinks[url].locations.includes(location)) {
      config.successfulLinks[url].locations.push(location);
    }
    config.successfulLinks[url].lastChecked = now;
  } else {
    // Remove from successful links if it was previously there
    delete config.successfulLinks[url];

    // Update failed links
    if (!config.failedLinks[url]) {
      config.failedLinks[url] = {
        lastChecked: now,
        error: error || 'Unknown error',
        locations: []
      };
    }
    if (!config.failedLinks[url].locations.includes(location)) {
      config.failedLinks[url].locations.push(location);
    }
    config.failedLinks[url].lastChecked = now;
    if (error) {
      config.failedLinks[url].error = error;
    }
  }
}

export async function cleanupConfig(config: Config): Promise<void> {
  // Remove links that no longer exist in any location
  for (const url of Object.keys(config.successfulLinks)) {
    if (config.successfulLinks[url].locations.length === 0) {
      delete config.successfulLinks[url];
    }
  }

  for (const url of Object.keys(config.failedLinks)) {
    if (config.failedLinks[url].locations.length === 0) {
      delete config.failedLinks[url];
    }
  }
} 