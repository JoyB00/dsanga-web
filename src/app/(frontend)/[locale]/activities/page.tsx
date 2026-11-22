import { Clock, Ticket } from 'lucide-react'
import type { Metadata } from 'next'

import { AvailabilityBadge } from '@/components/ui/AvailabilityBadge'
import { CmsImage } from '@/components/ui/CmsImage'
import { InfoCard } from '@/components/ui/InfoCard'
import { PageHero } from '@/components/ui/PageHero'
import { RichText } from '@/components/ui/RichText'
import { Section } from '@/components/ui/Section'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getPageHead } from '@/lib/pageHead'
import { getSiteSettings } from '@/lib/payload'
import { getActivities } from '@/lib/queries'
import { pageMetadata } from '@/lib/seo'
import { temp } from '@/lib/verification'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const head = await getPageHead('activities', locale)
  return pageMetadata({ key: 'activities', locale, title: head.title, description: head.intro || head.tagline, image: head.image })
}

export default async function ActivitiesPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const head = await getPageHead('activities', locale)
  const [activities, settings] = await Promise.all([getActivities(locale), getSiteSettings(locale).catch(() => null)])
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
        imagePlaceholder={t.activities.heroPlaceholder}
        actions={
          <a href="#all" className="btn-primary">
            {t.cta.viewAll}
          </a>
        }
      />

      {/* All activities — status shown as text (Available / Coming Soon); hidden ones never load (F-02) */}
      <Section id="all" alt eyebrow={t.activities.allEyebrow} title={t.activities.allTitle}>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(15rem,1fr))] gap-5">
          {activities.map((act) => (
            <li key={act.id} {...temp(act)}>
              <a href={`#${act.key}`} className="card-interactive flex h-full flex-col overflow-hidden no-underline">
                <CmsImage media={act.heroImage} placeholder={act.title} className="aspect-[4/3] w-full" sizes="(min-width: 1024px) 33vw, 50vw" />
                <div className="flex flex-col gap-2 p-5">
                  <AvailabilityBadge availability={act.availability} locale={locale} className="self-start" />
                  <h3 className="text-foreground">{act.title}</h3>
                  {act.tagline && <p className="text-muted-foreground">{act.tagline}</p>}
                </div>
              </a>
            </li>
          ))}
        </ul>
      </Section>

      {/* One detail block per activity, reachable via #key from Home and the cards above */}
      {activities.map((act, i) => {
        const price = act.prices?.[0]
        const comingSoon = act.availability === 'coming-soon'
        return (
          <section key={act.id} id={act.key} {...temp(act)} className={i % 2 ? 'section section-alt scroll-mt-24' : 'section scroll-mt-24'}>
            <div className="container-content grid items-start gap-10 lg:grid-cols-2">
              <CmsImage
                media={act.heroImage}
                placeholder={`${t.experience.photo} · ${act.title}`}
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="aspect-[4/3] w-full rounded-media"
              />
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-3">
                  <h2>{act.title}</h2>
                  <AvailabilityBadge availability={act.availability} locale={locale} />
                </div>
                {act.summary && <p className="text-body-lg text-muted-foreground">{act.summary}</p>}
                {comingSoon ? (
                  <>
                    <p className="text-muted-foreground">{t.activities.comingSoonText}</p>
                    <WhatsAppButton
                      number={wa}
                      locale={locale}
                      topic={act.whatsappContext || act.title}
                      label={t.cta.contactUs}
                      variant="outline"
                      className="self-start"
                    />
                  </>
                ) : (
                  <>
                    {(act.hours?.weekday || price) && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {act.hours?.weekday && (
                          <InfoCard icon={Clock} label={t.activities.hours}>
                            {act.hours.weekday}
                          </InfoCard>
                        )}
                        {price && (
                          <InfoCard icon={Ticket} label={t.activities.price}>
                            {price.weekday} {price.unit}
                          </InfoCard>
                        )}
                      </div>
                    )}
                    {act.rules && (
                      <div className="flex flex-col gap-2">
                        <h3 className="text-body-lg">{t.activities.rules}</h3>
                        <RichText data={act.rules} />
                      </div>
                    )}
                    {act.childPolicy && (
                      <div className="flex flex-col gap-2">
                        <h3 className="text-body-lg">{t.experience.childPolicy}</h3>
                        <RichText data={act.childPolicy} />
                      </div>
                    )}
                    <WhatsAppButton
                      number={wa}
                      locale={locale}
                      topic={act.whatsappContext || act.title}
                      label={t.cta.bookViaWhatsApp}
                      className="self-start"
                    />
                  </>
                )}
              </div>
            </div>
          </section>
        )
      })}
    </>
  )
}
