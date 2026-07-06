/**
 * aiCaseEngine.js
 *
 * Generic engine: takes ANY form spec from formSpecs.js and generates
 * diverse test cases for it via the Groq API. Nothing in this file knows
 * about "signup" or "signin" specifically — it only knows the shape of a
 * form spec (fields + rules). Adding a new frontend to this suite means
 * adding a new spec object, not touching this file.
 *
 * The LLM's job stays narrow: propose varied inputs and say which field(s)
 * should error and with what exact message. The test itself still asserts
 * against the real rendered UI, so a wrong or hallucinated case simply
 * fails loudly instead of silently passing.
 */

const fs = require('fs')
const path = require('path')

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'
const CACHE_DIR = path.join(__dirname, '..', '.cache')

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function cacheFile(specKey) {
  return path.join(CACHE_DIR, `${specKey}-cases.json`)
}

function readCache(specKey) {
  if (process.env.AI_REGENERATE === 'true') return null
  const file = cacheFile(specKey)
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    return null
  }
}

function writeCache(specKey, data) {
  ensureCacheDir()
  fs.writeFileSync(cacheFile(specKey), JSON.stringify(data, null, 2))
}

async function callLLM(prompt) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY is not set')

  const res = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Groq API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()
  return JSON.parse(cleaned)
}

/** Builds the generation prompt from a form spec's field list — no hardcoded field names. */
function buildPrompt(spec) {
  const fieldRules = spec.fields
    .map((f, i) => `${i + 1}. ${f.name} (${f.kind}): ${f.rules}`)
    .join('\n')

  const shapeFields = spec.fields
    .map((f) => `  "${f.name}": ${f.kind === 'checkbox' ? 'true or false' : '"..."'}`)
    .join(',\n')

  const negativeNote = spec.negativeOnly
    ? '\nThis is a NEGATIVE/EDGE-CASE-ONLY form: every case you generate must be expected to FAIL at least one validation rule. Do not generate a fully valid case.'
    : '\nInclude a mix, including at least one fully valid case with no expected errors.'

  return `You are generating test cases for a web form's client-side validation.

Form: ${spec.label}

Rules the form enforces, one per field (only the first failing rule per field matters — each field shows at most one error):
${fieldRules}
${negativeNote}

Generate 6 to 8 diverse, realistic test cases as a JSON array. Include boundary values, unicode text where a text field allows it, subtly malformed values, and (per the note above) whatever mix of valid/invalid is appropriate. Make it feel like a QA engineer's actual test ideas, not repetitive filler.

Respond with ONLY a raw JSON array (no markdown fences, no prose). Each item must have exactly this shape:
{
  "label": "short human description of what this case tests",
${shapeFields},
  "expectedErrors": {
    // only include keys for fields that SHOULD show an error, with the EXACT error string from the rules above.
    // omit keys for fields that should NOT show an error.
  }
}`
}

/** Generates (or returns cached) cases for one form spec. Falls back to spec.fallbackCases on any failure. */
async function generateCasesForSpec(spec) {
  const cached = readCache(spec.key)
  if (cached) return cached

  try {
    const prompt = buildPrompt(spec)
    const cases = await callLLM(prompt)
    if (!Array.isArray(cases) || cases.length === 0) {
      throw new Error('LLM returned no usable cases')
    }
    writeCache(spec.key, cases)
    return cases
  } catch (err) {
    console.warn(`[aiCaseEngine] "${spec.label}": falling back to static cases (${err.message})`)
    return spec.fallbackCases || []
  }
}

/** Synchronous load for spec files — reads cache if present, else the spec's static fallback. */
function loadCasesForSpec(spec) {
  const cached = readCache(spec.key)
  if (cached) return cached
  return spec.fallbackCases || []
}

module.exports = { generateCasesForSpec, loadCasesForSpec }
