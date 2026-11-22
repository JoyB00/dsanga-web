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

import { FaqList } from '@/components/ui/FaqList'
import { InquiryForm } from '@/components/ui/InquiryForm'
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

/** Work & Space (spec-layout-v2 §6.2): facilities over the hero edge, rates on dark, enquiry form, FAQ. */
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

      {!!work.facilities?.length && (
        <section aria-label={t.experience.facilities} className="relative z-10 -mt-10">
          <ul className="container-content grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5 lg:gap-4">
            {work.facilities.map((f) => {
              const Icon = iconFor(f.label)
              return (
                <li
                  key={f.id ?? f.label}
                  className="flex flex-col items-center gap-3 rounded-card border border-border bg-surface p-5 text-center shadow-card"
                >
                  <span
                    className="inline-flex size-12 items-center justify-center rounded-xl bg-highlight text-primary"
                    aria-hidden="true"
                  >
                    <Icon className="size-6" strokeWidth={1.75} />
                  </span>
                  <span className="font-bold text-foreground">{f.label}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Rates: the page's one dark section */}
      {rates.length > 0 && (
        <Section id="rates" tone="dark" className="mt-16 md:mt-24">
          <SectionHeader dark eyebrow={t.work.ratesEyebrow} title={t.work.ratesTitle} />
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-5">
            {rates.map((rate) => (
              <li
                key={rate.id ?? rate.label}
                {...temp(work)}
                className="flex flex-col gap-3 rounded-card border border-white/10 bg-primary p-6"
              >
                <h3 className="text-[24px] leading-tight font-bold text-white">{rate.label}</h3>
                <p className="font-display text-[40px] leading-none font-bold text-accent-on-dark">
                  {rate.weekday}
                  {rate.unit && (
                    <span className="ml-2 font-sans text-body font-semibold text-white/70">
                      {rate.unit}
                    </span>
                  )}
                </p>
              </li>
            ))}
          </ul>
          {(work.capacity || work.terms) && (
            <div className="grid gap-6 rounded-card border border-white/10 bg-white/5 p-6 text-white/85 md:grid-cols-2">
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
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col items-start gap-5">
            <SectionHeader
              center={false}
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
          <Panel>
            {settings?.contactFormEnabled ? (
              <InquiryForm
                variant="work"
                locale={locale}
                t={t.form}
                privacyHref={href('privacy', locale)}
                usageOptions={rates.map((r) => r.label)}
              />
            ) : (
              <p className="text-muted-foreground">{t.contact.formOff}</p>
            )}
          </Panel>
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
