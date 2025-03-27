import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Always load test environment variables for Playwright
dotenv.config({ path: '.env.test' });

// Test specific port to avoid conflicts with dev server
const TEST_PORT = 3001;

// Environment variables for tests
const testEnv = {
  ...process.env, // Include all existing env variables
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  NODE_ENV: 'development', // Use development mode for tests since we're using dev server
  PORT: TEST_PORT.toString(),
};

// Validate required env variables
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

requiredEnvVars.forEach(key => {
  if (!testEnv[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Set to false to avoid port conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run tests sequentially
  reporter: [
    ['html'],
    ['list'], // DOES NOT ADD CONSOLE OUTPUT BUT IT SEEMS LIKE IT SHOULD
    ['line']  // DOES NOT ADD CONSOLE OUTPUT BUT IT SEEMS LIKE IT SHOULD
  ],
  use: {
    baseURL: `http://localhost:${TEST_PORT}`,
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `pnpm dev --port ${TEST_PORT}`,
    port: TEST_PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: testEnv,
    stdout: 'pipe',
    stderr: 'pipe',
  },
}); 