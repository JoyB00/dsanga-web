import type { Metadata } from 'next'
import { Clock, Ticket } from 'lucide-react'
import Link from 'next/link'

import { AvailabilityBadge } from '@/components/ui/AvailabilityBadge'
import { CmsImage } from '@/components/ui/CmsImage'
import { RichText } from '@/components/ui/RichText'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'
import { getPageHead } from '@/lib/pageHead'
import { getSiteSettings } from '@/lib/payload'
import { getActivities } from '@/lib/queries'
import { Catalog } from '@/components/ui/Catalog'
import { OverlayCard } from '@/components/ui/OverlayCard'
import { PageHero } from '@/components/ui/PageHero'
import { Section, SectionHeader } from '@/components/ui/Section'
import { CtaBand } from '@/components/ui/CtaBand'
import { InfoCard } from '@/components/ui/InfoCard'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { pageMetadata } from '@/lib/seo'
import { temp } from '@/lib/verification'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const head = await getPageHead('activities', locale)
  return pageMetadata({
    key: 'activities',
    locale,
    title: head.title,
    description: head.intro || head.tagline,
    image: head.image,
  })
}

/** Activities (spec-layout-v2 §6.2): filterable photo-card catalog, then one detail block per activity. */
export default async function ActivitiesPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const head = await getPageHead('activities', locale)
  const [activities, settings] = await Promise.all([
    getActivities(locale),
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
        actions={
          <a href="#all" className="btn-primary">
            {t.cta.viewAll}
          </a>
        }
      />

      {/* All activities; hidden ones never load (F-02) */}
      <Section id="all" tone="alt">
        <SectionHeader eyebrow={t.activities.allEyebrow} title={t.activities.allTitle} />
        <Catalog
          allLabel={t.catalog.all}
          resultsLabel={t.catalog.results}
          filters={[
            { value: 'available', label: t.status.available },
            { value: 'coming-soon', label: t.status.comingSoon },
          ]}
          items={activities.map((act) => ({
            id: act.id,
            type: act.availability,
            node: (
              <OverlayCard
                {...temp(act)}
                href={`#${act.key}`}
                image={act.heroImage}
                category={act.tagline || t.nav.activities}
                title={act.title}
                badge={act.availability === 'coming-soon' ? t.status.comingSoon : undefined}
                chips={
                  act.hours?.weekday
                    ? [
                        {
                          icon: (
                            <Clock className="size-3.5 text-accent-on-dark" aria-hidden="true" />
                          ),
                          text: `${t.openPrefix} ${act.hours.weekday}`,
                        },
                      ]
                    : []
                }
              />
            ),
          }))}
        />
      </Section>

      {/* One detail block per activity, reachable via #key from Home and the cards above */}
      {activities.map((act, i) => {
        const price = act.prices?.[0]
        const comingSoon = act.availability === 'coming-soon'
        return (
          <Section key={act.id} id={act.key} {...temp(act)} tone={i % 2 ? 'white' : 'cream'}>
            <div className="grid items-start gap-10 lg:grid-cols-2">
              <div className={cn('group', i % 2 === 1 && 'lg:order-2')}>
                <div className="zoom-media overflow-hidden rounded-media">
                  <CmsImage
                    media={act.heroImage}
                    placeholder={`${t.experience.photo} · ${act.title}`}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="aspect-[4/3] w-full"
                  />
                </div>
              </div>
              <div className="flex flex-col items-start gap-5">
                <AvailabilityBadge availability={act.availability} locale={locale} />
                <h2 className="text-[34px] leading-[1.08] font-bold text-foreground md:text-[44px]">
                  {act.title}
                </h2>
                {act.tagline && (
                  <p className="font-display-italic text-[22px] text-accent-text">{act.tagline}</p>
                )}
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
                    />
                  </>
                ) : (
                  <>
                    {(act.hours?.weekday || price) && (
                      <div className="grid w-full gap-4 sm:grid-cols-2">
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
                        <h3 className="font-sans text-body-lg font-extrabold">
                          {t.activities.rules}
                        </h3>
                        <RichText data={act.rules} />
                      </div>
                    )}
                    {act.childPolicy && (
                      <div className="flex flex-col gap-2">
                        <h3 className="font-sans text-body-lg font-extrabold">
                          {t.experience.childPolicy}
                        </h3>
                        <RichText data={act.childPolicy} />
                      </div>
                    )}
                    <WhatsAppButton
                      number={wa}
                      locale={locale}
                      topic={act.whatsappContext || act.title}
                      label={t.cta.bookViaWhatsApp}
                    />
                  </>
                )}
              </div>
            </div>
          </Section>
        )
      })}

      <CtaBand
        locale={locale}
        eyebrow={t.home.ctaEyebrow}
        title={t.home.ctaTitle}
        text={t.home.ctaText}
      >
        <WhatsAppButton number={wa} locale={locale} label={t.home.chatWhatsApp} variant="gold" />
        <Link href={href('events', locale)} className="btn-outline-light">
          {t.nav.events}
        </Link>
      </CtaBand>
    </>
  )
}
