import { CircleCheck, Clock, ShieldCheck, Baby, Ticket } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { WhatsAppIcon } from '@/components/WhatsAppIcon'
import { CmsImage } from '@/components/ui/CmsImage'
import { FaqList } from '@/components/ui/FaqList'
import { InfoCard } from '@/components/ui/InfoCard'
import { PageHero } from '@/components/ui/PageHero'
import { PriceTable } from '@/components/ui/PriceTable'
import { RichText } from '@/components/ui/RichText'
import { Section } from '@/components/ui/Section'
import { WhatsAppButton, WhatsAppNotice } from '@/components/ui/WhatsAppButton'
import { href, isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getSiteSettings } from '@/lib/payload'
import { getExperience, getFaqs } from '@/lib/queries'
import { whatsappUrl } from '@/lib/whatsapp'
import { pageMetadata } from '@/lib/seo'
import { temp } from '@/lib/verification'

type Props = { params: Promise<{ locale: string }> }

const resolve = async (params: Props['params']): Promise<Locale> => {
  const { locale } = await params
  return isLocale(locale) ? locale : 'en'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolve(params)
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

export default async function PoolPage({ params }: Props) {
  const locale = await resolve(params)
  const t = getDictionary(locale)
  const [pool, settings, faqs] = await Promise.all([
    getExperience('pool', locale),
    getSiteSettings(locale).catch(() => null),
    getFaqs(locale, ['pool']),
  ])
  if (!pool) notFound()

  const wa = settings?.whatsappNumber
  const topic = pool.whatsappContext || pool.title
  const waLink = whatsappUrl(wa, locale, topic)
  const firstPrice = pool.prices?.[0]
  const gallery = (pool.gallery ?? []).slice(0, 4)
  const galleryItems = gallery.length ? gallery : t.pool.galleryPlaceholders.map(() => null)

  return (
    <>
      <PageHero
        {...temp(pool)}
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: pool.title }]}
        title={pool.title}
        tagline={pool.tagline}
        intro={pool.summary}
        image={pool.heroImage}
        imagePlaceholder={t.pool.heroPlaceholder}
        actions={
          <>
            <a href="#info" className="btn-outline">
              {t.cta.viewDetails}
            </a>
            <WhatsAppButton number={wa} locale={locale} topic={topic} label={t.cta.bookViaWhatsApp} />
          </>
        }
      />

      <div className="container-content -mt-4 pb-4">
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {galleryItems.map((media, i) => (
            <li key={typeof media === 'object' && media ? media.id : i} {...temp(media)}>
              <CmsImage
                media={media}
                placeholder={t.pool.galleryPlaceholders[i] ?? t.experience.photo}
                size="thumb"
                sizes="(min-width: 768px) 25vw, 50vw"
                className="aspect-[16/10] w-full rounded-card"
              />
            </li>
          ))}
        </ul>
      </div>

      {/* Quick-info strip (spec §4) */}
      <section id="info" className="section-alt py-10" aria-labelledby="pool-info">
        <div className="container-content flex flex-col gap-5">
          <h2 id="pool-info">{t.pool.infoTitle}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard icon={Clock} label={t.experience.hours}>
              {pool.hours?.weekday}
              {pool.hours?.weekend && pool.hours.weekend !== pool.hours.weekday && (
                <span className="block text-small">
                  {t.experience.weekend}: {pool.hours.weekend}
                </span>
              )}
            </InfoCard>
            {firstPrice && (
              <InfoCard icon={Ticket} label={t.experience.ticket}>
                {t.experience.from} {firstPrice.weekday} {firstPrice.unit}
              </InfoCard>
            )}
            {!!pool.facilities?.length && (
              <InfoCard icon={CircleCheck} label={t.experience.facilities}>
                {pool.facilities.map((f) => f.label).join(', ')}
              </InfoCard>
            )}
            <InfoCard icon={WhatsAppGlyph} label={t.experience.booking}>
              {waLink ? (
                <a href={waLink} target="_blank" rel="noopener noreferrer" data-track="whatsapp_click" className="font-bold">
                  {t.experience.bookingText}
                </a>
              ) : (
                t.experience.bookingText
              )}
            </InfoCard>
          </div>
        </div>
      </section>

      {/* Facilities + prices */}
      <section className="section">
        <div className="container-content grid gap-12 lg:grid-cols-2">
          {!!pool.facilities?.length && (
            <div className="flex flex-col gap-5">
              <span className="eyebrow">{t.experience.facilities}</span>
              <h2>{t.pool.facilitiesTitle}</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {pool.facilities.map((f) => (
                  <li key={f.id ?? f.label} className="flex items-center gap-2 text-body">
                    <CircleCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!!pool.prices?.length && (
            <div className="flex flex-col gap-5">
              <span className="eyebrow">{t.experience.prices}</span>
              <h2>{t.pool.ticketsTitle}</h2>
              <PriceTable
                rows={pool.prices}
                labels={{ item: t.experience.priceItem, weekday: t.experience.weekday, weekend: t.experience.weekend }}
              />
              {pool.paymentNote && <p className="text-small text-muted-foreground">{pool.paymentNote}</p>}
            </div>
          )}
        </div>
      </section>

      {/* Safety rules + children policy */}
      {(pool.rules || pool.childPolicy) && (
        <section className="section section-alt">
          <div className="container-content grid gap-6 lg:grid-cols-2">
            {pool.rules && (
              <div className="card flex flex-col gap-4 p-8">
                <div className="flex items-center gap-3">
                  <span className="icon-circle size-12">
                    <ShieldCheck className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <h2 className="text-display-lg lg:text-display-lg">{t.experience.rules}</h2>
                </div>
                <RichText data={pool.rules} />
              </div>
            )}
            {pool.childPolicy && (
              <div className="card flex flex-col gap-4 border-2 border-primary p-8">
                <div className="flex items-center gap-3">
                  <span className="icon-circle size-12">
                    <Baby className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <h2 className="text-display-lg lg:text-display-lg">{t.experience.childPolicy}</h2>
                </div>
                <RichText data={pool.childPolicy} />
              </div>
            )}
          </div>
        </section>
      )}

      {faqs.length > 0 && (
        <Section eyebrow={t.experience.faq} title={t.pool.faqTitle}>
          <div className="max-w-3xl">
            <FaqList faqs={faqs} />
          </div>
        </Section>
      )}

      {/* Closing CTA with the “not a confirmation” notice (spec §6) */}
      <section className="pb-section-mobile md:pb-section">
        <div className="container-content">
          <div className="card flex flex-wrap items-center justify-between gap-6 bg-surface-alt p-8 md:p-10">
            <div className="flex max-w-2xl flex-col gap-3">
              <h2 className="text-display-lg lg:text-display-lg">{t.pool.ctaTitle}</h2>
              <p className="text-body-lg text-muted-foreground">{t.pool.ctaText}</p>
              <WhatsAppNotice locale={locale} />
            </div>
            <WhatsAppButton number={wa} locale={locale} topic={topic} label={t.cta.bookViaWhatsApp} />
          </div>
        </div>
      </section>
    </>
  )
}

/** Lucide has no WhatsApp glyph; adapt ours to the InfoCard icon prop. */
function WhatsAppGlyph({ className }: { className?: string }) {
  return <WhatsAppIcon className={className} />
}
