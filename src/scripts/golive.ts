/**
 * Go-live checklist (spec §11 "checklist data sementara (F-15)", §10 operations).
 * Run against the production database with production env:  pnpm check:golive
 * Exit code 1 when anything blocks go-live, so it can gate a deploy.
 */
import { getPayload } from 'payload'

import config from '../payload.config'
import { getUnverifiedReport } from '../lib/verification'

type Result = { level: 'fail' | 'warn' | 'ok'; check: string; detail?: string }
const results: Result[] = []
const add = (level: Result['level'], check: string, detail?: string) => results.push({ level, check, detail })

const payload = await getPayload({ config })
const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
const env = process.env

// ── F-15 temporary data ────────────────────────────────────────────────────────
const report = await getUnverifiedReport(payload, 100)
const unverified = report.reduce((sum, g) => sum + g.total, 0)
if (unverified) {
  add('fail', `F-15: ${unverified} published item(s) still unverified`)
  for (const g of report) {
    add('fail', `  ${g.label} (${g.total})`, g.items.map((i) => i.title).join(' · '))
  }
} else add('ok', 'F-15: all published content is verified')
if (env.SHOW_TEMP_MARKERS === 'true') add('fail', 'SHOW_TEMP_MARKERS must be off in production')

// ── F-04 / F-08: photo alt text in both languages ──────────────────────────────
for (const locale of ['en', 'id'] as const) {
  const missing = await payload.find({
    collection: 'media',
    locale,
    fallbackLocale: false,
    where: { or: [{ alt: { exists: false } }, { alt: { equals: '' } }] },
    limit: 10,
    depth: 0,
    overrideAccess: true,
  })
  if (missing.totalDocs) {
    add('fail', `${missing.totalDocs} photo(s) without ${locale === 'en' ? 'English' : 'Indonesian'} alt text`, missing.docs.map((d) => d.filename).join(' · '))
  }
}

// ── Contact data ───────────────────────────────────────────────────────────────
const wa = (settings.whatsappNumber ?? '').replace(/\D/g, '')
if (wa.length < 8) add('fail', 'WhatsApp number is not set (Site settings › Contact)')
else add('ok', `WhatsApp number set (+${wa.slice(0, 4)}…) — confirm it is the official number, not the vendor test number`)
if (!settings.email) add('warn', 'Contact email is empty (it is hidden on the site)')
if (settings.contactFormEnabled) {
  if (!settings.inquiryRecipients && !settings.email) add('fail', 'Contact form is on but no notification email is set')
  if (!env.SMTP_HOST) add('fail', 'Contact form is on but SMTP_HOST is not set (emails would only be logged)')
}

// ── Site / SEO ─────────────────────────────────────────────────────────────────
const serverUrl = env.NEXT_PUBLIC_SERVER_URL ?? ''
if (!/^https:\/\//.test(serverUrl) || /localhost|127\.0\.0\.1|staging/.test(serverUrl)) {
  add('fail', `NEXT_PUBLIC_SERVER_URL should be the public https domain (now: ${serverUrl || 'empty'})`)
} else add('ok', `Site URL ${serverUrl}`)
if (env.ALLOW_INDEXING !== 'true') add('fail', 'ALLOW_INDEXING is not true (search engines are blocked)')
if (!env.GOOGLE_SITE_VERIFICATION) add('warn', 'GOOGLE_SITE_VERIFICATION empty (verify Search Console another way)')

// ── Integrations ───────────────────────────────────────────────────────────────
if (!env.NEXT_PUBLIC_GA_ID) add('warn', 'NEXT_PUBLIC_GA_ID empty: no analytics (spec §10 expects GA4)')
if (!env.S3_BUCKET) add('warn', 'S3_BUCKET empty: media stays on the server disk (include it in backups)')
if ((env.PAYLOAD_SECRET ?? '').length < 32) add('fail', 'PAYLOAD_SECRET is missing or too short')

// ── Output ─────────────────────────────────────────────────────────────────────
const icon = { fail: '✗', warn: '!', ok: '✓' }
for (const r of results) console.log(`${icon[r.level]} ${r.check}${r.detail ? `\n      ${r.detail}` : ''}`)
const fails = results.filter((r) => r.level === 'fail' && !r.check.startsWith('  ')).length
const warns = results.filter((r) => r.level === 'warn').length
console.log(`\n${fails ? `NOT READY: ${fails} blocking issue(s)` : 'READY for go-live'}${warns ? `, ${warns} warning(s)` : ''}`)
process.exit(fails ? 1 : 0)
