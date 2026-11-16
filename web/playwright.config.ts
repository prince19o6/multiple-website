import { defineConfig, devices } from '@playwright/test';

/**
 * web/playwright.config.ts
 *
 * Playwright End-to-End Test Suite Configuration.
 * Runs tests across all 3 multi-tenant websites:
 * - GujjuTours (port 3000, SITE_ID=gujjutours)
 * - TripGoAsia (port 3000, SITE_ID=tripgoasia)
 * - Technoheaven (port 3000, SITE_ID=technoheaven)
 */

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'gujjutours-desktop',
      use: {
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'X-Website-Hostname': 'www.gujjutours.com',
        },
      },
    },
    {
      name: 'tripgoasia-desktop',
      use: {
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'X-Website-Hostname': 'www.tripgoasia.com',
        },
      },
    },
    {
      name: 'technoheaven-desktop',
      use: {
        ...devices['Desktop Chrome'],
        extraHTTPHeaders: {
          'X-Website-Hostname': 'stagingb2b.technoheaven.com',
        },
      },
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 14'],
        extraHTTPHeaders: {
          'X-Website-Hostname': 'www.gujjutours.com',
        },
      },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});

