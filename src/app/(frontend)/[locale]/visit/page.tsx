import { Accessibility, Bus, Car, Info, MapPin } from 'lucide-react'
import type { Metadata } from 'next'

import { CmsImage } from '@/components/ui/CmsImage'
import { FaqList } from '@/components/ui/FaqList'
import { InfoCard } from '@/components/ui/InfoCard'
import { PageHeader } from '@/components/ui/PageHero'
import { Section } from '@/components/ui/Section'
import { WhatsAppButton, WhatsAppNotice } from '@/components/ui/WhatsAppButton'
import { LocalBusinessJsonLd } from '@/components/LocalBusinessJsonLd'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getPageHead } from '@/lib/pageHead'
import { getSiteSettings } from '@/lib/payload'
import { getFaqs } from '@/lib/queries'
import type { Faq } from '@/payload-types'
import { pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

const TOPIC_ORDER: Faq['topic'][] = ['general', 'visit', 'pool', 'dining', 'work', 'events']

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const head = await getPageHead('visit', locale)
  return pageMetadata({ key: 'visit', locale, title: head.title, description: head.intro || head.tagline, image: head.image })
}

export default async function VisitPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const head = await getPageHead('visit', locale)
  const [settings, faqs] = await Promise.all([getSiteSettings(locale).catch(() => null), getFaqs(locale)])
  const wa = settings?.whatsappNumber
  const faqGroups = TOPIC_ORDER.map((topic) => ({ topic, items: faqs.filter((f) => f.topic === topic) })).filter(
    (g) => g.items.length > 0,
  )

  return (
    <>
      <LocalBusinessJsonLd locale={locale} settings={settings} description={head.intro} image={head.image} />
      <PageHeader
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: head.title }]}
        title={head.title}
        tagline={head.tagline}
      />

      {/* Map + address card */}
      <section className="pb-section-mobile md:pb-section">
        <div className="container-content grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {settings?.mapEmbedUrl ? (
            <iframe
              title={t.visit.title}
              src={settings.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-[4/3] w-full rounded-media border-0"
            />
          ) : (
            <CmsImage placeholder={t.visit.mapPlaceholder} className="aspect-[4/3] w-full rounded-media" />
          )}
          <div className="card flex flex-col gap-5 p-6 md:p-8">
            {settings?.address && (
              <p className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <strong className="block">D’Sanga Pool, Bistro &amp; Space</strong>
                  <span className="whitespace-pre-line text-muted-foreground">{settings.address}</span>
                </span>
              </p>
            )}
            {settings?.serviceHours && <p className="text-muted-foreground">{settings.serviceHours}</p>}
            <div className="mt-auto flex flex-col gap-3">
              {settings?.mapsUrl && (
                <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer" data-track="map_click" className="btn-primary">
                  <MapPin className="size-5" aria-hidden="true" />
                  {t.cta.getDirections}
                </a>
              )}
              <WhatsAppButton number={wa} locale={locale} label={t.cta.contactUs} variant="outline" />
              <WhatsAppNotice locale={locale} />
            </div>
          </div>
        </div>
      </section>

      {/* Opening hours + getting here */}
      <Section alt>
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <h2>{t.visit.hoursTitle}</h2>
            {!!settings?.openingHours?.length && (
              <div className="overflow-x-auto rounded-card bg-surface shadow-card">
                <table className="w-full min-w-[22rem] border-collapse text-left">
                  <thead>
                    <tr className="border-b-2 border-primary">
                      <th scope="col" className="px-4 py-3">{t.visit.area}</th>
                      <th scope="col" className="px-4 py-3">{t.experience.weekday}</th>
                      <th scope="col" className="px-4 py-3">{t.experience.weekend}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.openingHours.map((row) => (
                      <tr key={row.id ?? row.area} className="border-b border-border last:border-0">
                        <th scope="row" className="px-4 py-3 font-semibold">{row.area}</th>
                        <td className="px-4 py-3">{row.weekday}</td>
                        <td className="px-4 py-3">{row.weekend}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {settings?.specialHours && (
              <p className="card flex items-start gap-3 border-2 border-primary p-4">
                <Info className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <strong>{t.visit.specialHours}:</strong> {settings.specialHours}
                </span>
              </p>
            )}
          </div>
          <div className="flex flex-col gap-5">
            <h2>{t.visit.gettingHereTitle}</h2>
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
        <Section eyebrow={t.experience.faq} title={t.visit.faqTitle} intro={t.visit.faqIntro}>
          <div className="grid max-w-3xl gap-8">
            {faqGroups.map((group, i) => (
              <div key={group.topic} className="flex flex-col gap-2">
                <h3 className="eyebrow">{t.visit.topics[group.topic]}</h3>
                <FaqList faqs={group.items} openFirst={i === 0} />
              </div>
            ))}
          </div>
        </Section>
      )}
    </>
  )
}
