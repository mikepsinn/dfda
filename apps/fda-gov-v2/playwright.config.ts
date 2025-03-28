import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

// Always load test environment variables for Playwright
dotenv.config({ path: '.env.test' });

// Test specific port to avoid conflicts with dev server
const TEST_PORT = 3001;

// Environment variables for tests
const testEnv = Object.entries({
  ...process.env, // Include all existing env variables
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  NODE_ENV: 'development', // Use development mode for tests since we're using dev server
  PORT: TEST_PORT.toString(),
}).reduce((acc, [key, value]) => {
  // Only include defined values and convert them to strings
  if (value !== undefined) {
    acc[key] = String(value);
  }
  return acc;
}, {} as Record<string, string>);

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
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/e2e-setup.ts',
  /* Maximum time one test can run for */
  timeout: 60000,
  /* Maximum time for globalSetup */
  globalTimeout: 600000,
  /* Maximum number of failures before stopping */
  maxFailures: process.env.CI ? 10 : 1,
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Reporter configuration */
  reporter: [['html', { open: 'never' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: `http://127.0.0.1:${TEST_PORT}`,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  /* Run your local dev server before starting the tests */
  webServer: {
    command: `pnpm dev --port ${TEST_PORT}`,
    //port: TEST_PORT, Can only specify one of port or url
    url: `http://127.0.0.1:${TEST_PORT}`,
    //reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: testEnv,
    stdout: 'pipe',
    stderr: 'pipe',
  },
}); 