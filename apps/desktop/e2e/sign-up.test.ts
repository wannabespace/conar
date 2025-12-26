import { expect } from '@playwright/test'
import { testWithSignUp } from './auth'

testWithSignUp('see create connection button', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Create a new connection' })).toBeVisible()
})
