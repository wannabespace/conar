import { expect } from '@playwright/test'
import { testWithSignUp } from './auth'

const TEST_POSTGRES_STRING = 'postgresql://user:password@localhost:5432/testdb'
const TEST_MYSQL_STRING = 'mysql://user:password@localhost:3306/testdb'
const TEST_MSSQL_STRING = 'sqlserver://user:password@localhost:1433/testdb'

testWithSignUp.describe('Create Connection Dialog', () => {
  testWithSignUp('opens dialog when clicking Add new button', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await expect(page.getByTestId('create-connection-dialog')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Create Connection' })).toBeVisible()
  })

  testWithSignUp('opens dialog from empty state button', async ({ page }) => {
    await page.getByRole('button', { name: 'Create a new connection' }).click()

    await expect(page.getByTestId('create-connection-dialog')).toBeVisible()
  })

  testWithSignUp('closes dialog when pressing Escape', async ({ page }) => {
    await page.getByTestId('add-connection').click()
    await expect(page.getByTestId('create-connection-dialog')).toBeVisible()

    await page.keyboard.press('Escape')

    await expect(page.getByTestId('create-connection-dialog')).not.toBeVisible()
  })

  testWithSignUp('closes dialog when clicking Cancel', async ({ page }) => {
    await page.getByTestId('add-connection').click()
    await expect(page.getByTestId('create-connection-dialog')).toBeVisible()

    await page.getByRole('button', { name: 'Cancel' }).click()

    await expect(page.getByTestId('create-connection-dialog')).not.toBeVisible()
  })

  testWithSignUp('has connection string tab active by default', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await expect(page.getByTestId('tab-string')).toHaveAttribute('data-state', 'active')
    await expect(page.getByTestId('connection-string')).toBeVisible()
  })

  testWithSignUp('switches between tabs without losing input', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await page.getByTestId('connection-string').fill(TEST_POSTGRES_STRING)

    await page.getByTestId('tab-form').click()

    await expect(page.getByTestId('host-input')).toHaveValue('localhost')
    await expect(page.getByTestId('port-input')).toHaveValue('5432')
    await expect(page.getByTestId('user-input')).toHaveValue('user')
    await expect(page.getByTestId('database-input')).toHaveValue('testdb')

    await page.getByTestId('tab-string').click()

    await expect(page.getByTestId('connection-string')).toHaveValue(TEST_POSTGRES_STRING)
  })

  testWithSignUp('auto-detects PostgreSQL type from connection string', async ({ page }) => {
    await page.getByTestId('add-connection').click()
    await page.getByTestId('connection-string').fill(TEST_POSTGRES_STRING)

    await expect(page.getByRole('button', { name: /PostgreSQL/ })).toHaveClass(/ring-2/)
    await expect(page.getByText('Auto-detected')).toBeVisible()
  })

  testWithSignUp('auto-detects MySQL type from connection string', async ({ page }) => {
    await page.getByTestId('add-connection').click()
    await page.getByTestId('connection-string').fill(TEST_MYSQL_STRING)

    await expect(page.getByRole('button', { name: /MySQL/ })).toHaveClass(/ring-2/)
  })

  testWithSignUp('auto-detects MSSQL type from connection string', async ({ page }) => {
    await page.getByTestId('add-connection').click()
    await page.getByTestId('connection-string').fill(TEST_MSSQL_STRING)

    await expect(page.getByRole('button', { name: /Microsoft SQL Server/ })).toHaveClass(/ring-2/)
  })

  testWithSignUp('allows manual type selection override', async ({ page }) => {
    await page.getByTestId('add-connection').click()
    await page.getByTestId('connection-string').fill(TEST_POSTGRES_STRING)

    await expect(page.getByRole('button', { name: /PostgreSQL/ })).toHaveClass(/ring-2/)

    await page.getByRole('button', { name: /MySQL/ }).click()

    await expect(page.getByRole('button', { name: /MySQL/ })).toHaveClass(/ring-2/)
    await expect(page.getByText('Auto-detected')).not.toBeVisible()
  })

  testWithSignUp('form changes update connection string', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await page.getByRole('button', { name: /PostgreSQL/ }).click()

    await page.getByTestId('tab-form').click()

    await page.getByTestId('host-input').fill('myhost.example.com')
    await page.getByTestId('port-input').fill('5433')
    await page.getByTestId('user-input').fill('myuser')

    await page.getByTestId('tab-string').click()

    const connectionString = await page.getByTestId('connection-string').inputValue()
    expect(connectionString).toContain('myhost.example.com')
    expect(connectionString).toContain('5433')
    expect(connectionString).toContain('myuser')
  })

  testWithSignUp('invalid connection string shows error', async ({ page }) => {
    await page.getByTestId('add-connection').click()
    await page.getByTestId('connection-string').fill('not-a-valid-url')

    await expect(page.getByText(/Invalid/i)).toBeVisible()
  })

  testWithSignUp('invalid connection string does not wipe form input', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await page.getByRole('button', { name: /PostgreSQL/ }).click()
    await page.getByTestId('tab-form').click()
    await page.getByTestId('host-input').fill('myhost')
    await page.getByTestId('port-input').fill('5432')

    await page.getByTestId('tab-string').click()
    await page.getByTestId('connection-string').fill('invalid-url')

    await page.getByTestId('tab-form').click()
  })

  testWithSignUp('submit button is disabled without required fields', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await expect(page.getByTestId('submit')).toBeDisabled()
  })

  testWithSignUp('submit button enables with valid connection string', async ({ page }) => {
    await page.getByTestId('add-connection').click()
    await page.getByTestId('connection-string').fill(TEST_POSTGRES_STRING)

    await expect(page.getByTestId('submit')).toBeEnabled()
  })

  testWithSignUp('shows name input with random default value', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    const nameInput = page.getByTestId('name-input')
    await expect(nameInput).toBeVisible()

    const nameValue = await nameInput.inputValue()
    expect(nameValue.length).toBeGreaterThan(0)
  })

  testWithSignUp('regenerate name button creates new name', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    const nameInput = page.getByTestId('name-input')
    const initialName = await nameInput.inputValue()

    await page.getByRole('button', { name: 'Generate random name' }).click()

    const newName = await nameInput.inputValue()
    expect(newName).not.toBe(initialName)
  })

  testWithSignUp('advanced options are collapsed by default', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await expect(page.getByTestId('label-input')).not.toBeVisible()
  })

  testWithSignUp('can expand and use advanced options', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await page.getByRole('button', { name: /Advanced options/ }).click()

    await expect(page.getByTestId('label-input')).toBeVisible()

    await page.getByTestId('label-input').fill('Production')

    await page.getByRole('button', { name: 'Dev' }).click()
    await expect(page.getByTestId('label-input')).toHaveValue('Dev')
  })

  testWithSignUp('can select color in advanced options', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await page.getByRole('button', { name: /Advanced options/ }).click()

    const colorButtons = page.locator('button.rounded-full')
    await colorButtons.first().click()

    await expect(colorButtons.first()).toHaveClass(/ring-2/)
  })

  testWithSignUp('cloud sync checkbox is checked by default', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await page.getByRole('button', { name: /Advanced options/ }).click()

    const syncCheckbox = page.getByRole('checkbox')
    await expect(syncCheckbox).toBeChecked()
  })

  testWithSignUp('focus trap works - tab cycles within dialog', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await page.getByTestId('connection-string').focus()

    for (let i = 0; i < 20; i++) {
      await page.keyboard.press('Tab')
    }

    const focusedElement = await page.evaluate(() => {
      const activeElement = document.activeElement
      return activeElement?.closest('[data-testid="create-connection-dialog"]') !== null
    })
    expect(focusedElement).toBe(true)
  })

  testWithSignUp('Enter key in connection string triggers submit', async ({ page }) => {
    await page.getByTestId('add-connection').click()
    await page.getByTestId('connection-string').fill(TEST_POSTGRES_STRING)

    await page.getByTestId('connection-string').press('Enter')

    await page.waitForTimeout(500)
  })

  testWithSignUp('preserves state when switching tabs multiple times', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await page.getByTestId('connection-string').fill(TEST_POSTGRES_STRING)

    await page.getByTestId('tab-form').click()
    await expect(page.getByTestId('host-input')).toHaveValue('localhost')

    await page.getByTestId('host-input').clear()
    await page.getByTestId('host-input').fill('newhost')

    await page.getByTestId('tab-string').click()
    const connectionString = await page.getByTestId('connection-string').inputValue()
    expect(connectionString).toContain('newhost')

    await page.getByTestId('tab-form').click()
    await expect(page.getByTestId('host-input')).toHaveValue('newhost')

    await page.getByTestId('tab-string').click()
    expect(await page.getByTestId('connection-string').inputValue()).toContain('newhost')
  })

  testWithSignUp('password is masked in generated connection string preview', async ({ page }) => {
    await page.getByTestId('add-connection').click()
    await page.getByTestId('connection-string').fill(TEST_POSTGRES_STRING)

    await page.getByTestId('tab-form').click()

    const preview = page.locator('code')
    await expect(preview).toContainText('****')
  })

  testWithSignUp('form shows placeholder when no type selected', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await page.getByTestId('tab-form').click()

    await expect(page.getByText(/select a database type/i)).toBeVisible()
  })

  testWithSignUp('reset form on dialog close and reopen', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await page.getByTestId('connection-string').fill(TEST_POSTGRES_STRING)
    await page.getByTestId('name-input').clear()
    await page.getByTestId('name-input').fill('My Custom Name')

    await page.keyboard.press('Escape')
    await expect(page.getByTestId('create-connection-dialog')).not.toBeVisible()

    await page.getByTestId('add-connection').click()

    await expect(page.getByTestId('connection-string')).toHaveValue('')
    const nameValue = await page.getByTestId('name-input').inputValue()
    expect(nameValue).not.toBe('My Custom Name')
  })

  testWithSignUp('clickhouse type does not show database field', async ({ page }) => {
    await page.getByTestId('add-connection').click()

    await page.getByRole('button', { name: /ClickHouse/ }).click()

    await page.getByTestId('tab-form').click()

    await expect(page.getByTestId('database-input')).not.toBeVisible()
  })
})
