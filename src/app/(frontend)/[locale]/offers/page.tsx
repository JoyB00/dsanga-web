import type { Metadata } from 'next'
import { CalendarDays, ChevronDown } from 'lucide-react'
import Link from 'next/link'

import { CmsImage } from '@/components/ui/CmsImage'
import { RichText } from '@/components/ui/RichText'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { formatDate, formatRupiah } from '@/lib/format'
import { getPageHead } from '@/lib/pageHead'
import { getSiteSettings } from '@/lib/payload'
import { getActiveOffers } from '@/lib/queries'
import { PageHero } from '@/components/ui/PageHero'
import { Section } from '@/components/ui/Section'
import { Panel } from '@/components/ui/InfoCard'
import { WhatsAppButton, WhatsAppNotice } from '@/components/ui/WhatsAppButton'
import { pageMetadata } from '@/lib/seo'
import { temp } from '@/lib/verification'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const head = await getPageHead('offers', locale)
  return pageMetadata({
    key: 'offers',
    locale,
    title: head.title,
    description: head.intro || head.tagline,
    image: head.image,
  })
}

/**
 * Offers (spec-layout-v2 §6.2): photo cards with the validity on the photo; price, terms and the booking
 * button below. Only offers inside their validity window are returned (F-13).
 */
export default async function OffersPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const head = await getPageHead('offers', locale)
  const [offers, settings] = await Promise.all([
    getActiveOffers(locale, 24),
    getSiteSettings(locale).catch(() => null),
  ])
  const wa = settings?.whatsappNumber

  return (
    <>
      <PageHero
        {...temp(head)}
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: head.title }]}
        title={head.title}
        tagline={head.tagline}
        intro={head.intro}
        image={head.image}
      />

      <Section tone="alt">
        {offers.length === 0 ? (
          <Panel className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-[30px] font-bold text-foreground">{t.offers.emptyTitle}</h2>
              <p className="text-muted-foreground">{t.offers.emptyText}</p>
            </div>
            <Link href={href('events', locale)} className="btn-outline">
              {t.nav.events}
            </Link>
          </Panel>
        ) : (
          <>
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {offers.map((offer) => (
                <li
                  key={offer.id}
                  {...temp(offer)}
                  className="group flex flex-col overflow-hidden rounded-card border border-border bg-surface shadow-card"
                >
                  <div className="relative">
                    <div className="zoom-media overflow-hidden">
                      <CmsImage
                        media={offer.image}
                        placeholder={offer.title}
                        size="card"
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="aspect-[16/10] w-full"
                      />
                    </div>
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-linear-to-b from-transparent from-55% to-[rgb(0_0_0/0.65)]"
                    />
                    {offer.category && (
                      <span className="absolute top-4 left-4 rounded-full bg-accent px-3 py-1 text-caption font-bold text-foreground">
                        {offer.category}
                      </span>
                    )}
                    <span className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-[rgb(0_0_0/0.6)] px-3 py-1 text-[12px] font-semibold text-white">
                      <CalendarDays className="size-3.5 text-accent-on-dark" aria-hidden="true" />
                      {t.offers.valid} {formatDate(offer.validFrom, locale)} –{' '}
                      {formatDate(offer.validUntil, locale)}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <h2 className="text-[26px] leading-tight font-bold text-foreground">
                      {offer.title}
                    </h2>
                    {offer.summary && <p className="text-muted-foreground">{offer.summary}</p>}
                    {offer.price != null && (
                      <p className="flex flex-wrap items-baseline gap-2">
                        <strong className="font-display text-[32px] leading-none text-primary">
                          {formatRupiah(offer.price)}
                        </strong>
                        {offer.priceUnit && (
                          <span className="text-muted-foreground">{offer.priceUnit}</span>
                        )}
                        {offer.originalPrice != null && offer.originalPrice > offer.price && (
                          <s className="text-muted-foreground">
                            {formatRupiah(offer.originalPrice)}
                          </s>
                        )}
                      </p>
                    )}
                    {offer.terms && (
                      <details className="group/terms rounded-xl bg-surface-alt px-4">
                        <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-2 font-bold [&::-webkit-details-marker]:hidden">
                          {t.offers.terms}
                          <ChevronDown
                            className="size-4 transition-transform group-open/terms:rotate-180"
                            aria-hidden="true"
                          />
                        </summary>
                        <RichText data={offer.terms} className="pb-4 text-small" />
                      </details>
                    )}
                    <div className="mt-auto pt-2">
                      <WhatsAppButton
                        number={wa}
                        locale={locale}
                        topic={offer.title}
                        label={t.cta.bookViaWhatsApp}
                        className="w-full"
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <WhatsAppNotice locale={locale} />
          </>
        )}
      </Section>
    </>
  )
}
