import { PORTS } from '@conar/shared/constants'
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORTS.TEST.DESKTOP}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
