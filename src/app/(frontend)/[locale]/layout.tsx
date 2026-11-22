import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import '../globals.css'
import { caveat, nunitoSans } from '../fonts'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { href, isLocale, locales } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { Analytics } from '@/components/Analytics'
import { getSiteSettings } from '@/lib/payload'
import { indexingAllowed, SITE_NAME, siteUrl } from '@/lib/seo'
import { showTempMarkers } from '@/lib/verification'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_NAME, template: '%s — D’Sanga' },
  description: 'Pool, bistro, working space, playground and community events in Sukawati, Bali.',
  applicationName: SITE_NAME,
  // Staging and local builds must never be indexed (ALLOW_INDEXING=true only in production).
  robots: indexingAllowed() ? { index: true, follow: true } : { index: false, follow: false },
  // Search Console ownership check (spec §10 "Search Console (kedua bahasa)").
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
}

// Pages are prerendered. Publishing in the CMS refreshes them immediately (hooks/revalidate.ts);
// this 5-minute fallback also catches time-based changes nobody edits, such as offers and
// events passing their dates (F-13).
export const revalidate = 300

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()

  const t = getDictionary(locale)
  const settings = await getSiteSettings(locale).catch(() => null)
  // GA4 (spec §10). No measurement ID → no tracking and no cookie banner.
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  return (
    <html lang={locale} className={`${caveat.variable} ${nunitoSans.variable}`}>
      {/* Full-height column so the footer sits at the bottom even on short pages. */}
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-surface focus:px-5 focus:py-3 focus:shadow-raised"
        >
          {t.skipToContent}
        </a>
        {showTempMarkers() && (
          <p className="bg-warm px-4 py-2 text-center text-caption font-bold text-on-warm">{t.staging}</p>
        )}
        <SiteHeader locale={locale} whatsappNumber={settings?.whatsappNumber} />
        <main id="main" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <SiteFooter locale={locale} settings={settings} analyticsEnabled={Boolean(gaId)} />
        {gaId && <Analytics gaId={gaId} locale={locale} t={t.cookies} privacyHref={href('privacy', locale, 'cookies')} />}
      </body>
    </html>
  )
}
