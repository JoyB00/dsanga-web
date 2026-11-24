import type { Metadata } from 'next'
import Link from 'next/link'

import { OfferPackageCard } from '@/components/ui/PackageCards'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'
import { getPageHead } from '@/lib/pageHead'
import { asMedia } from '@/lib/media'
import { getSiteSettings } from '@/lib/payload'
import { getActiveOffers, getHomePage } from '@/lib/queries'
import { PageHero } from '@/components/ui/PageHero'
import { Section } from '@/components/ui/Section'
import { Panel } from '@/components/ui/InfoCard'
import { CtaBand } from '@/components/ui/CtaBand'
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
  const [offers, settings, home] = await Promise.all([
    getActiveOffers(locale, 24),
    getSiteSettings(locale).catch(() => null),
    getHomePage(locale),
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
        next="alt"
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
            <ul className={cn('grid gap-6 md:gap-8', offers.length > 1 && 'md:grid-cols-2')}>
              {offers.map((offer) => (
                <li key={offer.id}>
                  <OfferPackageCard offer={offer} locale={locale} whatsapp={wa} full />
                </li>
              ))}
            </ul>
            <WhatsAppNotice locale={locale} />
          </>
        )}
      </Section>

      <CtaBand
        locale={locale}
        showNotice={false}
        image={asMedia(home?.gallery?.photos).at(-1)}
        eyebrow={home?.cta?.eyebrow || t.home.ctaEyebrow}
        title={home?.cta?.title || t.home.ctaTitle}
        text={home?.cta?.text || t.home.ctaText}
      >
        <WhatsAppButton
          number={settings?.whatsappNumber}
          locale={locale}
          label={t.home.chatWhatsApp}
          variant="gold"
        />
        <Link href={href('visit', locale)} className="btn-outline-light">
          {t.home.ctaSecondary}
        </Link>
      </CtaBand>
    </>
  )
}
