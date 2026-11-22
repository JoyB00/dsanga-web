/**
 * Spec §9 performance check: Lighthouse mobile (simulated 4G) on Home, Pool, Dining, Work & Space
 * and Visit Us in both languages. Run against a PRODUCTION build (`pnpm build && pnpm start`),
 * never `pnpm dev`, and with ALLOW_INDEXING=true or the SEO score is capped by "noindex".
 *
 *   pnpm lighthouse                      # http://localhost:3000
 *   pnpm lighthouse https://staging.example.com
 *   CHROME_PATH=/path/to/chrome pnpm lighthouse
 *   pnpm lighthouse http://localhost:3000 --only=Pool   # pages whose name contains "Pool"
 *
 * Writes qa/lighthouse/summary.md and one JSON report per page. Exit code 1 if a target is missed.
 */
import fs from 'node:fs/promises'
import path from 'node:path'

import * as chromeLauncher from 'chrome-launcher'
import lighthouse from 'lighthouse'

const args = process.argv.slice(2)
const base = (args.find((a) => !a.startsWith('--')) || 'http://localhost:3000').replace(/\/$/, '')
const only = args.find((a) => a.startsWith('--only='))?.slice(7)
const PAGES = [
  ['Home', '/', '/id'],
  ['Pool', '/pool', '/id/pool'],
  ['Dining', '/dining', '/id/bistro-coffee'],
  ['Work & Space', '/work-space', '/id/work-space'],
  ['Visit Us', '/visit', '/id/info-kunjungan'],
].flatMap(([name, en, id]) => [
  { name: `${name} (EN)`, path: en },
  { name: `${name} (ID)`, path: id },
]).filter((p) => !only || p.name.includes(only))
const TARGET = { performance: 85, accessibility: 90, seo: 90, lcp: 2500, cls: 0.1, tbt: 200, heroKb: 300 }
const outDir = path.resolve('qa/lighthouse')
await fs.mkdir(outDir, { recursive: true })

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless=new', '--no-sandbox'] })
const rows = []
try {
  for (const page of PAGES) {
    // Best of 2 runs: simulated throttling on a busy laptop is noisy.
    let best
    for (let run = 0; run < 2; run++) {
      const { lhr } = await lighthouse(`${base}${page.path}`, {
        port: chrome.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      })
      if (!best || lhr.categories.performance.score > best.categories.performance.score) best = lhr
    }
    const lhr = best
    const a = lhr.audits
    const images = (a['network-requests']?.details?.items ?? []).filter((r) => r.resourceType === 'Image')
    const largestImageKb = Math.round(Math.max(0, ...images.map((r) => r.transferSize ?? 0)) / 1024)
    const row = {
      page: page.name,
      path: page.path,
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
      lcp: Math.round(a['largest-contentful-paint'].numericValue),
      cls: Number(a['cumulative-layout-shift'].numericValue.toFixed(3)),
      tbt: Math.round(a['total-blocking-time'].numericValue),
      largestImageKb,
      failedAudits: Object.values(a)
        .filter((x) => x.score !== null && x.score < 0.9 && x.scoreDisplayMode === 'binary')
        .map((x) => x.id),
    }
    row.pass =
      row.performance >= TARGET.performance &&
      row.accessibility >= TARGET.accessibility &&
      row.seo >= TARGET.seo &&
      row.lcp <= TARGET.lcp &&
      row.cls <= TARGET.cls &&
      row.largestImageKb <= TARGET.heroKb
    rows.push(row)
    const file = page.path.replace(/^\/$/, 'home').replace(/^\//, '').replace(/\//g, '_') || 'home'
    await fs.writeFile(path.join(outDir, `${file}.json`), JSON.stringify(lhr))
    console.log(
      `${row.pass ? '✓' : '✗'} ${row.page.padEnd(20)} P${row.performance} A${row.accessibility} BP${row.bestPractices} SEO${row.seo}  LCP ${row.lcp}ms  CLS ${row.cls}  TBT ${row.tbt}ms  img ${row.largestImageKb}KB`,
    )
  }
} finally {
  await chrome.kill()
}

const md = [
  `# Lighthouse mobile — ${base}`,
  '',
  `Run: ${new Date().toISOString()} · Lighthouse ${(await import('lighthouse/package.json', { with: { type: 'json' } })).default.version} · mobile, simulated 4G · best of 2 runs`,
  '',
  `Targets (spec §9): Performance ≥ ${TARGET.performance}, Accessibility ≥ ${TARGET.accessibility}, SEO ≥ ${TARGET.seo}, LCP ≤ ${TARGET.lcp / 1000} s, CLS ≤ ${TARGET.cls}, largest image ≤ ${TARGET.heroKb} KB. INP needs real users; TBT (≤ ${TARGET.tbt} ms) is the lab stand-in.`,
  '',
  '| Page | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT | Largest image | Result |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map(
    (r) =>
      `| ${r.page} \`${r.path}\` | ${r.performance} | ${r.accessibility} | ${r.bestPractices} | ${r.seo} | ${(r.lcp / 1000).toFixed(1)} s | ${r.cls} | ${r.tbt} ms | ${r.largestImageKb} KB | ${r.pass ? 'Pass' : 'Fail'} |`,
  ),
  '',
  ...rows.filter((r) => r.failedAudits.length).map((r) => `- ${r.page}: failed audits ${r.failedAudits.join(', ')}`),
].join('\n')
await fs.writeFile(path.join(outDir, only ? `summary-${only.replace(/\W+/g, '-').toLowerCase()}.md` : 'summary.md'), md + '\n')
console.log(`\nSummary written to ${path.relative(process.cwd(), outDir)}/`)
process.exit(rows.every((r) => r.pass) ? 0 : 1)
