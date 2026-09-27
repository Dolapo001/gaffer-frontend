import { defineConfig, devices } from '@playwright/test'

/**
 * UI tests against a fully local stack (see e2e/README.md):
 *  - backend: The-Gaffer--backend/__tests__/admin-e2e/playwright-server.js on
 *    :4100 — local MongoDB database gaffer_admin_e2e (dropped on start), Redis
 *    :6380, email / Cloudinary / Paystack / web-push / Google stubbed
 *  - frontend: `next dev` on :3100 with NEXT_PUBLIC_API_URL pointing at it
 * Every browser request to a non-local host is aborted (e2e/fixtures.ts).
 * Chromium only; the two phone viewports run on Chromium.
 */

const API = 'http://127.0.0.1:4100'
const APP = 'http://127.0.0.1:3100'

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/results',
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'e2e/results/report.json' }]],
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: APP,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
  },
  projects: [
    { name: 'iphone-13', use: { ...devices['iPhone 13'], browserName: 'chromium', defaultBrowserType: 'chromium' } },
    { name: 'pixel-7', use: { ...devices['Pixel 7'] } },
  ],
  webServer: [
    {
      command: 'node ../The-Gaffer--backend/__tests__/admin-e2e/playwright-server.js',
      url: `${API}/__e2e/calls`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: { E2E_BACKEND_PORT: '4100', E2E_FRONTEND_URL: APP },
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npx next dev -p 3100 -H 127.0.0.1',
      url: APP,
      reuseExistingServer: false,
      timeout: 240_000,
      env: { NEXT_PUBLIC_API_URL: API, NEXT_PUBLIC_APP_URL: APP, NEXT_PUBLIC_GOOGLE_CLIENT_ID: 'e2e-fake-google-client-id' },
      stdout: 'ignore',
      stderr: 'pipe',
    },
  ],
})
