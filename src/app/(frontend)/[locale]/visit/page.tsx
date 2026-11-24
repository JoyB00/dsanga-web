import type { Metadata } from 'next'
import { Accessibility, Bus, Car, Info, MapPin } from 'lucide-react'

import { CmsImage } from '@/components/ui/CmsImage'
import { FaqList } from '@/components/ui/FaqList'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getPageHead } from '@/lib/pageHead'
import { getSiteSettings } from '@/lib/payload'
import { getFaqs } from '@/lib/queries'
import type { Faq } from '@/payload-types'

const TOPIC_ORDER: Faq['topic'][] = ['general', 'visit', 'pool', 'dining', 'work', 'events']
import { PageHero } from '@/components/ui/PageHero'
import { Section, SectionHeader } from '@/components/ui/Section'
import { InfoCard, Panel } from '@/components/ui/InfoCard'
import { WhatsAppButton, WhatsAppNotice } from '@/components/ui/WhatsAppButton'
import { pageMetadata } from '@/lib/seo'
import { temp } from '@/lib/verification'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const head = await getPageHead('visit', locale)
  return pageMetadata({
    key: 'visit',
    locale,
    title: head.title,
    description: head.intro || head.tagline,
    image: head.image,
  })
}

/** Visit Us (spec-layout-v2 §6.2): map + address over the hero edge, hours + getting here, FAQ by topic. */
export default async function VisitPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const head = await getPageHead('visit', locale)
  const [settings, faqs] = await Promise.all([
    getSiteSettings(locale).catch(() => null),
    getFaqs(locale),
  ])
  const wa = settings?.whatsappNumber
  const faqGroups = TOPIC_ORDER.map((topic) => ({
    topic,
    items: faqs.filter((f) => f.topic === topic),
  })).filter((g) => g.items.length > 0)

  return (
    <>
      <PageHero
        {...temp(head)}
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: head.title }]}
        title={head.title}
        tagline={head.tagline}
        intro={head.intro}
        image={head.image}
        actions={
          <>
            {settings?.mapsUrl && (
              <a
                href={settings.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-track="map_click"
                className="btn-primary"
              >
                <MapPin className="size-5" aria-hidden="true" />
                {t.cta.getDirections}
              </a>
            )}
            <WhatsAppButton number={wa} locale={locale} label={t.cta.contactUs} variant="glass" />
          </>
        }
      />

      {/* Map + address card over the wave */}
      <section className="relative z-10 -mt-14 md:-mt-20">
        <div className="container-content grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <div className="overflow-hidden rounded-media border-4 border-surface shadow-raised">
            {settings?.mapEmbedUrl ? (
              <iframe
                title={t.visit.title}
                src={settings.mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-[4/3] w-full border-0"
              />
            ) : (
              <CmsImage placeholder={t.visit.mapPlaceholder} className="aspect-[4/3] w-full" />
            )}
          </div>
          <Panel className="flex flex-col gap-5 shadow-raised">
            {settings?.address && (
              <p className="flex gap-3">
                <span
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-highlight text-primary"
                  aria-hidden="true"
                >
                  <MapPin className="size-5" />
                </span>
                <span>
                  <strong className="block">D’Sanga Pool, Bistro &amp; Space</strong>
                  <span className="whitespace-pre-line text-muted-foreground">
                    {settings.address}
                  </span>
                </span>
              </p>
            )}
            {settings?.serviceHours && (
              <p className="text-muted-foreground">{settings.serviceHours}</p>
            )}
            <div className="mt-auto flex flex-col gap-3">
              {settings?.mapsUrl && (
                <a
                  href={settings.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track="map_click"
                  className="btn-primary"
                >
                  <MapPin className="size-5" aria-hidden="true" />
                  {t.cta.getDirections}
                </a>
              )}
              <WhatsAppButton
                number={wa}
                locale={locale}
                label={t.cta.contactUs}
                variant="outline"
              />
              <WhatsAppNotice locale={locale} />
            </div>
          </Panel>
        </div>
      </section>

      {/* Opening hours + getting here */}
      <Section tone="cream">
        <div {...temp(settings)} className="grid gap-10 lg:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-6">
            <SectionHeader center={false} title={t.visit.hoursTitle} />
            {!!settings?.openingHours?.length && (
              <div
                tabIndex={0}
                role="region"
                aria-label={t.visit.hoursTitle}
                className="overflow-x-auto rounded-card border border-border bg-surface shadow-card"
              >
                <table className="tabular-nums w-full min-w-[22rem] border-collapse text-left">
                  <thead>
                    <tr className="bg-highlight">
                      <th scope="col" className="px-4 py-3">
                        {t.visit.area}
                      </th>
                      <th scope="col" className="px-4 py-3">
                        {t.experience.weekday}
                      </th>
                      <th scope="col" className="px-4 py-3">
                        {t.experience.weekend}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.openingHours.map((row) => (
                      <tr key={row.id ?? row.area} className="border-t border-border">
                        <th scope="row" className="px-4 py-3 font-semibold">
                          {row.area}
                        </th>
                        <td className="px-4 py-3">{row.weekday}</td>
                        <td className="px-4 py-3">{row.weekend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {settings?.specialHours && (
              <p className="flex items-start gap-3 rounded-card border-2 border-primary bg-surface p-4">
                <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <strong>{t.visit.specialHours}:</strong> {settings.specialHours}
                </span>
              </p>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-6">
            <SectionHeader center={false} title={t.visit.gettingHereTitle} />
            <div className="flex flex-col gap-4">
              {settings?.parking && (
                <InfoCard icon={Car} label={t.visit.parking}>
                  {settings.parking}
                </InfoCard>
              )}
              {settings?.transport && (
                <InfoCard icon={Bus} label={t.visit.transport}>
                  <span className="whitespace-pre-line">{settings.transport}</span>
                </InfoCard>
              )}
              {settings?.accessibility && (
                <InfoCard icon={Accessibility} label={t.visit.accessibility}>
                  {settings.accessibility}
                </InfoCard>
              )}
            </div>
          </div>
        </div>
      </Section>

      {/* Central FAQ, grouped by topic (F-10) */}
      {faqGroups.length > 0 && (
        <Section tone="alt">
          <SectionHeader
            eyebrow={t.experience.faq}
            title={t.visit.faqTitle}
            intro={t.visit.faqIntro}
          />
          <div className="mx-auto grid w-full max-w-3xl gap-6">
            {faqGroups.map((group, i) => (
              <Panel key={group.topic} className="md:py-6">
                <h3 className="mb-2 font-sans text-caption font-bold tracking-[0.16em] text-accent-text uppercase">
                  {t.visit.topics[group.topic]}
                </h3>
                <FaqList faqs={group.items} openFirst={i === 0} />
              </Panel>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}
