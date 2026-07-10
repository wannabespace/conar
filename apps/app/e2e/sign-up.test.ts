import { expect } from '@playwright/test'
import { testWithSignUp } from './auth'

testWithSignUp('see create connection link', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Create a new connection' })).toBeVisible()
})
