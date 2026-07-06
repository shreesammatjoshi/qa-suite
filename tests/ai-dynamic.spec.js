const { test, expect } = require('@playwright/test')
const formSpecs = require('./ai/formSpecs')
const { loadCasesForSpec } = require('./ai/aiCaseEngine')

// One generic test body works for every form, because it only ever reads
// field/testId/errorTestId out of the spec — it never hardcodes a field name.
for (const spec of formSpecs) {
  const cases = loadCasesForSpec(spec)

  test.describe(`${spec.label} — AI-generated cases`, () => {
    for (const testCase of cases) {
      test(testCase.label, async ({ page }) => {
        await page.goto(spec.url)

        for (const field of spec.fields) {
          const value = testCase[field.name]
          if (value === undefined || value === null || value === '') continue

          const locator = page.getByTestId(field.testId)
          if (field.kind === 'checkbox') {
            if (value) await locator.check()
          } else {
            await locator.fill(String(value))
          }
        }

        await page.getByTestId(spec.submitTestId).click()

        const expected = testCase.expectedErrors || {}
        for (const field of spec.fields) {
          const errorLocator = page.getByTestId(field.errorTestId)
          if (expected[field.name]) {
            await expect(errorLocator).toHaveText(expected[field.name])
          } else {
            await expect(errorLocator).toHaveCount(0)
          }
        }
      })
    }
  })
}
