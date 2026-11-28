import type { Metadata } from 'next'
import { ArrowRight, Clock, MapPin, Users } from 'lucide-react'
import Link from 'next/link'

import { CmsImage } from '@/components/ui/CmsImage'
import { VenuePackageCard } from '@/components/ui/PackageCards'
import { WavePhoto } from '@/components/ui/WavePhoto'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'
import { formatDate, formatTime } from '@/lib/format'
import { getPageHead } from '@/lib/pageHead'
import { getSiteSettings } from '@/lib/payload'
import { getPastEvents, getUpcomingEvents, getVenuePackages } from '@/lib/queries'
import { PageHero } from '@/components/ui/PageHero'
import { Section, SectionHeader } from '@/components/ui/Section'
import { Panel } from '@/components/ui/InfoCard'
import { WhatsAppButton, WhatsAppNotice } from '@/components/ui/WhatsAppButton'
import { eventPrice } from '@/lib/price'
import { pageMetadata } from '@/lib/seo'
import { temp } from '@/lib/verification'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const head = await getPageHead('events', locale)
  return pageMetadata({
    key: 'events',
    locale,
    title: head.title,
    description: head.intro || head.tagline,
    image: head.image,
  })
}

/**
 * Events (spec-layout-v2 §6.2). Upcoming events are photo cards with a date badge on the photo; the details
 * and the "Join via WhatsApp" button sit below the photo, because a button cannot live inside a card link.
 * Past events move to the archive automatically (F-13).
 */
export default async function EventsPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const head = await getPageHead('events', locale)
  const [upcoming, past, packages, settings] = await Promise.all([
    getUpcomingEvents(locale, 20),
    getPastEvents(locale, 8),
    getVenuePackages(locale),
    getSiteSettings(locale).catch(() => null),
  ])
  const wa = settings?.whatsappNumber
  const part = (iso: string, opts: Intl.DateTimeFormatOptions) =>
    formatDate(iso, locale, { day: undefined, month: undefined, year: undefined, ...opts })

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
        actions={
          <>
            <a href="#upcoming" className="btn-primary">
              {t.cta.viewSchedule}
            </a>
            {packages.length > 0 && (
              <a href="#private" className="btn-glass">
                {t.events.privateEyebrow}
              </a>
            )}
          </>
        }
      />

      <Section id="upcoming" tone="alt">
        <SectionHeader
          center={false}
          eyebrow={t.events.upcomingEyebrow}
          title={t.events.upcomingTitle}
          action={
            <Link href={href('offers', locale)} className="btn-outline">
              {t.events.offersLink}
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          }
        />
        {upcoming.length === 0 ? (
          <Panel>
            <p className="text-muted-foreground">{t.events.noUpcoming}</p>
          </Panel>
        ) : (
          <ul data-stagger className={cn('grid gap-6 sm:grid-cols-2', upcoming.length > 2 && 'lg:grid-cols-3')}>
            {upcoming.map((ev) => (
              <li
                key={ev.id}
                {...temp(ev)}
                className="group flex flex-col overflow-hidden rounded-card bg-surface shadow-card"
              >
                <WavePhoto
                  media={ev.image}
                  placeholder={ev.title}
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                >
                  <div className="absolute top-4 left-4 flex w-16 flex-col items-center rounded-2xl bg-surface py-1.5 text-primary shadow-raised">
                    <span className="text-[12px] font-bold uppercase">
                      {part(ev.startsAt, { weekday: 'short' })}
                    </span>
                    <span className="font-display text-[30px] leading-none font-bold">
                      {part(ev.startsAt, { day: 'numeric' })}
                    </span>
                    <span className="text-[12px] font-bold uppercase">
                      {part(ev.startsAt, { month: 'short' })}
                    </span>
                  </div>
                </WavePhoto>
                <div className="relative -mt-px flex flex-1 flex-col gap-2 bg-surface px-5 pt-2 pb-5">
                  <span className="flex items-center gap-1.5 text-caption font-bold tracking-[0.12em] text-accent-text uppercase">
                    <Clock className="size-3.5" aria-hidden="true" />
                    {t.events.categories[ev.category]} · {formatTime(ev.startsAt, locale)}
                    {ev.endsAt ? `–${formatTime(ev.endsAt, locale)}` : ''}
                  </span>
                  <h3 className="text-[24px] leading-tight font-bold text-foreground">
                    {ev.title}
                  </h3>
                  {ev.summary && <p className="text-small text-muted-foreground">{ev.summary}</p>}
                  <p className="flex flex-wrap gap-2 text-small">
                    {ev.location && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2.5 py-1">
                        <MapPin className="size-3.5" aria-hidden="true" /> {ev.location}
                      </span>
                    )}
                    {ev.capacity ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-alt px-2.5 py-1">
                        <Users className="size-3.5" aria-hidden="true" /> {t.events.capacity}{' '}
                        {ev.capacity}
                      </span>
                    ) : null}
                    {eventPrice(ev) && (
                      <span className="rounded-full bg-highlight px-2.5 py-1 font-bold text-primary">
                        {eventPrice(ev)}
                      </span>
                    )}
                  </p>
                  {ev.joinViaWhatsApp && (
                    <div className="mt-auto pt-3">
                      <WhatsAppButton
                        number={wa}
                        locale={locale}
                        topic={`${ev.title} (${formatDate(ev.startsAt, locale)})`}
                        intent="join"
                        askPrice={!eventPrice(ev)}
                        label={t.cta.joinViaWhatsApp}
                        context={ev.title}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Private events / venue hire: the page's one dark section */}
      {packages.length > 0 && (
        <Section id="private" tone="dark" image={packages.at(-1)?.image}>
          <SectionHeader
            dark
            eyebrow={t.events.privateEyebrow}
            title={t.events.privateTitle}
            intro={t.events.privateText}
          />
          <ul data-stagger className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-5">
            {packages.map((pkg) => (
              <li key={pkg.id}>
                <VenuePackageCard pkg={pkg} locale={locale} whatsapp={wa} full />
              </li>
            ))}
          </ul>
          <WhatsAppNotice locale={locale} dark className="self-center" />
        </Section>
      )}

      {past.length > 0 && (
        <Section tone="cream">
          <SectionHeader
            center={false}
            eyebrow={t.events.archiveEyebrow}
            title={t.events.archiveTitle}
          />
          <ul data-stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {past.map((ev) => (
              <li key={ev.id} {...temp(ev)} className="group flex flex-col gap-2">
                <div className="zoom-media overflow-hidden rounded-card">
                  <CmsImage
                    media={ev.image}
                    placeholder={ev.title}
                    size="thumb"
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="aspect-[4/3] w-full"
                  />
                </div>
                <strong>{ev.title}</strong>
                <span className="text-small text-muted-foreground">
                  {formatDate(ev.startsAt, locale)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  )
}
