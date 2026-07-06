/**
 * Pre-generates AI test cases and writes them to tests/.cache/*.json.
 *
 * Playwright loads spec files synchronously, so we can't call the Claude API
 * from inside a spec file and expect a variable number of `test()` blocks to
 * show up correctly. Instead: run this script first (it's async, calls the
 * API, writes the results to disk), then the ai-*.spec.js files read that
 * cache synchronously and declare one real test per generated case.
 *
 * Usage:
 *   GROQ_API_KEY=gsk_... node tests/scripts/generate-ai-cases.js
 *   npm run ai:generate   (same thing, via package.json script)
 *
 * If GROQ_API_KEY isn't set, or the API call fails, the spec files will
 * automatically fall back to a small static case list — so the suite never
 * breaks, it just runs fewer, non-AI-generated cases.
 */

const { generateSignupCases, generateSigninCases } = require('../utils/llmTestData')

async function main() {
  console.log('Generating sign-up test cases via Groq...')
  const signupCases = await generateSignupCases()
  console.log(`  -> ${signupCases.length} sign-up cases ready`)

  console.log('Generating sign-in test cases via Groq...')
  const signinCases = await generateSigninCases()
  console.log(`  -> ${signinCases.length} sign-in cases ready`)

  console.log('\nCached to tests/.cache/. Run `npx playwright test` to execute them.')
  console.log('Set AI_REGENERATE=true to force fresh generation next time.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
