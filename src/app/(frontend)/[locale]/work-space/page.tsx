import { CircleCheck, Coffee, Laptop, Sofa, Trees, Users, Wifi, type LucideIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { FaqList } from '@/components/ui/FaqList'
import { InquiryForm } from '@/components/ui/InquiryForm'
import { PageHero } from '@/components/ui/PageHero'
import { RichText } from '@/components/ui/RichText'
import { Section } from '@/components/ui/Section'
import { WhatsAppButton, WhatsAppNotice } from '@/components/ui/WhatsAppButton'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getSiteSettings } from '@/lib/payload'
import { getExperience, getFaqs } from '@/lib/queries'
import { pageMetadata } from '@/lib/seo'
import { temp } from '@/lib/verification'

type Props = { params: Promise<{ locale: string }> }

/** Pick a fitting icon for a facility label; falls back to a check mark. */
const iconFor = (label: string): LucideIcon => {
  const l = label.toLowerCase()
  if (l.includes('wi-fi') || l.includes('wifi')) return Wifi
  if (l.includes('meeting') || l.includes('rapat')) return Users
  if (l.includes('coffee') || l.includes('kopi') || l.includes('food') || l.includes('makan')) return Coffee
  if (l.includes('desk') || l.includes('meja')) return Laptop
  if (l.includes('calm') || l.includes('quiet') || l.includes('tenang')) return Trees
  if (l.includes('lounge') || l.includes('sofa')) return Sofa
  return CircleCheck
}

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
        imagePlaceholder={t.work.heroPlaceholder}
        actions={
          <>
            <a href="#rates" className="btn-outline">
              {t.cta.viewDetails}
            </a>
            <WhatsAppButton number={wa} locale={locale} topic={topic} label={t.cta.checkAvailability} />
          </>
        }
      />

      {!!work.facilities?.length && (
        <section className="section-alt py-10" aria-label={t.experience.facilities}>
          <ul className="container-content grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-5">
            {work.facilities.map((f) => {
              const Icon = iconFor(f.label)
              return (
                <li key={f.id ?? f.label} className="flex flex-col items-center gap-3 text-center">
                  <span className="icon-circle bg-surface" aria-hidden="true">
                    <Icon className="size-6" strokeWidth={1.75} />
                  </span>
                  <span className="font-bold text-foreground">{f.label}</span>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {rates.length > 0 && (
        <Section id="rates" eyebrow={t.work.ratesEyebrow} title={t.work.ratesTitle}>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-5">
            {rates.map((rate) => (
              <li key={rate.id ?? rate.label} {...temp(work)} className="card flex flex-col gap-2 p-6">
                <h3 className="text-h3">{rate.label}</h3>
                <p className="text-h3 font-extrabold text-primary">
                  {rate.weekday}
                  {rate.unit && <span className="ml-1 text-body font-semibold text-muted-foreground">{rate.unit}</span>}
                </p>
              </li>
            ))}
          </ul>
          {(work.capacity || work.terms) && (
            <div className="card grid gap-6 p-6 md:grid-cols-2">
              {work.capacity && (
                <div>
                  <strong className="block">{t.work.capacity}</strong>
                  <p className="text-muted-foreground">{work.capacity}</p>
                </div>
              )}
              {work.terms && (
                <div>
                  <strong className="block">{t.work.terms}</strong>
                  <RichText data={work.terms} />
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      <Section alt>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col gap-4">
            <span className="eyebrow">{t.work.askEyebrow}</span>
            <h2>{t.work.askTitle}</h2>
            <p className="text-body-lg text-muted-foreground">{t.work.askText}</p>
            <WhatsAppButton number={wa} locale={locale} topic={topic} label={t.cta.checkAvailability} className="self-start" />
            <WhatsAppNotice locale={locale} />
          </div>
          {settings?.contactFormEnabled ? (
            <InquiryForm
              variant="work"
              locale={locale}
              t={t.form}
              privacyHref={href('privacy', locale)}
              usageOptions={rates.map((r) => r.label)}
            />
          ) : (
            <p className="card p-6 text-muted-foreground">{t.contact.formOff}</p>
          )}
        </div>
      </Section>

      {faqs.length > 0 && (
        <Section eyebrow={t.experience.faq} title={t.work.faqTitle}>
          <div className="max-w-3xl">
            <FaqList faqs={faqs} />
          </div>
        </Section>
      )}
    </>
  )
}
