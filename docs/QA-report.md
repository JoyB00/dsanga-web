# QA report: stage 6

**Project:** D’Sanga Pool, Bistro & Space website · **Spec:** v1.3 · **Date:** 22 Nov 2026
**Tested:** local environment, production build (`pnpm build && pnpm start`) and dev server, temporary data from spec §14.
**Not yet tested here:** staging/production hosting, real R2 / SMTP / GA4 accounts, backups. These are covered in stage 7.

> **Update 22 Nov 2026: layout v2 applied** (`docs/spec-layout-v2.md`). Re-checked after the change:
> - All 22 integration tests and 67 browser tests pass (mobile menu test rewritten for the new menu incl. Escape; new catalog filter test).
> - axe reports 0 violations on all 24 pages.
> - No page scrolls sideways at 375 px.
> - The Lighthouse figures below are from the old layout and must be re-measured on staging.

## Summary

| Area | Result |
|---|---|
| Acceptance criteria F-01 to F-15 | 11 pass. 3 pass locally but need real accounts or devices on staging (F-03, F-07, F-14). 1 partial: F-09 (HTTPS and backups come in stage 7). |
| Accessibility (WCAG 2.1 AA, automated) | 0 axe violations on all 24 pages (12 pages × 2 languages) after 1 fix |
| Performance (Lighthouse mobile, spec §9) | 9 of 10 pass. Pool (ID) measured with a heavy test photo: LCP 2.7 s against a 2.5 s target, on a local HTTP/1.1 server. Re-measure on staging. |
| SEO | 100 on all measured pages (with `ALLOW_INDEXING=true`) |
| Automated tests | 22 integration + 66 browser tests, all passing |
| Go-live checklist | **Not ready, as expected:** 51 published items still use temporary data, and production settings are not set yet |

## Automated tests

| Suite | Tests | What it covers |
|---|---|---|
| `pnpm test:int` (CMS rules) | 17 | F-01 scheduled publish, F-08 bilingual publish check, F-11 approval (including "a scheduled publish cannot bypass approval"), F-12 audit log (content, accounts, settings), F-13 expiry + reminder email, F-14 form rules (consent, honeypot, off switch, privacy of messages), F-15 approver-only Verified flag |
| `pnpm test:int` (email + API) | 5 | Inquiry notification: bilingual, escaped, Reply-To, fallback address, a failed send never loses the message |
| `pnpm test:e2e` (pages) | 24 | Every page in EN and ID: status 200, `lang`, single h1, title, description, canonical, hreflang en/id/x-default, language switcher target |
| `pnpm test:e2e` (site) | 12 | Slug routing and redirects, 404, remembered language, sitemap/robots, **no broken internal links**, **no sideways scroll at 375 px**, mobile menu, FAQ accordion, menu tabs by keyboard, gallery lightbox (Escape + focus return), contact form errors → focus → success |
| `pnpm test:e2e` (accessibility) | 26 | axe WCAG 2.1 A/AA on all 24 pages, skip link, visible focus ring |
| `pnpm test:e2e` (CMS) | 4 | Login, dashboard with F-15 panel, list and edit views |

## Acceptance criteria

| # | Criterion | Status | Evidence / note |
|---|---|---|---|
| F-01 | CMS: draft, publish, schedule, archive, version history | Pass | Drafts + versions with restore; **Unpublish** archives an item; scheduling added in this stage (jobs queue, tested) |
| F-02 | Product management, availability Available / Coming soon / Hidden, PIC, last updated | Pass | Experiences + menu; `pic` and `updatedAt` on every record |
| F-03 | One WhatsApp number, pre-filled message per page and language | Pass (local) | Buttons hide until a number of 8+ digits is set. Opening the app on a phone is a manual check on staging. |
| F-04 | Gallery: categories, alt text in both languages, WebP, several sizes | Pass | A 2.2 MB 4000 px photo became a 182 KB 1920 px hero (≤ 300 KB). Alt text in both languages is enforced by `pnpm check:golive`. |
| F-05 | Responsive | Pass | No sideways scroll on any page at 375 px; menu, tabs, tables and forms tested. Real devices to be checked on staging. |
| F-06 | Basic SEO | Pass | All tags tested on 24 pages; Lighthouse SEO 100 |
| F-07 | Analytics with consent | Pass (local) | Consent flow and events verified with a dummy GA ID and Google blocked. Needs a real GA4 property on staging. |
| F-08 | Bilingual, EN default, no mixed language | Pass | Publish refused while a required field is empty in one language (tested) |
| F-09 | Security | Partial | Honeypot, least-privilege roles, staff-only fields. HTTPS, backups and restore documentation come in stage 7. |
| F-10 | FAQ per topic, accordion | Pass | Pool, Work & Space, Visit Us |
| F-11 | Approval for prices, hours, rules, offers | Pass | Tested for direct and scheduled publishing |
| F-12 | Activity log | Pass | Extended in this stage to accounts and Site settings / page entries; logins are not logged |
| F-13 | Automatic expiry + reminder | Pass | Expired offers hidden, past events archived; reminder added (dashboard + daily 08:00 WITA email) |
| F-14 | Contact form | Pass (local) | Emails are logged locally; real SMTP needed on staging |
| F-15 | Temporary data marker | Pass | Verified flag also on page entries and photos; dashboard panel; staging outlines (`SHOW_TEMP_MARKERS`); `pnpm check:golive` |

## Performance (Lighthouse mobile)

Production build, Lighthouse 13.6, mobile, simulated slow 4G, best of 2 runs. Full table: `qa/lighthouse/summary.md`.

| Page (EN / ID) | Performance | Accessibility | SEO | LCP | CLS |
|---|---|---|---|---|---|
| Home | 100 / 100 | 100 / 100 | 100 / 100 | 0.9 / 0.9 s | 0 |
| Pool (with heavy test photo) | 99 / 97 | 100 / 100 | 100 / 100 | 2.3 / 2.7 s | 0 |
| Dining | 100 / 100 | 100 / 100 | 100 / 100 | 0.8 / 0.8 s | 0 |
| Work & Space | 100 / 100 | 100 / 100 | 100 / 100 | 0.8 / 0.8 s | 0 |
| Visit Us | 100 / 100 | 100 / 100 | 100 / 100 | 0.8 / 0.8 s | 0 |

**How to read this:**

- Only Pool had a hero photo during the run: a deliberately hard-to-compress 4000 × 3000 test image. The other pages still show placeholders, so their LCP is the heading text. Expect numbers closer to Pool's once real photos are uploaded.
- The local server speaks HTTP/1.1, which Lighthouse's simulation penalises. Staging behind HTTP/2 + CDN should measure better. **Re-run `pnpm lighthouse <staging-url>` on staging with real photos before sign-off.**
- INP cannot be measured in the lab; Total Blocking Time (≤ 35 ms everywhere) is the stand-in. Real INP comes from Search Console after launch.

## Issues found and fixed during QA

| # | Issue | Fix |
|---|---|---|
| 1 | Language switcher: visible "ID" / "EN" was not part of its accessible name (WCAG 2.5.3); flagged on every page | Visible code + screen-reader text ("ID, Bahasa Indonesia") |
| 2 | Hero photos had no loading priority: Next.js 16 deprecated `priority` | `loading="eager"` + `fetchPriority="high"` on above-the-fold photos |
| 3 | Four font files preloaded, competing with the hero photo (Pool LCP 3.1 s) | Preload basic Latin only (EN and ID need nothing else): LCP 2.3–2.7 s |
| 4 | Camera originals stored at full size (686 KB WebP for 4000 px) | Originals scaled to max 2560 px on upload |
| 5 | F-01: scheduled publishing missing | Enabled on all draft-enabled content (jobs queue) |
| 6 | F-12: account and Site settings changes not logged | Audit hooks on Users and all globals |
| 7 | F-13: no reminder before offers expire | Dashboard panel + daily bilingual email |
| 8 | F-15: page entries and photos had no Verified flag; no staging marker or go-live gate | Flag added; markers, dashboard panel, `pnpm check:golive` |
| 9 | Staging marker label clipped on cards | Label moved inside the card corner |

## Open items

**Before sign-off (stage 7 / staging):**

- Lighthouse on staging with real photos (see above).
- Real-device checks: iPhone Safari and Android Chrome, WhatsApp buttons open the app (F-03), and a quick VoiceOver/TalkBack pass.
- Real accounts: GA4 (register custom dimensions and turn off duplicate enhanced measurement; see README), SMTP with the vendor test email, R2 bucket.
- HTTPS, automatic database + media backups, one restore test (F-09).

**Before go-live (client / content):**

- Replace and verify the 51 temporary items (dashboard panel, `pnpm check:golive`).
- Production settings: official WhatsApp number, `ALLOW_INDEXING=true` (build and runtime), a `PAYLOAD_SECRET` of 32+ characters, SMTP, public https URL, `SHOW_TEMP_MARKERS` off.
- Replace the temporary share image `public/og-default.jpg`.
