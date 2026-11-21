# D’Sanga Pool, Bistro & Space — website

Public website and CMS for D’Sanga (Desa Sukawati, Bali). Built from *Spesifikasi Website D’Sanga v1.3*, the approved wireframes and the design system v1.

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
| `pnpm build` / `pnpm start` | Production build / server. |
| `pnpm generate:types` | Regenerate `src/payload-types.ts` after changing collections. |
| `pnpm generate:importmap` | Regenerate the admin import map after adding custom admin components. |
| `pnpm tokens` | Regenerate `design-tokens.css` from `design/design-tokens.json`. |
| `pnpm typecheck` · `pnpm lint` · `pnpm test:int` · `pnpm test:e2e` | Checks. |

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
  collections/                 Experiences, MenuItems, Events, Offers, VenuePackages, Faqs, Media, Inquiries, Users, AuditLogs
  globals/SiteSettings.ts      WhatsApp number, contact, address, opening hours, form switch
  access/roles.ts              Roles and permission helpers (spec §7)
  hooks/                       restrictPublish (F-11), auditLog (F-12)
  lib/whatsapp.ts              Pre-filled WhatsApp links per language (F-03)
  seed/index.ts                Temporary data
```

## How the spec is implemented

| Spec | Where |
|---|---|
| F-08 bilingual, EN default | `localization` in `payload.config.ts` (fallback off) + `proxy.ts` + `i18n/` |
| §7 roles | `access/roles.ts`, `Users.role`: Super Admin Desa, Approver, Admin Konten, Admin Produk, Viewer |
| F-01 drafts / versions | `versions.drafts` on content collections |
| F-11 approval | `hooks/restrictPublish.ts`: admins can save drafts; only Approver / Super Admin can publish experiences, menu, offers and venue packages |
| F-12 audit log | `hooks/auditLog.ts` → `audit-logs` (Super Admin only) |
| F-13 expiry | Offers outside `validFrom`–`validUntil` are hidden by access rules; past events are for the archive |
| F-14 contact form | `inquiries` collection, honeypot + consent, on/off switch in Site settings |
| F-15 temporary data | `verified` + `pic` on every record; only approvers can tick `verified` |
| F-03 WhatsApp | One number in Site settings; buttons hide until a number of 8+ digits is set |
| F-04 images | Media: WebP output, `thumb` / `card` / `hero` sizes, localized alt text |

## Notes

- **Locale in API calls:** REST/GraphQL writes should pass `?locale=en` or `?locale=id`. The admin panel does this automatically.
- **Caching:** public pages are prerendered and revalidate every 60 seconds (`revalidate` in the locale layout).
- **WhatsApp:** set a **vendor test number** (never a random number) in `SEED_WHATSAPP_NUMBER` or in Site settings.
- **Production database:** dev uses Payload's automatic schema push. Before the first deploy, create migrations (`pnpm payload migrate:create`) and run `pnpm payload migrate` on the server.

## Not done yet

- Page bodies from the wireframes: Home is partly built; the other 11 pages are placeholders.
- Object storage for media (Cloudflare R2 via `@payloadcms/storage-s3`), email adapter, analytics + cookie consent, sitemap/hreflang tags, on-demand revalidation, and the F-08 check that both languages are filled before publishing.
