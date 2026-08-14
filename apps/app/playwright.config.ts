import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  fullyParallel: true,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  reporter: [['html', { open: 'never' }]],
  testDir: './e2e',
  use: {
    baseURL: 'https://app.tamery.localhost',
    trace: 'on-first-retry',
  },
})
