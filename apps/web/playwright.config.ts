import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

/**
 * Browser tests (tests/e2e). The database must have the schema and the demo
 * data: `pnpm db:plain:setup`, then `pnpm db:seed:demo`.
 *
 * - With E2E_BASE_URL, the tests use the app that runs at that address. CI
 *   starts a production build (see .github/workflows/ci.yml).
 * - Without it, Playwright starts `pnpm dev` on port 3001 with the settings in
 *   the environment and in .env.test.
 * - CHROMIUM_PATH: a Chromium to use instead of the one that
 *   `pnpm exec playwright install chromium` downloads.
 * - DEMO_VIDEO=1: the tour (tests/e2e/tour.test.ts) records the demo videos,
 *   slowly enough to follow (`pnpm demo:video`).
 */
dotenv.config({ path: '.env.test' })

const TEST_PORT = 3001
const appUrl = process.env.E2E_BASE_URL
const baseURL = appUrl ?? `http://localhost:${TEST_PORT}`

if (!appUrl) {
  for (const key of ['DATABASE_URL', 'BETTER_AUTH_SECRET']) {
    if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`)
  }
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
      ...(process.env.DEMO_VIDEO === '1' ? { slowMo: 150 } : {}),
    },
  },
  projects: [
    // Signs in the demo accounts once; the sign-in endpoint allows only a few requests at a time.
    { name: 'sign-in', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['sign-in'],
    },
  ],
  webServer: appUrl
    ? undefined
    : {
        command: `pnpm dev --port ${TEST_PORT}`,
        url: baseURL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        stdout: 'pipe',
        stderr: 'pipe',
      },
})
