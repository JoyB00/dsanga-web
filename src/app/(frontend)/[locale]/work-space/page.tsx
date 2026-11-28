import type { Metadata } from 'next'
import {
  CircleCheck,
  Coffee,
  Laptop,
  Sofa,
  Trees,
  Users,
  Wifi,
  type LucideIcon,
} from 'lucide-react'
import { notFound } from 'next/navigation'

import { FactsStrip } from '@/components/ui/FactsStrip'
import { FaqList } from '@/components/ui/FaqList'
import { RichText } from '@/components/ui/RichText'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getSiteSettings } from '@/lib/payload'
import { getExperience, getFaqs } from '@/lib/queries'
import { PageHero } from '@/components/ui/PageHero'
import { Section, SectionHeader } from '@/components/ui/Section'
import { Panel } from '@/components/ui/InfoCard'
import { WhatsAppButton, WhatsAppNotice } from '@/components/ui/WhatsAppButton'
import { pageMetadata } from '@/lib/seo'
import { priceText } from '@/lib/price'
import { temp } from '@/lib/verification'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const exp = await getExperience('work-space', locale)
  // The SEO tab title (if filled in) already ends with "— D’Sanga", so it is used as-is.
  return pageMetadata({
    key: 'workSpace',
    locale,
    title: exp?.meta?.title || exp?.title || getDictionary(locale).nav.workSpace,
    absoluteTitle: Boolean(exp?.meta?.title),
    description: exp?.meta?.description || exp?.summary,
    image: exp?.meta?.image || exp?.heroImage,
  })
}

/** Pick a fitting icon for a facility label; falls back to a check mark (same as the live page). */
const iconFor = (label: string): LucideIcon => {
  const l = label.toLowerCase()
  if (l.includes('wi-fi') || l.includes('wifi')) return Wifi
  if (l.includes('meeting') || l.includes('rapat')) return Users
  if (l.includes('coffee') || l.includes('kopi') || l.includes('food') || l.includes('makan'))
    return Coffee
  if (l.includes('desk') || l.includes('meja')) return Laptop
  if (l.includes('calm') || l.includes('quiet') || l.includes('tenang')) return Trees
  if (l.includes('lounge') || l.includes('sofa')) return Sofa
  return CircleCheck
}

/** Work & Space (spec-layout-v2 §6.2): facilities over the hero edge, rates on dark (each with its own WhatsApp button), FAQ. */
export default async function WorkSpacePage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const [work, settings, faqs] = await Promise.all([
    getExperience('work-space', locale),
    getSiteSettings(locale).catch(() => null),
    getFaqs(locale, ['work']),
  ])
  if (!work) notFound()

  const wa = settings?.whatsappNumber
  const topic = work.whatsappContext || work.title
  const rates = work.prices ?? []

  return (
    <>
      <PageHero
        {...temp(work)}
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: work.title }]}
        title={work.title}
        tagline={work.tagline}
        intro={work.summary}
        image={work.heroImage}
        actions={
          <>
            <WhatsAppButton
              number={wa}
              locale={locale}
              topic={topic}
              label={t.cta.checkAvailability}
            />
            <a href="#rates" className="btn-glass">
              {t.cta.viewDetails}
            </a>
          </>
        }
      />

      <FactsStrip
        label={t.experience.facilities}
        facts={(work.facilities ?? []).map((f) => ({ icon: iconFor(f.label), value: f.label }))}
      />

      {/* Rates: the page's one dark section */}
      {rates.length > 0 && (
        <Section
          id="rates"
          tone="dark"
          image={work.gallery?.[0] ?? work.heroImage}
          className="mt-16 md:mt-24"
        >
          <SectionHeader dark eyebrow={t.work.ratesEyebrow} title={t.work.ratesTitle} />
          <ul data-stagger className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-5">
            {rates.map((rate) => (
              <li
                key={rate.id ?? rate.label}
                {...temp(work)}
                className="flex flex-col gap-3 rounded-card border border-white/15 bg-primary/90 p-6"
              >
                <h3 className="text-[24px] leading-tight font-bold text-white">{rate.label}</h3>
                {priceText(rate, 'weekday', locale) && (
                  <p className="font-display text-[40px] leading-none font-bold text-accent-on-dark lining-nums">
                    {priceText(rate, 'weekday', locale)}
                    {rate.unit && (
                      <span className="ml-2 font-sans text-body font-semibold text-white/70">
                        {rate.unit}
                      </span>
                    )}
                  </p>
                )}
                <WhatsAppButton
                  number={wa}
                  locale={locale}
                  topic={`${topic} – ${rate.label}`}
                  intent="booking"
                  askPrice={!priceText(rate, 'weekday', locale)}
                  label={t.cta.bookViaWhatsApp}
                  context={rate.label}
                  variant="gold"
                  className="mt-auto w-full"
                />
              </li>
            ))}
          </ul>
          {(work.capacity || work.terms) && (
            <div className="grid gap-6 rounded-card border border-white/15 bg-primary/90 p-6 text-white/85 md:grid-cols-2">
              {work.capacity && (
                <div>
                  <strong className="block text-white">{t.work.capacity}</strong>
                  <p>{work.capacity}</p>
                </div>
              )}
              {work.terms && (
                <div>
                  <strong className="block text-white">{t.work.terms}</strong>
                  <RichText data={work.terms} className="text-white/85 [&_*]:text-white/85" />
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      <Section tone="alt">
        <div className="flex flex-col items-center gap-5 text-center">
          <SectionHeader
            eyebrow={t.work.askEyebrow}
            title={t.work.askTitle}
            intro={t.work.askText}
          />
          <WhatsAppButton
            number={wa}
            locale={locale}
            topic={topic}
            label={t.cta.checkAvailability}
          />
          <WhatsAppNotice locale={locale} />
        </div>
      </Section>

      {faqs.length > 0 && (
        <Section tone="cream">
          <SectionHeader eyebrow={t.experience.faq} title={t.work.faqTitle} />
          <Panel className="mx-auto w-full max-w-3xl md:py-4">
            <FaqList faqs={faqs} />
          </Panel>
        </Section>
      )}
    </>
  )
}
