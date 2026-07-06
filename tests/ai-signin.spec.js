const { test, expect } = require('@playwright/test')
const { loadCachedOrFallback } = require('./utils/llmTestData')

// AI-generated NEGATIVE/edge cases only — the real valid-login happy path
// stays hardcoded in signin.spec.js on purpose (see that file).
const cases = loadCachedOrFallback('signin')

test.describe('Sign in page — AI-generated edge cases', () => {
  for (const testCase of cases) {
    test(testCase.label, async ({ page }) => {
      await page.goto('/signin')

      if (testCase.email) await page.getByTestId('signin-email-input').fill(testCase.email)
      if (testCase.password) await page.getByTestId('signin-password-input').fill(testCase.password)

      await page.getByTestId('signin-submit-btn').click()

      const expected = testCase.expectedErrors || {}

      const emailError = page.getByTestId('signin-email-error')
      if (expected.email) {
        await expect(emailError).toHaveText(expected.email)
      } else {
        await expect(emailError).toHaveCount(0)
      }

      const passwordError = page.getByTestId('signin-password-error')
      if (expected.password) {
        await expect(passwordError).toHaveText(expected.password)
      } else {
        await expect(passwordError).toHaveCount(0)
      }
    })
  }
})
