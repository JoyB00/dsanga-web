import type { Metadata } from 'next'
import { Baby, CircleCheck, Clock, ShieldCheck, Ticket } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { FactsStrip, type Fact } from '@/components/ui/FactsStrip'
import { PhotoMosaic } from '@/components/ui/PhotoMosaic'
import { FaqList } from '@/components/ui/FaqList'
import { PriceTable } from '@/components/ui/PriceTable'
import { RichText } from '@/components/ui/RichText'
import { WhatsAppIcon } from '@/components/WhatsAppIcon'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { asMedia } from '@/lib/media'
import { getSiteSettings } from '@/lib/payload'
import { getExperience, getFaqs } from '@/lib/queries'
import { PageHero } from '@/components/ui/PageHero'
import { Section, SectionHeader } from '@/components/ui/Section'
import { CtaBand } from '@/components/ui/CtaBand'
import { Panel } from '@/components/ui/InfoCard'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { pageMetadata } from '@/lib/seo'
import { priceText } from '@/lib/price'
import { whatsappUrl } from '@/lib/whatsapp'
import { temp } from '@/lib/verification'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const exp = await getExperience('pool', locale)
  // The SEO tab title (if filled in) already ends with "— D’Sanga", so it is used as-is.
  return pageMetadata({
    key: 'pool',
    locale,
    title: exp?.meta?.title || exp?.title || getDictionary(locale).nav.pool,
    absoluteTitle: Boolean(exp?.meta?.title),
    description: exp?.meta?.description || exp?.summary,
    image: exp?.meta?.image || exp?.heroImage,
  })
}

/** Pool (spec-layout-v2 §6.2): quick info over the hero edge, photos, facilities + tickets, rules, FAQ, CTA. */
export default async function PoolPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const [pool, settings, faqs] = await Promise.all([
    getExperience('pool', locale),
    getSiteSettings(locale).catch(() => null),
    getFaqs(locale, ['pool']),
  ])
  if (!pool) notFound()

  const wa = settings?.whatsappNumber
  const topic = pool.whatsappContext || pool.title
  const prices = pool.prices ?? []
  const firstPrice = prices[0] && priceText(prices[0], 'weekday', locale)
  const hasPrices = prices.some((p) => priceText(p, 'weekday', locale) || priceText(p, 'weekend', locale))
  const book = { number: wa, locale, topic, intent: 'booking', askPrice: !hasPrices } as const
  const gallery = asMedia(pool.gallery)
  const facts: Fact[] = [
    ...(pool.hours?.weekday
      ? [
          {
            icon: Clock,
            label: t.experience.hours,
            value: pool.hours.weekday,
            note:
              pool.hours.weekend && pool.hours.weekend !== pool.hours.weekday
                ? `${t.experience.weekend}: ${pool.hours.weekend}`
                : undefined,
          },
        ]
      : []),
    ...(firstPrice
      ? [
          {
            icon: Ticket,
            label: t.experience.ticket,
            value: firstPrice,
            note: `${prices[0].label} · ${t.experience.weekday}`,
          },
        ]
      : []),
    ...(pool.facilities?.length
      ? [
          {
            icon: CircleCheck,
            label: t.experience.facilities,
            value: pool.facilities.length,
            note: pool.facilities.map((f) => f.label).join(', '),
          },
        ]
      : []),
    {
      icon: WhatsAppIcon,
      label: t.experience.booking,
      value: 'WhatsApp',
      note: whatsappUrl(wa, locale, topic) ? (
        <WhatsAppButton
          {...book}
          label={t.experience.bookingText}
          variant="link"
        />
      ) : (
        t.experience.bookingText
      ),
    },
  ]

  return (
    <>
      <PageHero
        {...temp(pool)}
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: pool.title }]}
        eyebrow={t.experience.information}
        title={pool.title}
        tagline={pool.tagline}
        intro={pool.summary}
        image={pool.heroImage}
        actions={
          <>
            <WhatsAppButton
              {...book}
              label={t.cta.bookViaWhatsApp}
            />
            <a href="#info" className="btn-glass">
              {t.cta.viewDetails}
            </a>
          </>
        }
      />

      <FactsStrip id="info" label={t.pool.infoTitle} facts={facts} />

      {gallery.length >= 4 && (
        <Section className="!pb-0">
          <PhotoMosaic photos={gallery} />
        </Section>
      )}

      {/* Facilities + tickets */}
      <Section tone="cream">
        <div className="grid gap-12 lg:grid-cols-2">
          {!!pool.facilities?.length && (
            <div className="flex min-w-0 flex-col gap-6">
              <SectionHeader
                center={false}
                eyebrow={t.experience.facilities}
                title={t.pool.facilitiesTitle}
              />
              <ul className="grid gap-3 sm:grid-cols-2">
                {pool.facilities.map((f) => (
                  <li
                    key={f.id ?? f.label}
                    className="flex items-center gap-3 rounded-card bg-surface px-4 py-3.5 shadow-card"
                  >
                    <CircleCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {hasPrices && (
            <div className="flex min-w-0 flex-col gap-6">
              <SectionHeader
                center={false}
                eyebrow={t.experience.prices}
                title={t.pool.ticketsTitle}
              />
              <PriceTable
                rows={prices}
                locale={locale}
                labels={{
                  item: t.experience.priceItem,
                  weekday: t.experience.weekday,
                  weekend: t.experience.weekend,
                }}
              />
              {pool.paymentNote && (
                <p className="text-small text-muted-foreground">{pool.paymentNote}</p>
              )}
            </div>
          )}
        </div>
      </Section>

      {/* Safety rules + children policy */}
      {(pool.rules || pool.childPolicy) && (
        <Section tone="alt">
          <div className="grid gap-6 lg:grid-cols-2">
            {[
              pool.rules && {
                Icon: ShieldCheck,
                title: t.experience.rules,
                body: pool.rules,
                strong: false,
              },
              pool.childPolicy && {
                Icon: Baby,
                title: t.experience.childPolicy,
                body: pool.childPolicy,
                strong: true,
              },
            ]
              .filter((x): x is NonNullable<typeof x> & object => Boolean(x))
              .map(({ Icon, title, body, strong }) => (
                <Panel key={title} className={strong ? 'border-2 border-primary' : undefined}>
                  <div className="mb-4 flex items-center gap-3">
                    <span className="inline-flex size-12 items-center justify-center rounded-xl bg-highlight text-primary">
                      <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <h2 className="text-[30px] leading-tight font-bold text-foreground">{title}</h2>
                  </div>
                  <RichText data={body} />
                </Panel>
              ))}
          </div>
        </Section>
      )}

      {faqs.length > 0 && (
        <Section tone="cream">
          <SectionHeader eyebrow={t.experience.faq} title={t.pool.faqTitle} />
          <Panel className="mx-auto w-full max-w-3xl md:py-4">
            <FaqList faqs={faqs} />
          </Panel>
        </Section>
      )}

      <CtaBand locale={locale} image={gallery.at(-1)} title={t.pool.ctaTitle} text={t.pool.ctaText}>
        <WhatsAppButton
          {...book}
          label={t.cta.bookViaWhatsApp}
          variant="gold"
        />
        <Link href={href('visit', locale)} className="btn-outline-light">
          {t.home.ctaSecondary}
        </Link>
      </CtaBand>
    </>
  )
}
