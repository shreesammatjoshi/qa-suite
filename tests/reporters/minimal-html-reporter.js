/**
 * minimal-html-reporter.js
 *
 * A small, self-contained Playwright reporter that writes one static HTML
 * page summarizing the run — styled to match the app under test instead of
 * Playwright's default report look. This runs ALONGSIDE the built-in html
 * reporter (kept in playwright.config.js) rather than replacing it, so you
 * still have the official trace viewer for deep debugging when you need it.
 *
 * Implements the subset of the Playwright Reporter interface we need:
 * onTestEnd and onEnd. See https://playwright.dev/docs/api/class-reporter
 */

const fs = require('fs')
const path = require('path')

class MinimalHtmlReporter {
  constructor(options = {}) {
    this.outputFile = options.outputFile || 'qa-report/index.html'
    this.results = []
  }

  onTestEnd(test, result) {
    this.results.push({
      title: test.titlePath().slice(2).join(' › '),
      file: path.basename(test.location.file),
      status: result.status,
      duration: result.duration,
    })
  }

  onEnd(result) {
    const outPath = path.resolve(this.outputFile)
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, this.renderHtml(result))
    console.log(`\nMinimal report written to ${outPath}`)
  }

  renderHtml(result) {
    const passed = this.results.filter((r) => r.status === 'passed').length
    const failed = this.results.filter((r) => r.status === 'failed' || r.status === 'timedOut').length
    const skipped = this.results.filter((r) => r.status === 'skipped').length
    const total = this.results.length
    const durationS = (this.results.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(1)

    const byFile = {}
    for (const r of this.results) {
      byFile[r.file] = byFile[r.file] || []
      byFile[r.file].push(r)
    }

    const rows = Object.entries(byFile)
      .map(
        ([file, tests]) => `
        <section class="file-group">
          <h2>${escapeHtml(file)}</h2>
          <ul>
            ${tests
              .map(
                (t) => `
              <li class="test-row status-${t.status}">
                <span class="status-dot"></span>
                <span class="test-title">${escapeHtml(t.title)}</span>
                <span class="test-duration">${t.duration}ms</span>
              </li>`,
              )
              .join('')}
          </ul>
        </section>`,
      )
      .join('')

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>QA Suite Report</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500&display=swap" rel="stylesheet" />
<style>
  :root {
    --paper: #f6f7f9;
    --card: #ffffff;
    --ink: #1b232c;
    --ink-soft: #6b7480;
    --line: #e3e6ea;
    --green: #2f8f5b;
    --green-bg: #eaf5ef;
    --red: #c1443c;
    --red-bg: #fbeae8;
    --amber: #b8790a;
    --amber-bg: #fbf1e0;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--paper);
    color: var(--ink);
    padding: 40px 24px;
  }
  .wrap { max-width: 720px; margin: 0 auto; }
  h1 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 22px;
    font-weight: 600;
    margin: 0 0 4px;
  }
  .meta {
    color: var(--ink-soft);
    font-size: 13px;
    margin-bottom: 24px;
  }
  .summary {
    display: flex;
    gap: 10px;
    margin-bottom: 32px;
  }
  .summary .stat {
    flex: 1;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 8px;
    padding: 14px 16px;
  }
  .summary .stat .n {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 22px;
    font-weight: 600;
    display: block;
  }
  .summary .stat .label {
    font-size: 12px;
    color: var(--ink-soft);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .summary .stat.passed .n { color: var(--green); }
  .summary .stat.failed .n { color: var(--red); }

  .file-group {
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 8px;
    margin-bottom: 16px;
    overflow: hidden;
  }
  .file-group h2 {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    color: var(--ink-soft);
    margin: 0;
    padding: 10px 16px;
    background: var(--paper);
    border-bottom: 1px solid var(--line);
  }
  ul { list-style: none; margin: 0; padding: 0; }
  .test-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--line);
    font-size: 13px;
  }
  .test-row:last-child { border-bottom: none; }
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .status-passed .status-dot { background: var(--green); }
  .status-failed .status-dot,
  .status-timedOut .status-dot { background: var(--red); }
  .status-skipped .status-dot { background: var(--amber); }
  .test-title { flex: 1; }
  .test-duration {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--ink-soft);
  }
</style>
</head>
<body>
  <div class="wrap">
    <h1>QA Suite Report</h1>
    <div class="meta">${new Date().toLocaleString()} · total time ${durationS}s</div>

    <div class="summary">
      <div class="stat passed"><span class="n">${passed}</span><span class="label">Passed</span></div>
      <div class="stat failed"><span class="n">${failed}</span><span class="label">Failed</span></div>
      <div class="stat"><span class="n">${skipped}</span><span class="label">Skipped</span></div>
      <div class="stat"><span class="n">${total}</span><span class="label">Total</span></div>
    </div>

    ${rows}
  </div>
</body>
</html>`
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

module.exports = MinimalHtmlReporter
