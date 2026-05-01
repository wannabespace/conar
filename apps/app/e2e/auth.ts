import { faker } from '@faker-js/faker'
import { expect, test } from '@playwright/test'

const EMAIL = faker.internet.email()
const NAME = faker.person.fullName()
const PASSWORD = faker.internet.password()

export const testWithSignUp = test.extend({
  page: async ({ page }, use) => {
    await page.goto('/')

    await page.waitForRequest(r => r.url().includes('/auth/get-session'))
    await page.waitForTimeout(300) // Loader animation

    await page.getByText('Sign up').click()

    const emailInput = page.locator('input[name="email"]')
    expect(emailInput).toBeFocused()
    emailInput.fill(EMAIL)
    expect(emailInput).toHaveValue(EMAIL)

    await page.waitForTimeout(100)

    const nameInput = page.locator('input[name="name"]')
    expect(nameInput).toBeVisible()
    nameInput.fill(NAME)
    expect(nameInput).toHaveValue(NAME)
    await page.waitForTimeout(100)

    const passwordInput = page.locator('input[name="password"]')
    expect(passwordInput).toBeVisible()
    passwordInput.fill(PASSWORD)
    expect(passwordInput).toHaveValue(PASSWORD)
    await page.waitForTimeout(100)

    const submitButton = page.locator('button[type="submit"]')
    expect(submitButton).toContainText('Get started')
    const requestPromise = page.waitForRequest(r => r.url().includes('/auth/sign-up'))
    submitButton.click()
    await requestPromise

    await use(page)
  },
})
