/**
 * run-qa.js
 *
 * One command for the whole test workflow:
 *   1. Clean stale cache/report/legacy files (tests/scripts/clean.js)
 *   2. Force-regenerate AI test cases fresh from Groq (ignores any old cache)
 *   3. Run the full Playwright suite
 *
 * Usage:
 *   npm run qa            (headless)
 *   npm run qa -- --headed
 *
 * This is the only command you should need day-to-day. `npm run ai:generate`
 * and `npx playwright test` on their own still work individually if you want
 * finer control (e.g. re-running tests without hitting the API again).
 */

const { execSync } = require('child_process')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')
const headed = process.argv.includes('--headed')

function run(cmd, extraEnv = {}) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit', env: { ...process.env, ...extraEnv } })
}

try {
  console.log('== 1/3 Cleaning previous run ==')
  run('node tests/scripts/clean.js')

  console.log('\n== 2/3 Generating fresh AI test cases ==')
  run('node tests/scripts/generate-ai-cases.js', { AI_REGENERATE: 'true' })

  console.log('\n== 3/3 Running Playwright tests ==')
  run(`npx playwright test${headed ? ' --headed' : ''}`)

  console.log('\nAll done.')
  console.log('  Minimal report: qa-report/index.html')
  console.log('  Official report: npx playwright show-report')
} catch (err) {
  // execSync throws when the underlying command exits non-zero (e.g. test
  // failures). Still tell the user where to look instead of just a stack trace.
  console.log('\nqa run finished with failures — see output above.')
  console.log('  Minimal report: qa-report/index.html')
  console.log('  Official report: npx playwright show-report')
  process.exit(1)
}
