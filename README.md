# Auth QA Suite

Playwright end-to-end testing POC for a small React + Vite auth demo (sign in / sign up),
with an AI-powered layer that generates edge-case test data instead of hand-typing it —
and is reusable across any frontend via a small declarative config.

## Stack
- React + Vite (UI)
- Playwright (browser testing)
- Groq API (dynamic test case generation, free tier — Llama 3.3 70B)

## Quick start (one command)

```bash
npm run setup   # once: installs both projects + chromium
cp .env.example .env   # once: paste your Groq key
npm run qa      # every time: cleans, regenerates AI cases fresh, runs everything
```

`npm run qa` always force-regenerates the AI cases (ignores any old cache) and
wipes stale reports/legacy files before running, so you never hit the
"duplicate/stale test file" problem from copying new files over old ones.
Add `-- --headed` to watch it in a real browser: `npm run qa -- --headed`.

Everything below explains what's happening under the hood and how to run
individual steps by hand if you want finer control.

## Setup (manual, step by step)

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
- `tests/ai-dynamic.spec.js` — AI-generated edge cases for **every** form declared in
  `tests/ai/formSpecs.js` (currently sign in + sign up)

## Using the AI-generated tests

`tests/ai-dynamic.spec.js` doesn't hardcode any field names or inputs. It reads
`tests/ai/formSpecs.js` — a plain-language description of each form's fields and
validation rules — and `tests/ai/aiCaseEngine.js` sends that description to the Groq
API, asking it to invent varied, realistic edge cases (unicode names, boundary-length
passwords, subtly malformed emails) each labeled with which field should error and why.
Playwright then declares one real, individually-reported test per generated case, per form.

**To point this suite at a NEW frontend**, you don't write new test code — you add one
entry to `tests/ai/formSpecs.js` describing that form's fields (their `data-testid`s,
their error `data-testid`s, and their rules in plain English). The same engine and the
same spec file will pick it up automatically. This only works for forms you describe —
it does not crawl an unknown page and guess its rules on its own; that's a much bigger,
much less reliable problem than generating cases for a form you've already specified.

The "valid login" test stays hardcoded on purpose (see `signin.spec.js`) — you don't
want an LLM guessing at real credentials. AI generation is additive, for edge-case
coverage, not a replacement for your critical-path tests.

**One-time setup:**
```bash
cp .env.example .env
# edit .env and paste your free key from https://console.groq.com/keys
```

**Generate (or refresh) the AI test cases for every form:**
```bash
npm run ai:generate
```
This calls Groq once per form and caches the results to `tests/.cache/*.json`
(gitignored). Playwright reads that cache when you run tests — it does NOT call the
API on every test run. Delete a cache file, or run with
`AI_REGENERATE=true npm run ai:generate`, to get a fresh batch of cases.

(`npm run qa` does all of this automatically every time — this manual version is
here if you want to regenerate cases without immediately re-running the full suite.)

**No API key?** No problem — `npx playwright test` still works. Without a cached or
generated case file, each form automatically falls back to its own small static case
list (defined right in `formSpecs.js`), so the suite never breaks; it just runs fewer,
non-AI cases until you add a key.
