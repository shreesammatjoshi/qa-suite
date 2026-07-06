# Auth QA Suite

Playwright end-to-end testing POC for a small React + Vite auth demo (sign in / sign up),
with an AI-powered layer that generates edge-case test data instead of hand-typing it.

## Stack
- React + Vite (UI)
- Playwright (browser testing)
- Groq API (dynamic test case generation, free tier — Llama 3.3 70B)

## Setup

```bash
# Install app dependencies
cd webapp
npm install
npm run dev

# In a new terminal — install test dependencies
cd ..
npm install
npx playwright install chromium

# Run all tests
npx playwright test

# Watch tests run in a real browser
npx playwright test --headed

# See HTML report
npx playwright show-report
```

## Test coverage
- `tests/signin.spec.js` — 9 hardcoded tests (rendering, validation, the real valid login)
- `tests/signup.spec.js` — 10 hardcoded tests (rendering, validation, happy path)
- `tests/ai-signin.spec.js` — AI-generated edge cases for sign in
- `tests/ai-signup.spec.js` — AI-generated edge cases for sign up

## Valid credentials (for the hardcoded sign-in tests)
- Email: qa@testsuite.dev
- Password: QaPass#2026

## Using the AI-generated tests

The `ai-*.spec.js` files don't hardcode their inputs. Instead, `tests/utils/llmTestData.js`
sends the form's exact validation rules to the Groq API (Llama 3.3 70B, free tier) and asks
it to invent varied, realistic edge cases — unicode names, boundary-length passwords,
subtly malformed emails — each labeled with which field should error and why. Playwright
then declares one real, individually-reported test per generated case.

The "valid login" test stays hardcoded on purpose — you don't want an LLM guessing at
real credentials. AI generation is additive, for edge-case coverage, not a replacement
for your critical-path tests.

**One-time setup:**
```bash
cp .env.example .env
# edit .env and paste your free key from https://console.groq.com/keys
```

**Generate (or refresh) the AI test cases:**
```bash
npm run ai:generate
```
This calls Groq once and caches the results to `tests/.cache/*.json` (gitignored).
Playwright reads that cache when you run tests — it does NOT call the API on every
test run, so your suite stays fast and repeatable, and you don't burn your free-tier
quota. Delete the cache file, or run with `AI_REGENERATE=true npm run ai:generate`,
to get a fresh batch of cases.

**No API key?** No problem — `npx playwright test` still works. Without a cached or
generated case file, the AI spec files automatically fall back to a small static case
list, so the suite never breaks; it just runs fewer, non-AI cases until you add a key.
