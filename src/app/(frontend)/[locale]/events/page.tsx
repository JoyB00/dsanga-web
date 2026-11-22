import { ArrowRight, CircleCheck, MapPin, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { CmsImage } from '@/components/ui/CmsImage'
import { PageHero } from '@/components/ui/PageHero'
import { Section } from '@/components/ui/Section'
import { WhatsAppButton, WhatsAppNotice } from '@/components/ui/WhatsAppButton'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { formatDate, formatRupiah, formatTime } from '@/lib/format'
import { getSiteSettings } from '@/lib/payload'
import { getPastEvents, getUpcomingEvents, getVenuePackages } from '@/lib/queries'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary(await localeFromParams(params))
  return { title: t.events.title, description: t.events.intro }
}

export default async function EventsPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const [upcoming, past, packages, settings] = await Promise.all([
    getUpcomingEvents(locale, 20),
    getPastEvents(locale, 8),
    getVenuePackages(locale),
    getSiteSettings(locale).catch(() => null),
  ])
  const wa = settings?.whatsappNumber

  return (
    <>
      <PageHero
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: t.events.title }]}
        title={t.events.title}
        tagline={t.events.tagline}
        intro={t.events.intro}
        imagePlaceholder={t.events.heroPlaceholder}
        actions={
          <>
            <a href="#upcoming" className="btn-primary">
              {t.cta.viewSchedule}
            </a>
            {packages.length > 0 && (
              <a href="#private" className="btn-outline">
                {t.events.privateEyebrow}
              </a>
            )}
          </>
        }
      />

      {/* Upcoming events, soonest first. Past events move to the archive automatically (F-13). */}
      <Section id="upcoming" alt eyebrow={t.events.upcomingEyebrow} title={t.events.upcomingTitle}>
        {upcoming.length === 0 ? (
          <p className="card p-6 text-muted-foreground">{t.events.noUpcoming}</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {upcoming.map((ev) => (
              <li key={ev.id} className="card flex flex-col gap-5 p-5 md:flex-row md:items-center">
                <div className="flex shrink-0 items-center gap-4">
                  <div className="flex w-20 flex-col items-center rounded-card border-2 border-primary bg-surface py-2 text-primary">
                    <span className="text-caption font-bold uppercase">{formatDate(ev.startsAt, locale, { weekday: 'short', day: undefined, month: undefined, year: undefined })}</span>
                    <span className="text-h3 leading-none font-extrabold">{formatDate(ev.startsAt, locale, { day: 'numeric', month: undefined, year: undefined })}</span>
                    <span className="text-caption font-bold uppercase">{formatDate(ev.startsAt, locale, { month: 'short', day: undefined, year: undefined })}</span>
                  </div>
                  <CmsImage media={ev.image} placeholder={ev.title} className="hidden h-24 w-36 rounded-card sm:flex" sizes="9rem" size="thumb" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="text-caption font-bold tracking-[0.12em] text-accent-text uppercase">
                    {t.events.categories[ev.category]} · {formatTime(ev.startsAt, locale)}
                    {ev.endsAt ? `–${formatTime(ev.endsAt, locale)}` : ''}
                  </span>
                  <h3>{ev.title}</h3>
                  {ev.summary && <p className="text-muted-foreground">{ev.summary}</p>}
                  <p className="flex flex-wrap gap-x-4 gap-y-1 text-small text-muted-foreground">
                    {ev.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-4" aria-hidden="true" /> {ev.location}
                      </span>
                    )}
                    {ev.capacity ? (
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-4" aria-hidden="true" /> {t.events.capacity} {ev.capacity}
                      </span>
                    ) : null}
                    {ev.price && <span className="font-bold text-foreground">{ev.price}</span>}
                  </p>
                </div>
                {ev.joinViaWhatsApp && (
                  <WhatsAppButton number={wa} locale={locale} topic={ev.title} label={t.cta.joinViaWhatsApp} className="shrink-0 self-start md:self-center" />
                )}
              </li>
            ))}
          </ul>
        )}
        <Link href={href('offers', locale)} className="btn-link self-start">
          {t.events.offersLink} <ArrowRight className="ml-1 size-4" aria-hidden="true" />
        </Link>
      </Section>

      {/* Private event / venue hire packages */}
      {packages.length > 0 && (
        <Section id="private" eyebrow={t.events.privateEyebrow} title={t.events.privateTitle} intro={t.events.privateText}>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(16rem,1fr))] gap-5">
            {packages.map((pkg) => (
              <li key={pkg.id} className="card flex flex-col gap-3 p-6">
                <span className="eyebrow">{t.events.upTo.replace('{n}', String(pkg.capacity))}</span>
                <h3>{pkg.name}</h3>
                <p className="text-h3 font-extrabold text-primary">
                  {pkg.priceFrom != null ? `${t.events.from} ${formatRupiah(pkg.priceFrom)}` : t.events.onRequest}
                </p>
                {!!pkg.inclusions?.length && (
                  <ul className="flex flex-col gap-2">
                    {pkg.inclusions.map((inc) => (
                      <li key={inc.id ?? inc.label} className="flex items-start gap-2 text-muted-foreground">
                        <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                        {inc.label}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3">
            <WhatsAppButton number={wa} locale={locale} topic={t.events.privateEyebrow} label={t.cta.planEvent} className="self-start" />
            <WhatsAppNotice locale={locale} />
          </div>
        </Section>
      )}

      {/* Archive */}
      {past.length > 0 && (
        <Section alt eyebrow={t.events.archiveEyebrow} title={t.events.archiveTitle}>
          <ul className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {past.map((ev) => (
              <li key={ev.id} className="flex flex-col gap-2">
                <CmsImage media={ev.image} placeholder={ev.title} className="aspect-[4/3] w-full rounded-card" size="thumb" sizes="(min-width: 1024px) 25vw, 50vw" />
                <strong>{ev.title}</strong>
                <span className="text-small text-muted-foreground">{formatDate(ev.startsAt, locale)}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  )
}
