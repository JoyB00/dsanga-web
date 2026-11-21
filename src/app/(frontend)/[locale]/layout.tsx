import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import '../globals.css'
import { caveat, nunitoSans } from '../fonts'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { isLocale, locales } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getSiteSettings } from '@/lib/payload'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: { default: 'D’Sanga Pool, Bistro & Space', template: '%s — D’Sanga' },
  description: 'Pool, bistro, working space, playground and community events in Sukawati, Bali.',
}

// Pages are prerendered, then refreshed from the CMS at most every 60 seconds.
// (On-demand revalidation from Payload hooks can replace this later.)
export const revalidate = 60

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
        <SiteHeader locale={locale} whatsappNumber={settings?.whatsappNumber} />
        <main id="main" tabIndex={-1} className="flex-1">
          {children}
        </main>
        <SiteFooter locale={locale} settings={settings} />
      </body>
    </html>
  )
}
