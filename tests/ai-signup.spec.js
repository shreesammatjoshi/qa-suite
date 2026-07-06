const { test, expect } = require('@playwright/test')
const { loadCachedOrFallback } = require('./utils/llmTestData')

// Loaded synchronously so Playwright sees a real, individual test() per case
// in the report — not one giant loop. Run `npm run ai:generate` beforehand
// to refresh these from Claude; otherwise a small static fallback set is used.
const cases = loadCachedOrFallback('signup')

const fieldTestIds = {
  fullName: 'signup-name-error',
  email: 'signup-email-error',
  password: 'signup-password-error',
  confirmPassword: 'signup-confirm-error',
  agreeTerms: 'signup-terms-error',
}

test.describe('Sign up page — AI-generated cases', () => {
  for (const testCase of cases) {
    test(testCase.label, async ({ page }) => {
      await page.goto('/signup')

      if (testCase.fullName) await page.getByTestId('signup-name-input').fill(testCase.fullName)
      if (testCase.email) await page.getByTestId('signup-email-input').fill(testCase.email)
      if (testCase.password) await page.getByTestId('signup-password-input').fill(testCase.password)
      if (testCase.confirmPassword)
        await page.getByTestId('signup-confirm-input').fill(testCase.confirmPassword)
      if (testCase.agreeTerms) await page.getByTestId('signup-terms-checkbox').check()

      await page.getByTestId('signup-submit-btn').click()

      const expected = testCase.expectedErrors || {}

      for (const [field, testId] of Object.entries(fieldTestIds)) {
        const locator = page.getByTestId(testId)
        if (expected[field]) {
          await expect(locator).toHaveText(expected[field])
        } else {
          await expect(locator).toHaveCount(0)
        }
      }
    })
  }
})
