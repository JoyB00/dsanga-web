# Lighthouse mobile — http://localhost:3001

Run: 2026-11-22T09:45:47.493Z · Lighthouse 13.6.0 · mobile, simulated 4G · best of 2 runs

Targets (spec §9): Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 90, LCP ≤ 2.5 s, CLS ≤ 0.1, largest image ≤ 300 KB. INP needs real users; TBT (≤ 200 ms) is the lab stand-in.

| Page | Perf | A11y | Best pr. | SEO | LCP | CLS | TBT | Largest image | Result |
|---|---|---|---|---|---|---|---|---|---|
| Home (EN) `/` | 100 | 100 | 100 | 100 | 0.9 s | 0 | 29 ms | 3 KB | Pass |
| Home (ID) `/id` | 100 | 100 | 100 | 100 | 0.9 s | 0 | 35 ms | 3 KB | Pass |
| Pool (EN) `/pool` | 99 | 100 | 100 | 100 | 2.3 s | 0 | 32 ms | 7 KB | Pass |
| Pool (ID) `/id/pool` | 97 | 100 | 100 | 100 | 2.7 s | 0 | 34 ms | 7 KB | Fail |
| Dining (EN) `/dining` | 100 | 100 | 100 | 100 | 0.8 s | 0 | 25 ms | 0 KB | Pass |
| Dining (ID) `/id/bistro-coffee` | 100 | 100 | 100 | 100 | 0.8 s | 0 | 31 ms | 0 KB | Pass |
| Work & Space (EN) `/work-space` | 100 | 100 | 100 | 100 | 0.8 s | 0 | 30 ms | 0 KB | Pass |
| Work & Space (ID) `/id/work-space` | 100 | 100 | 100 | 100 | 0.8 s | 0 | 28 ms | 0 KB | Pass |
| Visit Us (EN) `/visit` | 100 | 100 | 100 | 100 | 0.8 s | 0 | 23 ms | 0 KB | Pass |
| Visit Us (ID) `/id/info-kunjungan` | 100 | 100 | 100 | 100 | 0.8 s | 0 | 31 ms | 0 KB | Pass |

