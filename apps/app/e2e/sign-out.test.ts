import { expect } from '@playwright/test'
import { testWithSignUp } from './auth'

testWithSignUp('sign out', async ({ page }) => {
  const signOutButton = page.getByRole('button', { name: 'Sign out' })
  await expect(signOutButton).toBeVisible()

  const requestPromise = page.waitForRequest(r => r.url().includes('/auth/sign-out'))
  await signOutButton.click()
  await requestPromise

  const signInButton = page.locator('button[type="submit"]')
  expect(signInButton).toContainText('Sign in')

  await expect(signInButton).toBeVisible()
})
