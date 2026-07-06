const { test, expect } = require('@playwright/test')

const goodForm = {
  fullName: 'Priya Sharma',
  email: 'priya.sharma@testsuite.dev',
  password: 'Str0ngPass',
}

test.describe('Sign up page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup')
  })

  test('renders the sign up form', async ({ page }) => {
    await expect(page.getByTestId('signup-card')).toBeVisible()
    await expect(page.getByTestId('signup-name-input')).toBeVisible()
    await expect(page.getByTestId('signup-email-input')).toBeVisible()
    await expect(page.getByTestId('signup-password-input')).toBeVisible()
    await expect(page.getByTestId('signup-confirm-input')).toBeVisible()
  })

  test('shows all required errors on empty submit', async ({ page }) => {
    await page.getByTestId('signup-submit-btn').click()
    await expect(page.getByTestId('signup-name-error')).toHaveText('Full name is required')
    await expect(page.getByTestId('signup-email-error')).toHaveText('Email is required')
    await expect(page.getByTestId('signup-password-error')).toHaveText('Password is required')
    await expect(page.getByTestId('signup-confirm-error')).toHaveText('Please confirm your password')
    await expect(page.getByTestId('signup-terms-error')).toHaveText('You must accept the terms')
  })

  test('rejects a name that is too short', async ({ page }) => {
    await page.getByTestId('signup-name-input').fill('A')
    await page.getByTestId('signup-submit-btn').click()
    await expect(page.getByTestId('signup-name-error')).toHaveText('Full name is too short')
  })

  test('rejects a malformed email', async ({ page }) => {
    await page.getByTestId('signup-email-input').fill('bad-email')
    await page.getByTestId('signup-submit-btn').click()
    await expect(page.getByTestId('signup-email-error')).toHaveText('Enter a valid email address')
  })

  test('rejects a weak password', async ({ page }) => {
    await page.getByTestId('signup-password-input').fill('weak')
    await page.getByTestId('signup-submit-btn').click()
    await expect(page.getByTestId('signup-password-error')).toHaveText(
      'Password needs 8+ chars, upper, lower and a number',
    )
  })

  test('rejects mismatched password confirmation', async ({ page }) => {
    await page.getByTestId('signup-password-input').fill(goodForm.password)
    await page.getByTestId('signup-confirm-input').fill('Different1')
    await page.getByTestId('signup-submit-btn').click()
    await expect(page.getByTestId('signup-confirm-error')).toHaveText('Passwords do not match')
  })

  test('requires terms acceptance even with valid fields', async ({ page }) => {
    await page.getByTestId('signup-name-input').fill(goodForm.fullName)
    await page.getByTestId('signup-email-input').fill(goodForm.email)
    await page.getByTestId('signup-password-input').fill(goodForm.password)
    await page.getByTestId('signup-confirm-input').fill(goodForm.password)
    await page.getByTestId('signup-submit-btn').click()
    await expect(page.getByTestId('signup-terms-error')).toHaveText('You must accept the terms')
  })

  test('creates an account successfully with valid data', async ({ page }) => {
    await page.getByTestId('signup-name-input').fill(goodForm.fullName)
    await page.getByTestId('signup-email-input').fill(goodForm.email)
    await page.getByTestId('signup-password-input').fill(goodForm.password)
    await page.getByTestId('signup-confirm-input').fill(goodForm.password)
    await page.getByTestId('signup-terms-checkbox').check()
    await page.getByTestId('signup-submit-btn').click()
    await expect(page.getByTestId('signup-banner')).toHaveText(
      `Account created for ${goodForm.email}.`,
    )
  })

  test('resets the form after a successful submission', async ({ page }) => {
    await page.getByTestId('signup-name-input').fill(goodForm.fullName)
    await page.getByTestId('signup-email-input').fill(goodForm.email)
    await page.getByTestId('signup-password-input').fill(goodForm.password)
    await page.getByTestId('signup-confirm-input').fill(goodForm.password)
    await page.getByTestId('signup-terms-checkbox').check()
    await page.getByTestId('signup-submit-btn').click()
    await expect(page.getByTestId('signup-banner')).toBeVisible()
    await expect(page.getByTestId('signup-name-input')).toHaveValue('')
  })

  test('navigates back to sign in page', async ({ page }) => {
    await page.getByRole('link', { name: 'Sign in' }).click()
    await expect(page).toHaveURL(/\/signin$/)
  })
})
