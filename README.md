# D’Sanga Pool, Bistro & Space — website

Public website and CMS for D’Sanga (Desa Sukawati, Bali). Built from *Spesifikasi Website D’Sanga v1.3*, the approved wireframes and the design system v1, with the layout v2 update (`docs/spec-layout-v2.md`: new layout and Cormorant Garamond headings, design system v1 colours).

**Stack:** Next.js 16 (App Router) · Payload CMS 3 (inside the same app) · PostgreSQL · Tailwind CSS v4 · TypeScript.

## Requirements

- Node **24** (`.nvmrc`; Payload needs ≥ 22.23.5). With nvm: `nvm use`.
- pnpm 10
- PostgreSQL 16, either local or via `docker compose up -d postgres`.

## First run

```bash
nvm use
pnpm install
cp .env.example .env          # set DATABASE_URL and PAYLOAD_SECRET (openssl rand -hex 32)
createdb dsanga               # or use docker compose
pnpm seed                     # creates tables (dev push) + temporary data from spec §14
pnpm dev
```

- Website: http://localhost:3000 (English) · http://localhost:3000/id (Indonesian)
- CMS: http://localhost:3000/admin. Log in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` from `.env`, or create the first user there. The first account automatically becomes Super Admin.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server. Payload pushes schema changes to the dev database automatically. |
| `pnpm seed` | Fills the CMS with temporary data (spec §14). Re-runnable; every record has **verified = false** (F-15). |
| `pnpm seed:images` | Fills every image slot with a temporary photo: free Unsplash stock photos listed in `src/seed/stockPhotos.ts` (downloaded once to `.cache/stock/`, credit in each photo's *Usage rights*), or a generated illustration where none is listed. All stay unverified (F-15). Part of `pnpm seed`; `--force` recreates them. |
| `pnpm build` / `pnpm start` | Production build / server. |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` after changing collections. |
| `pnpm generate:importmap` | Regenerate the admin import map after adding custom admin components. |
| `pnpm tokens` | Regenerate `design-tokens.css` from `design/design-tokens.json`. |
| `pnpm typecheck` · `pnpm lint` | Static checks. |
| `pnpm test:int` | CMS rules through the Local API (F-01, F-08, F-11–F-15) + email unit test. Uses the dev database; test records are named `QA …` / `@qa.test` and removed afterwards. |
| `pnpm test:e2e` | Browser tests: all 24 pages (status, `lang`, h1, canonical, hreflang, switcher), routing, broken links, 375 px overflow, menu, FAQ, tabs, lightbox, contact form, axe WCAG 2.1 AA, keyboard. Reuses a running `pnpm dev`. |
| `pnpm lighthouse [url]` | Spec §9 check: Lighthouse mobile on Home, Pool, Dining, Work & Space, Visit Us (EN + ID). Run on a production build; writes `qa/lighthouse/summary.md`. |
| `pnpm check:golive` | Go-live checklist (F-15 unverified data, contact data, indexing, SMTP, secrets…). Exit code 1 while anything blocks launch. |

## Project map

```
design/design-tokens.json      Design tokens (source of truth) → pnpm tokens
src/
  app/(frontend)/[locale]/     Public pages (folders use English slugs)
  app/(frontend)/globals.css   Tailwind v4 theme + base + component classes
  app/(payload)/               Payload admin + REST/GraphQL API (generated, rarely edited)
  proxy.ts                     Language routing: EN default without prefix, ID under /id with ID slugs
  i18n/config.ts               Route slugs per language + href() helper
  i18n/dictionaries.ts         UI strings / CTA labels (EN + ID)
  collections/                 Experiences, MenuItems, Events, Offers, VenuePackages, Faqs, PageIntros, Media, Documents, Inquiries, Users, AuditLogs
  globals/                     SiteSettings (WhatsApp, contact, hours, form switch) + HomePage, AboutPage, PrivacyPage
  access/roles.ts              Roles and permission helpers (spec §7)
  hooks/                       restrictPublish (F-11), auditLog (F-12), requireBothLocales (F-08), revalidate, notifyInquiry (F-14)
  integrations/                storage.ts (Cloudflare R2), email.ts (SMTP)
  components/Analytics.tsx     GA4 + cookie banner
  lib/seo.ts                   Page metadata: canonical, hreflang, Open Graph, indexing switch
  app/sitemap.ts · robots.ts   XML sitemap (both languages) and robots.txt
  lib/queries.ts               All CMS reads for the public pages (published, per language, no fallback)
  lib/whatsapp.ts              Pre-filled WhatsApp links per language (F-03)
  seed/index.ts                Temporary data
```

## How the spec is implemented

| Spec | Where |
|---|---|
| F-08 bilingual, EN default | `localization` in `payload.config.ts` (fallback off) + `proxy.ts` + `i18n/` |
| F-08 publish check | `hooks/requireBothLocales.ts`: publishing is refused until required text exists in English **and** Indonesian (drafts can be saved anytime). Fields per collection are listed in `payload.config.ts` |
| Editable page copy | Globals **Home page**, **About page**, **Privacy policy** and the **Page headers** collection (Activities, Events, Offers, Gallery, Visit Us, Contact). `i18n/dictionaries.ts` holds UI labels and fallbacks only |
| §7 roles | `access/roles.ts`, `Users.role`: Super Admin Desa, Approver, Admin Konten, Admin Produk, Viewer |
| F-01 drafts / versions / schedule | `versions.drafts` on content collections and page globals: version history + restore, **Unpublish** (= archive), and *Schedule publish* (runs via the jobs queue as the user who scheduled it, so F-08 and F-11 still apply) |
| F-11 approval | `hooks/restrictPublish.ts`: admins can save drafts; only Approver / Super Admin can publish experiences, menu, offers and venue packages |
| F-12 audit log | `hooks/auditLog.ts` → `audit-logs` (Super Admin only): content, media, **accounts** (email + role, never passwords) and **Site settings / page globals** (`global:<slug>`). Logins are not logged |
| F-13 expiry | Offers outside `validFrom`–`validUntil` are hidden by access rules; past events move to the archive. Reminder: dashboard panel + daily email (08:00 WITA) listing offers that end within 7 days (`lib/reminders.ts`, recipients in *Site settings › Switches*) |
| F-14 contact form | `inquiries` collection, honeypot + consent, on/off switch in Site settings |
| F-15 temporary data | `verified` + `pic` on every record, page global and photo; only approvers can tick it. Dashboard panel lists what is still temporary; `SHOW_TEMP_MARKERS=true` (staging) outlines it on the site; `pnpm check:golive` fails while any published item is unverified (`lib/verification.ts`) |
| F-03 WhatsApp | One number in Site settings; buttons hide until a number of 8+ digits is set |
| F-04 images | Media: WebP output, `thumb` / `card` / `hero` sizes, localized alt text |
| F-14 email to PIC | `hooks/notifyInquiry.ts`: bilingual email to *Site settings › Switches › Inquiry recipients* (fallback: contact email), Reply-To = visitor. A failed email never loses the message (it is in *Inbox*) |
| §9 SEO dasar | `lib/seo.ts` on every page: title, description, canonical, hreflang en / id / x-default (→ English), Open Graph + Twitter per language. `sitemap.xml` lists all 24 URLs with hreflang |
| §10 SEO lokal | `components/LocalBusinessJsonLd.tsx` on Home and Visit Us, built from Site settings so NAP matches the page |
| §9 analytics | `components/Analytics.tsx`: GA4 loads only after consent; events `page_view` (+ `site_language`), `whatsapp_click` (`context`), `map_click`, `cta_click`, `generate_lead` |
| §10 cookie banner | Same component; bilingual, Decline as easy as Accept, re-open from the footer (*Cookie settings*). Hidden when no GA ID is set |
| §3.2 language memory | The switcher stores `NEXT_LOCALE`; `proxy.ts` sends a returning Indonesian visitor from `/` to `/id` (page loads only; crawlers are never redirected) |
| §10 storage | `integrations/storage.ts`: Cloudflare R2 for Media and Documents when `S3_BUCKET` is set |

## Notes

- **Locale in API calls:** REST/GraphQL writes should pass `?locale=en` or `?locale=id`. The admin panel does this automatically.
- **Caching:** public pages are prerendered. Publishing in the CMS refreshes them on the next visit (`hooks/revalidate.ts`; the route pattern must include the `(frontend)` group). A 5-minute `revalidate` in the locale layout catches date-based changes such as expiring offers.
- **Hooks and `req`:** never pass `req` to a Local API call that sets a different `locale`: Payload switches `req.locale`, and the rest of the save then writes into the other language (see `requireBothLocales.ts`).
- **WhatsApp:** set a **vendor test number** (never a random number) in `SEED_WHATSAPP_NUMBER` or in Site settings.
- **Environment switches** (all optional, see `.env.example`): no `S3_BUCKET` → files on local disk; no `SMTP_HOST` → emails are printed in the server log; no `NEXT_PUBLIC_GA_ID` → no analytics and no banner; `ALLOW_INDEXING` not `true` → noindex + robots.txt blocks everything. `NEXT_PUBLIC_GA_ID`, `S3_PUBLIC_URL` and `ALLOW_INDEXING` are read at **build time**, so set them for the build too.
- **GA4 setup:** in the GA4 property, register the custom dimensions `site_language`, `context`, `placement` and `cta_label` (event scope), mark `generate_lead` and `whatsapp_click` as key events, and turn **off** Enhanced measurement › "Page changes based on browser history events" and "Form interactions" (the site sends those itself; leaving them on double-counts).
- **R2 setup:** create a bucket and an API token with Object Read & Write, set `S3_*`. For fast public images connect a custom domain (or r2.dev) to the bucket and set `S3_PUBLIC_URL`; without it files are streamed through `/api/media/file/…`. Upload existing local files again after switching (or copy `media/` and `documents/` into the bucket under the same prefixes).
- **Share image:** `public/og-default.jpg` is a temporary brand card, used when a page has no hero photo. Replace it once real photos are approved.
- **Layout v2** (`docs/spec-layout-v2.md`): building blocks live in `src/components/ui` — `PageHero` (full-width photo, or a short gradient header when there is no photo), `Section` / `SectionHeader` / `Eyebrow` (tones: cream, white, alt, soft, dark; at most one dark section per page), `OverlayCard` (photo card, the whole card is one link), `Catalog` (filter pills), `InfoCard` / `IconCard` / `Panel`, `CtaBand`; header and footer in `src/components/SiteHeader.tsx` / `SiteFooter.tsx`. The header is fixed, so every page starts with a hero (or the gradient header) that leaves room for it. WhatsApp buttons, including the floating “Ask us” button, stay hidden until a number is set (F-03).
- **Home copy fields (layout v2):** Home page › Hero › *Title accent* (words at the end of the title shown in gold) and *Tagline*; About › *Quote* and a short text per value; *Four ways section*; *Why D’Sanga section* (hidden without items); *Closing call to action*. Experiences › *Card tag*. All optional and per language.
- **Production database:** dev uses Payload's automatic schema push. Before the first deploy, create migrations (`pnpm payload migrate:create`) and run `pnpm payload migrate` on the server.

## Testing notes

- **e2e browser:** Playwright 1.63 expects its own Chromium build. Either `pnpm exec playwright install chromium`, or point at an installed one: `PLAYWRIGHT_CHROMIUM_PATH=…/Google Chrome for Testing pnpm test:e2e`.
- **Lighthouse:** run against `pnpm build && pnpm start` with `ALLOW_INDEXING=true`, never `pnpm dev`. `CHROME_PATH` selects the browser. Local `next start` is HTTP/1.1, which makes simulated LCP look worse than staging/production behind HTTP/2.
- **Background jobs** (scheduled publish, reminders) run inside the web server every minute. Run only one instance with jobs on; set `JOBS_AUTORUN=false` on any extra instance. Tests turn them off automatically.
- QA results for stage 6: `docs/QA-report.md`.

## Not done yet

- Photo alt text: an upload needs alt text in the language being edited; the second language is enforced by `pnpm check:golive` (not at upload, so one-step uploads still work).
- Not yet tested against a real R2 bucket, SMTP server or GA4 property (needs the client's or vendor's test accounts). Locally: storage off, emails logged, GA tested with a dummy ID and Google requests blocked.
- Stage 7: staging deploy, production migrations, HTTPS, automatic backups + restore test (F-09), re-run Lighthouse on staging over HTTP/2.
- Layout v2: the client still has to approve the heading font change (Caveat → Cormorant Garamond) and the draft Home copy for the new fields (tagline, quote, Four ways, Why D’Sanga, closing CTA). The optional “A day at D’Sanga” timeline (spec §6.1 section 4) is not built.
