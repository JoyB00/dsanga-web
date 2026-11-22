import { ChevronDown } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { CmsImage } from '@/components/ui/CmsImage'
import { PageHeader } from '@/components/ui/PageHero'
import { RichText } from '@/components/ui/RichText'
import { WhatsAppButton, WhatsAppNotice } from '@/components/ui/WhatsAppButton'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getPageHead } from '@/lib/pageHead'
import { formatDate, formatRupiah } from '@/lib/format'
import { getSiteSettings } from '@/lib/payload'
import { getActiveOffers } from '@/lib/queries'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const head = await getPageHead('offers', await localeFromParams(params))
  return { title: head.title, description: head.intro || head.tagline }
}

export default async function OffersPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const head = await getPageHead('offers', locale)
  // Only offers inside their validity window are returned (access rules, F-13).
  const [offers, settings] = await Promise.all([getActiveOffers(locale, 24), getSiteSettings(locale).catch(() => null)])
  const wa = settings?.whatsappNumber

  return (
    <>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: head.title }]}
        title={head.title}
        intro={head.intro}
      />

      <section className="pb-section-mobile md:pb-section">
        <div className="container-content flex flex-col gap-6">
          {offers.length === 0 ? (
            <div className="card flex flex-wrap items-center justify-between gap-4 bg-surface-alt p-8">
              <div className="flex flex-col gap-1">
                <h2 className="text-display-lg lg:text-display-lg">{t.offers.emptyTitle}</h2>
                <p className="text-muted-foreground">{t.offers.emptyText}</p>
              </div>
              <Link href={href('events', locale)} className="btn-outline">
                {t.nav.events}
              </Link>
            </div>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <li key={offer.id} className="card flex flex-col overflow-hidden">
                  <CmsImage media={offer.image} placeholder={offer.title} className="aspect-video w-full" sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" />
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      {offer.category && <span className="badge-tag">{offer.category}</span>}
                      <span className="badge-validity">
                        {t.offers.valid} {formatDate(offer.validFrom, locale)} – {formatDate(offer.validUntil, locale)}
                      </span>
                    </div>
                    <h2 className="text-h3 font-sans font-extrabold text-foreground lg:text-h3">{offer.title}</h2>
                    {offer.summary && <p className="text-muted-foreground">{offer.summary}</p>}
                    {offer.price != null && (
                      <p className="flex flex-wrap items-baseline gap-2">
                        <strong className="text-h3 text-primary">{formatRupiah(offer.price)}</strong>
                        {offer.priceUnit && <span className="text-muted-foreground">{offer.priceUnit}</span>}
                        {offer.originalPrice != null && offer.originalPrice > offer.price && (
                          <s className="text-muted-foreground">{formatRupiah(offer.originalPrice)}</s>
                        )}
                      </p>
                    )}
                    {offer.terms && (
                      <details className="group">
                        <summary className="flex min-h-touch cursor-pointer list-none items-center gap-2 font-bold [&::-webkit-details-marker]:hidden">
                          {t.offers.terms}
                          <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                        </summary>
                        <RichText data={offer.terms} className="text-small" />
                      </details>
                    )}
                    <WhatsAppButton number={wa} locale={locale} topic={offer.title} label={t.cta.bookViaWhatsApp} className="mt-auto self-start" />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {offers.length > 0 && <WhatsAppNotice locale={locale} />}
        </div>
      </section>
    </>
  )
}
