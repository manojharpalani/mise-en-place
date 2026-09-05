import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config for the Mise en Place UX suite.
 *
 * Assumes `npm run dev` is already running on http://localhost:3000 against
 * a database that has been seeded via `npm run db:seed`. We do not start the
 * dev server automatically (webServer) because Next dev + Turbopack's cache
 * can get into a bad state if started/stopped repeatedly by a test runner,
 * and because the app depends on a real Postgres connection the test runner
 * has no way to provision. See docs/TEST_PLAN.md for the full rationale and
 * how to run.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // demo accounts are shared/global state; avoid cross-test races
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 30_000,
  expect: { timeout: 8_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
