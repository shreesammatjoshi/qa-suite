/**
 * llmTestData.js
 *
 * Calls the Groq API (Llama 3.3 70B, free tier) to generate diverse, realistic
 * test cases for a form, given an explicit description of that form's
 * validation rules.
 *
 * The LLM's job is narrow and checkable: propose varied inputs (including
 * edge cases a human might not think to type) and say which field it expects
 * to fail validation, and why. The actual pass/fail judgement in the test
 * still comes from asserting against the real UI — the LLM only decides
 * *what to try*, never *whether the app behaved correctly*. That keeps the
 * suite deterministic instead of flaky.
 *
 * Results are cached to tests/.cache so you're not hitting the API (and
 * burning your free-tier quota) on every single run. Delete the cache file,
 * or set AI_REGENERATE=true, to force fresh generation.
 */

const fs = require('fs')
const path = require('path')

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'
const CACHE_DIR = path.join(__dirname, '..', '.cache')

// Static fallback used when no API key is configured, or the API call fails,
// so `npm test` still works out of the box without any setup.
const FALLBACK_SIGNUP_CASES = [
  {
    label: 'fallback: empty full name',
    fullName: '',
    email: 'fallback.user@example.com',
    password: 'Fallback1pw',
    confirmPassword: 'Fallback1pw',
    agreeTerms: true,
    expectedErrors: { fullName: 'Full name is required' },
  },
  {
    label: 'fallback: password missing a number',
    fullName: 'Fallback Person',
    email: 'fallback2@example.com',
    password: 'NoDigitsHere',
    confirmPassword: 'NoDigitsHere',
    agreeTerms: true,
    expectedErrors: { password: 'Password needs 8+ chars, upper, lower and a number' },
  },
]

const FALLBACK_SIGNIN_CASES = [
  {
    label: 'fallback: email missing domain',
    email: 'fallback@',
    password: 'somepassword123',
    expectedErrors: { email: 'Enter a valid email address' },
  },
]

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function readCache(cacheKey) {
  const file = path.join(CACHE_DIR, `${cacheKey}.json`)
  if (process.env.AI_REGENERATE === 'true') return null
  if (!fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
  } catch {
    return null
  }
}

function writeCache(cacheKey, data) {
  ensureCacheDir()
  const file = path.join(CACHE_DIR, `${cacheKey}.json`)
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

async function callLLM(prompt) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set')
  }

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

const SIGNUP_RULES_PROMPT = `You are generating test cases for a sign-up form's client-side validation.

Rules the form enforces, in order:
1. fullName: required (after trimming whitespace); error "Full name is required". If present but shorter than 2 characters (trimmed), error "Full name is too short".
2. email: required; error "Email is required". If present but does not match the shape local@domain.tld (regex: /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/), error "Enter a valid email address".
3. password: required; error "Password is required". If present but does not match /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$/ (needs a lowercase letter, an uppercase letter, a digit, and at least 8 characters total), error "Password needs 8+ chars, upper, lower and a number".
4. confirmPassword: required; error "Please confirm your password". If present but does not exactly equal password, error "Passwords do not match".
5. agreeTerms: must be true; error "You must accept the terms".

Only the FIRST failing rule per field matters (each field shows at most one error, evaluated in the order above). Multiple fields can each show their own error simultaneously.

Generate 8 diverse, interesting test cases as a JSON array. Include a real mix: some with unicode names, some with boundary-length passwords (exactly 8 chars, 7 chars), some with subtly malformed emails (double dots, missing TLD, trailing space), some fully valid, some with multiple simultaneous field errors. Make the inputs feel like realistic things a QA engineer would think to try, not repetitive.

Respond with ONLY a raw JSON array (no markdown fences, no prose) where each item has this exact shape:
{
  "label": "short human description of what this case tests",
  "fullName": "...",
  "email": "...",
  "password": "...",
  "confirmPassword": "...",
  "agreeTerms": true or false,
  "expectedErrors": {
    // only include keys for fields that SHOULD show an error, with the exact error string from the rules above.
    // omit keys for fields that should NOT show an error.
  }
}`

const SIGNIN_RULES_PROMPT = `You are generating NEGATIVE/EDGE test cases for a sign-in form's client-side validation. Do NOT generate a case that would be treated as the real valid account — only generate cases that are expected to fail client-side validation (never ones expected to succeed).

Rules the form enforces:
1. email: required; error "Email is required". If present but does not match /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, error "Enter a valid email address".
2. password: required; error "Password is required". If present but shorter than 8 characters, error "Password must be at least 8 characters".

Generate 6 diverse edge cases as a JSON array — malformed emails (missing @, missing TLD, spaces, unicode), short passwords, empty fields. Make them realistic and varied.

Respond with ONLY a raw JSON array (no markdown fences, no prose) where each item has this exact shape:
{
  "label": "short human description",
  "email": "...",
  "password": "...",
  "expectedErrors": {
    // only include keys for fields that SHOULD show an error, with the exact error string from the rules above
  }
}`

async function generateSignupCases() {
  const cached = readCache('signup-cases')
  if (cached) return cached

  try {
    const cases = await callLLM(SIGNUP_RULES_PROMPT)
    writeCache('signup-cases', cases)
    return cases
  } catch (err) {
    console.warn(`[llmTestData] Falling back to static signup cases: ${err.message}`)
    return FALLBACK_SIGNUP_CASES
  }
}

async function generateSigninCases() {
  const cached = readCache('signin-cases')
  if (cached) return cached

  try {
    const cases = await callLLM(SIGNIN_RULES_PROMPT)
    writeCache('signin-cases', cases)
    return cases
  } catch (err) {
    console.warn(`[llmTestData] Falling back to static signin cases: ${err.message}`)
    return FALLBACK_SIGNIN_CASES
  }
}

function loadCachedOrFallback(kind) {
  const cached = readCache(`${kind}-cases`)
  if (cached) return cached
  return kind === 'signup' ? FALLBACK_SIGNUP_CASES : FALLBACK_SIGNIN_CASES
}

module.exports = { generateSignupCases, generateSigninCases, loadCachedOrFallback }
