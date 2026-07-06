/**
 * clean.js
 *
 * Removes everything from a previous run that could cause stale/duplicate
 * results next time:
 *   - cached AI test cases (tests/.cache) — so AI-generated cases are never
 *     silently reused past when you meant to regenerate them
 *   - Playwright's own report + test-results folders
 *   - the custom minimal report (qa-report)
 *   - known LEGACY files from earlier versions of this suite that are no
 *     longer used but can linger after copying new files over old ones
 *     (unzipping only adds/overwrites — it never deletes), causing the
 *     exact "same test counted twice" bug we hit before.
 *
 * Uses Node's built-in fs.rmSync, so it works the same on Windows, macOS,
 * and Linux without any extra dependency or shell-specific syntax.
 */

const fs = require('fs')
const path = require('path')

const ROOT = path.join(__dirname, '..', '..')

function rm(relativePath) {
  const full = path.join(ROOT, relativePath)
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true })
    console.log(`  removed ${relativePath}`)
  }
}

console.log('Cleaning previous run artifacts...')
rm('tests/.cache')
rm('playwright-report')
rm('test-results')
rm('qa-report')

console.log('Checking for legacy files from older suite versions...')
rm('tests/ai-signin.spec.js')
rm('tests/ai-signup.spec.js')
rm('tests/utils/llmTestData.js')
rm('tests/utils') // only removes if now-empty is fine here since we own this folder

console.log('Clean.')
