/**
 * Pre-generates AI test cases for every form in tests/ai/formSpecs.js and
 * writes them to tests/.cache/*.json.
 *
 * Playwright loads spec files synchronously, so we can't call the LLM from
 * inside a spec file and expect a variable number of `test()` blocks to show
 * up correctly. Instead: run this script first (async, calls Groq, writes
 * results to disk), then tests/ai-dynamic.spec.js reads that cache
 * synchronously and declares one real test per generated case, per form.
 *
 * Usage:
 *   GROQ_API_KEY=gsk_... node tests/scripts/generate-ai-cases.js
 *   npm run ai:generate   (same thing, via package.json script)
 *
 * To point this at a NEW frontend: add an entry to tests/ai/formSpecs.js
 * describing its fields and rules. Nothing here needs to change.
 */

const formSpecs = require('../ai/formSpecs')
const { generateCasesForSpec } = require('../ai/aiCaseEngine')

async function main() {
  for (const spec of formSpecs) {
    console.log(`Generating cases for "${spec.label}" via Groq...`)
    const cases = await generateCasesForSpec(spec)
    console.log(`  -> ${cases.length} cases ready`)
  }

  console.log('\nCached to tests/.cache/. Run `npx playwright test` to execute them.')
  console.log('Set AI_REGENERATE=true to force fresh generation next time.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
