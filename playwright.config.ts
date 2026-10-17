import { defineConfig, devices } from '@playwright/test'

const PORT = '4417'
const LAYOUT_SPEC = /layout\.spec\.ts/

export default defineConfig({
  testDir: './e2e',
  testIgnore: /visual\.spec\.ts/,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI
    ? [
        ['html', { open: 'never' }],
        ['json', { outputFile: 'test-results/report.json' }],
      ]
    : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}` },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'webkit',
      testMatch: LAYOUT_SPEC,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'firefox',
      testMatch: LAYOUT_SPEC,
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  webServer: {
    command: `bun run preview --host 127.0.0.1 --port ${PORT} --ignore-lock`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
