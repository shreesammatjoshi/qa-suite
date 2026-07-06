const { test, expect } = require('@playwright/test')
const { validUser, invalidUser } = require('./fixtures/credentials')

test.describe('Sign in page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin')
  })

  test('renders the sign in form', async ({ page }) => {
    await expect(page.getByTestId('signin-card')).toBeVisible()
    await expect(page.getByTestId('signin-email-input')).toBeVisible()
    await expect(page.getByTestId('signin-password-input')).toBeVisible()
    await expect(page.getByTestId('signin-submit-btn')).toBeVisible()
  })

  test('shows required errors on empty submit', async ({ page }) => {
    await page.getByTestId('signin-submit-btn').click()
    await expect(page.getByTestId('signin-email-error')).toHaveText('Email is required')
    await expect(page.getByTestId('signin-password-error')).toHaveText('Password is required')
  })

  test('rejects a malformed email', async ({ page }) => {
    await page.getByTestId('signin-email-input').fill('not-an-email')
    await page.getByTestId('signin-password-input').fill('somepassword')
    await page.getByTestId('signin-submit-btn').click()
    await expect(page.getByTestId('signin-email-error')).toHaveText('Enter a valid email address')
  })

  test('rejects a short password', async ({ page }) => {
    await page.getByTestId('signin-email-input').fill(validUser.email)
    await page.getByTestId('signin-password-input').fill('short')
    await page.getByTestId('signin-submit-btn').click()
    await expect(page.getByTestId('signin-password-error')).toHaveText(
      'Password must be at least 8 characters',
    )
  })

  test('rejects valid-shaped but incorrect credentials', async ({ page }) => {
    await page.getByTestId('signin-email-input').fill(invalidUser.email)
    await page.getByTestId('signin-password-input').fill(invalidUser.password)
    await page.getByTestId('signin-submit-btn').click()
    await expect(page.getByTestId('signin-banner')).toHaveText('Invalid email or password.')
  })

  test('signs in successfully with valid credentials', async ({ page }) => {
    await page.getByTestId('signin-email-input').fill(validUser.email)
    await page.getByTestId('signin-password-input').fill(validUser.password)
    await page.getByTestId('signin-submit-btn').click()
    await expect(page.getByTestId('signin-banner')).toHaveText('Signed in successfully.')
  })

  test('toggles the remember me checkbox', async ({ page }) => {
    const checkbox = page.getByTestId('signin-remember-checkbox')
    await expect(checkbox).not.toBeChecked()
    await checkbox.check()
    await expect(checkbox).toBeChecked()
  })

  test('clears the email error once corrected', async ({ page }) => {
    await page.getByTestId('signin-submit-btn').click()
    await expect(page.getByTestId('signin-email-error')).toBeVisible()
    await page.getByTestId('signin-email-input').fill(validUser.email)
    await page.getByTestId('signin-password-input').fill(validUser.password)
    await page.getByTestId('signin-submit-btn').click()
    await expect(page.getByTestId('signin-email-error')).toHaveCount(0)
  })

  test('navigates to the sign up page', async ({ page }) => {
    await page.getByRole('link', { name: 'Create one' }).click()
    await expect(page).toHaveURL(/\/signup$/)
  })

  test('disables the submit button while submitting', async ({ page }) => {
    await page.getByTestId('signin-email-input').fill(validUser.email)
    await page.getByTestId('signin-password-input').fill(validUser.password)
    const btn = page.getByTestId('signin-submit-btn')
    await btn.click()
    await expect(btn).toBeDisabled()
    await expect(page.getByTestId('signin-banner')).toBeVisible()
  })
})
