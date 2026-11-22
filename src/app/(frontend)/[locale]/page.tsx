import {
  ArrowRight,
  CalendarDays,
  Car,
  Clock,
  Coffee,
  FerrisWheel,
  Flower2,
  House,
  Laptop,
  Leaf,
  MapPin,
  Users,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { AvailabilityBadge } from '@/components/ui/AvailabilityBadge'
import { CmsImage } from '@/components/ui/CmsImage'
import { FaqList } from '@/components/ui/FaqList'
import { Section } from '@/components/ui/Section'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { LocalBusinessJsonLd } from '@/components/LocalBusinessJsonLd'
import { href, isLocale, type Locale, type RouteKey } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { formatDate, formatRupiah, formatTime } from '@/lib/format'
import { getSiteSettings } from '@/lib/payload'
import { iconFor } from '@/lib/icons'
import { getActiveOffers, getExperiences, getFaqs, getGalleryMedia, getHomePage, getUpcomingEvents } from '@/lib/queries'
import { pageMetadata, SITE_NAME } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

/** Card targets from spec §5 (“Tujuan klik kartu pengalaman”). */
const EXPERIENCE_TARGETS: Record<string, { route: RouteKey; hash?: string; icon: LucideIcon }> = {
  pool: { route: 'pool', icon: Waves },
  dining: { route: 'dining', icon: UtensilsCrossed },
  coffee: { route: 'dining', hash: 'coffee', icon: Coffee },
  'work-space': { route: 'workSpace', icon: Laptop },
  playground: { route: 'activities', hash: 'playground', icon: FerrisWheel },
  wellness: { route: 'activities', hash: 'wellness', icon: Flower2 },
}

const resolve = async (params: Props['params']): Promise<Locale> => {
  const { locale } = await params
  return isLocale(locale) ? locale : 'en'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolve(params)
  const t = getDictionary(locale)
  const home = await getHomePage(locale)
  return pageMetadata({
    key: 'home',
    locale,
    title: `${SITE_NAME} — ${home?.hero?.title || t.home.title}`,
    absoluteTitle: true,
    description: home?.hero?.intro || t.home.intro,
    image: home?.hero?.image,
  })
}

export default async function HomePage({ params }: Props) {
  const locale = await resolve(params)
  const t = getDictionary(locale)

  const [home, settings, experiences, offers, events, gallery, faqs] = await Promise.all([
    getHomePage(locale),
    getSiteSettings(locale).catch(() => null),
    getExperiences(locale),
    getActiveOffers(locale, 2),
    getUpcomingEvents(locale, 1),
    getGalleryMedia(locale, 6),
    getFaqs(locale, ['general']),
  ])
  const wa = settings?.whatsappNumber
  // Home shows the six experiences from spec §5; other activities live on the Activities page.
  const homeExperiences = experiences.filter((exp) => exp.key in EXPERIENCE_TARGETS)
  const highlights = [...offers.map((o) => ({ kind: 'offer' as const, doc: o })), ...events.map((e) => ({ kind: 'event' as const, doc: e }))].slice(0, 3)
  // Editable copy from the CMS (Home page global); built-in text is only a fallback for empty fields.
  const copy = {
    eyebrow: home?.hero?.eyebrow || t.home.eyebrow,
    title: home?.hero?.title || t.home.title,
    intro: home?.hero?.intro || t.home.intro,
    heroImage: home?.hero?.image,
    experiencesEyebrow: home?.experiences?.eyebrow || t.home.experiencesEyebrow,
    experiencesTitle: home?.experiences?.title || t.home.experiencesTitle,
    experiencesIntro: home?.experiences?.intro || t.home.experiencesIntro,
    offersEyebrow: home?.highlights?.eyebrow || t.home.offersEyebrow,
    offersTitle: home?.highlights?.title || t.home.offersTitle,
    aboutEyebrow: home?.about?.eyebrow || t.home.aboutEyebrow,
    aboutTitle: home?.about?.title || t.home.aboutTitle,
    aboutText: home?.about?.text || t.home.aboutText,
    aboutImage: home?.about?.image,
    galleryEyebrow: home?.gallery?.eyebrow || t.home.galleryEyebrow,
    galleryTitle: home?.gallery?.title || t.home.galleryTitle,
    visitEyebrow: home?.visit?.eyebrow || t.home.visitEyebrow,
    visitTitle: home?.visit?.title || t.home.visitTitle,
  }
  const values = home?.about?.values?.length
    ? home.about.values.map((v) => ({ icon: iconFor(v.icon), label: v.label }))
    : [
        { icon: Leaf, label: t.home.values.nature },
        { icon: Users, label: t.home.values.family },
        { icon: CalendarDays, label: t.home.values.community },
        { icon: House, label: t.home.values.culture },
      ]

  return (
    <>
      <LocalBusinessJsonLd locale={locale} settings={settings} description={copy.intro} image={copy.heroImage} />
      {/* 2 · Hero */}
      <section className="pt-8 pb-12 md:pt-12 md:pb-16">
        <div className="container-content grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="flex flex-col items-start gap-5">
            <span className="eyebrow">{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p className="max-w-xl text-body-lg text-muted-foreground">{copy.intro}</p>
            <div className="flex flex-wrap gap-3">
              <a href="#experiences" className="btn-primary">
                {t.cta.explore}
                <ArrowRight className="size-5" aria-hidden="true" />
              </a>
              <WhatsAppButton number={wa} locale={locale} label={t.cta.contactUs} variant="outline" />
            </div>
          </div>
          <CmsImage
            media={copy.heroImage}
            placeholder={t.home.heroPlaceholder}
            priority
            size="hero"
            sizes="(min-width: 1024px) 55vw, 100vw"
            className="aspect-[4/3] w-full rounded-media"
          />
        </div>
      </section>

      {/* 3 · Experience icon row */}
      <section id="experiences" aria-label={copy.experiencesEyebrow} className="border-y border-border bg-surface">
        <ul className="container-content grid grid-cols-3 gap-2 py-8 lg:grid-cols-6">
          {homeExperiences.map((exp) => {
            const target = EXPERIENCE_TARGETS[exp.key] ?? { route: 'activities' as const, icon: Leaf }
            const Icon = target.icon
            return (
              <li key={exp.id}>
                <Link
                  href={href(target.route, locale, target.hash)}
                  className="flex h-full flex-col items-center gap-2 rounded-card p-3 text-center no-underline hover:bg-highlight/50"
                >
                  <span className="icon-circle">
                    <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="font-bold text-foreground">{exp.title}</span>
                  {exp.tagline && <span className="hidden text-small text-muted-foreground sm:block">{exp.tagline}</span>}
                  {exp.availability === 'coming-soon' && <AvailabilityBadge availability="coming-soon" locale={locale} />}
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      {/* 4 · Explore cards */}
      <Section
        eyebrow={copy.experiencesEyebrow}
        title={copy.experiencesTitle}
        intro={copy.experiencesIntro}
        action={
          <Link href={href('activities', locale)} className="btn-link">
            {t.cta.viewAll} <ArrowRight className="ml-1 size-4" aria-hidden="true" />
          </Link>
        }
      >
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {homeExperiences
            .filter((exp) => exp.key !== 'coffee')
            .map((exp) => {
              const target = EXPERIENCE_TARGETS[exp.key] ?? { route: 'activities' as const }
              return (
                <li key={exp.id}>
                  <Link href={href(target.route, locale, target.hash)} className="group flex flex-col gap-3 no-underline">
                    <CmsImage
                      media={exp.heroImage}
                      placeholder={`${t.experience.photo} · ${exp.title}`}
                      sizes="(min-width: 1024px) 33vw, 50vw"
                      className="aspect-[4/5] w-full rounded-card transition-shadow group-hover:shadow-raised"
                    />
                    <span className="flex items-center gap-2 text-h3 font-extrabold text-foreground">
                      {exp.title}
                      <ArrowRight className="size-5 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                    {exp.availability === 'coming-soon' ? (
                      <AvailabilityBadge availability="coming-soon" locale={locale} className="self-start" />
                    ) : (
                      exp.tagline && <span className="text-muted-foreground">{exp.tagline}</span>
                    )}
                  </Link>
                </li>
              )
            })}
        </ul>
      </Section>

      {/* 5 · Offers & upcoming event — hidden when nothing is active (F-13) */}
      {highlights.length > 0 && (
        <Section
          alt
          eyebrow={copy.offersEyebrow}
          title={copy.offersTitle}
          action={
            <Link href={href('offers', locale)} className="btn-link">
              {t.home.allOffers} <ArrowRight className="ml-1 size-4" aria-hidden="true" />
            </Link>
          }
        >
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item) =>
              item.kind === 'offer' ? (
                <li key={`o-${item.doc.id}`} className="card flex flex-col overflow-hidden">
                  <CmsImage media={item.doc.image} placeholder={item.doc.title} className="aspect-video w-full" sizes="(min-width: 1024px) 33vw, 100vw" />
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <span className="badge-validity self-start">
                      {t.home.validUntil} {formatDate(item.doc.validUntil, locale)}
                    </span>
                    <h3>{item.doc.title}</h3>
                    {item.doc.summary && <p className="text-muted-foreground">{item.doc.summary}</p>}
                    {item.doc.price != null && <strong className="text-h3 text-primary">{formatRupiah(item.doc.price)}</strong>}
                    <WhatsAppButton number={wa} locale={locale} topic={item.doc.title} label={t.cta.bookViaWhatsApp} className="mt-auto self-start" />
                  </div>
                </li>
              ) : (
                <li key={`e-${item.doc.id}`} className="card flex flex-col overflow-hidden">
                  <CmsImage media={item.doc.image} placeholder={item.doc.title} className="aspect-video w-full" sizes="(min-width: 1024px) 33vw, 100vw" />
                  <div className="flex flex-1 flex-col gap-3 p-6">
                    <span className="badge-tag self-start">
                      {formatDate(item.doc.startsAt, locale, { weekday: 'short' })} · {formatTime(item.doc.startsAt, locale)}
                    </span>
                    <h3>{item.doc.title}</h3>
                    {item.doc.summary && <p className="text-muted-foreground">{item.doc.summary}</p>}
                    <Link href={href('events', locale)} className="btn-outline mt-auto self-start">
                      {t.cta.viewSchedule}
                    </Link>
                  </div>
                </li>
              ),
            )}
          </ul>
        </Section>
      )}

      {/* 6 · About */}
      <section className="section">
        <div className="container-content grid items-center gap-10 lg:grid-cols-2">
          <CmsImage
            media={copy.aboutImage}
            placeholder={t.home.aboutPlaceholder}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="aspect-[4/3] w-full rounded-media"
          />
          <div className="flex flex-col gap-5">
            <span className="eyebrow">{copy.aboutEyebrow}</span>
            <h2>{copy.aboutTitle}</h2>
            <p className="text-body-lg text-muted-foreground">{copy.aboutText}</p>
            <ul className="grid grid-cols-2 gap-4">
              {values.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3">
                  <span className="icon-circle size-12">
                    <Icon className="size-[22px]" strokeWidth={1.75} aria-hidden="true" />
                  </span>
                  <span className="font-bold text-foreground">{label}</span>
                </li>
              ))}
            </ul>
            <Link href={href('about', locale)} className="btn-primary self-start">
              {copy.aboutEyebrow}
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 7 · Gallery teaser — shown once photos are marked “show in gallery” */}
      {gallery.length > 0 && (
        <Section
          alt
          eyebrow={copy.galleryEyebrow}
          title={copy.galleryTitle}
          action={
            <Link href={href('gallery', locale)} className="btn-link">
              {t.home.openGallery} <ArrowRight className="ml-1 size-4" aria-hidden="true" />
            </Link>
          }
        >
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {gallery.map((m) => (
              <li key={m.id}>
                <CmsImage media={m} placeholder="" size="card" sizes="(min-width: 768px) 33vw, 50vw" className="aspect-square w-full rounded-card" />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 8 · Plan your visit */}
      <Section alt={gallery.length === 0} eyebrow={copy.visitEyebrow} title={copy.visitTitle}>
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {settings?.mapEmbedUrl ? (
            <iframe
              title={copy.visitTitle}
              src={settings.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-[4/3] w-full rounded-media border-0"
            />
          ) : (
            <CmsImage placeholder={t.home.mapPlaceholder} className="aspect-[4/3] w-full rounded-media" />
          )}
          <div className="flex flex-col gap-5">
            {settings?.address && (
              <p className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <strong className="block">{t.home.address}</strong>
                  <span className="whitespace-pre-line text-muted-foreground">{settings.address}</span>
                </span>
              </p>
            )}
            {!!settings?.openingHours?.length && (
              <div className="flex gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <strong className="block">{t.home.hours}</strong>
                  <ul className="text-muted-foreground">
                    {settings.openingHours.slice(0, 2).map((row) => (
                      <li key={row.id ?? row.area}>
                        {row.area}: {row.weekday}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {settings?.parking && (
              <p className="flex gap-3">
                <Car className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <strong className="block">{t.home.parking}</strong>
                  <span className="text-muted-foreground">{settings.parking}</span>
                </span>
              </p>
            )}
            {faqs.length > 0 && (
              <div className="flex flex-col gap-2">
                <strong>{t.home.quickFaq}</strong>
                <FaqList faqs={faqs.slice(0, 3)} />
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {settings?.mapsUrl && (
                <a href={settings.mapsUrl} target="_blank" rel="noopener noreferrer" data-track="map_click" className="btn-primary">
                  <MapPin className="size-5" aria-hidden="true" />
                  {t.cta.getDirections}
                </a>
              )}
              <WhatsAppButton number={wa} locale={locale} label={t.cta.contactUs} variant="outline" />
            </div>
            <Link href={href('visit', locale)} className="btn-link self-start">
              {t.home.allFaq} <ArrowRight className="ml-1 size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>
    </>
  )
}
