import {
  ArrowRight,
  CalendarDays,
  Car,
  Clock,
  House,
  Leaf,
  MapPin,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { HomeHero } from '@/components/home/HomeHero'
import { OfferPackageCard, VenuePackageCard } from '@/components/ui/PackageCards'
import { PhotoMosaic } from '@/components/ui/PhotoMosaic'
import { Catalog } from '@/components/ui/Catalog'
import { CmsImage } from '@/components/ui/CmsImage'
import { CtaBand } from '@/components/ui/CtaBand'
import { FaqList } from '@/components/ui/FaqList'
import { TINTS } from '@/components/ui/InfoCard'
import { OverlayCard } from '@/components/ui/OverlayCard'
import { Section, SectionHeader } from '@/components/ui/Section'
import { WaveCard } from '@/components/ui/WaveCard'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { LocalBusinessJsonLd } from '@/components/LocalBusinessJsonLd'
import { href, isLocale, type Locale, type RouteKey } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'
import { formatDate, formatTime } from '@/lib/format'
import { iconFor } from '@/lib/icons'
import { asMedia } from '@/lib/media'
import { getSiteSettings } from '@/lib/payload'
import {
  getActiveOffers,
  getExperiences,
  getFaqs,
  getGalleryMedia,
  getHomePage,
  getUpcomingEvents,
  getVenuePackages,
} from '@/lib/queries'
import { pageMetadata, SITE_NAME } from '@/lib/seo'
import { temp } from '@/lib/verification'
import type { Experience } from '@/payload-types'

type Props = { params: Promise<{ locale: string }> }
type ExpType = Experience['type']

/** Card targets from spec §5 (“Tujuan klik kartu pengalaman”); other activities open their block on Activities. */
const TARGETS: Record<string, { route: RouteKey; hash?: string }> = {
  pool: { route: 'pool' },
  dining: { route: 'dining' },
  coffee: { route: 'dining', hash: 'coffee' },
  'work-space': { route: 'workSpace' },
}
const target = (exp: Experience) =>
  TARGETS[exp.key] ?? { route: 'activities' as const, hash: exp.key }

/** Filter order in the experiences section. */
const TYPES: ExpType[] = ['pool', 'dining', 'work', 'activity']

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

  const [home, settings, experiences, offers, venues, events, gallery, faqs] = await Promise.all([
    getHomePage(locale),
    getSiteSettings(locale).catch(() => null),
    getExperiences(locale),
    getActiveOffers(locale, 4),
    getVenuePackages(locale),
    getUpcomingEvents(locale, 3),
    getGalleryMedia(locale, 8),
    getFaqs(locale, ['general']),
  ])
  const wa = settings?.whatsappNumber
  const typeLabel: Record<ExpType, string> = {
    pool: t.nav.pool,
    dining: t.dining.title,
    work: t.nav.workSpace,
    activity: t.nav.activities,
  }

  // Editable copy from the CMS (Home page global); built-in text is only a fallback for empty fields.
  const intro = home?.hero?.intro || t.home.intro
  const values = (
    home?.about?.values?.length
      ? home.about.values.map((v) => ({ icon: iconFor(v.icon), label: v.label, text: v.text }))
      : [
          { icon: Leaf, label: t.home.values.nature },
          { icon: Users, label: t.home.values.family },
          { icon: CalendarDays, label: t.home.values.community },
          { icon: House, label: t.home.values.culture },
        ].map((v, i) => ({ ...v, text: t.home.valueTexts[i] }))
  ).slice(0, 4)
  const whyItems = home?.whyVisit?.items ?? []
  const chosen = asMedia(home?.gallery?.photos)
  const photos = chosen.length >= 4 ? chosen : gallery
  const poolPage = experiences.find((e) => e.key === 'pool')
  const backdrop = asMedia(poolPage?.gallery).at(-1) ?? poolPage?.heroImage
  const collage = asMedia([home?.about?.image ?? null, ...(home?.about?.photos ?? [])]).slice(0, 3)

  return (
    <>
      <LocalBusinessJsonLd
        locale={locale}
        settings={settings}
        description={intro}
        image={home?.hero?.image}
      />

      {/* 1 · Hero + facts */}
      <HomeHero locale={locale} home={home} settings={settings} experiences={experiences} />

      {/* 2 · Packages — hidden when there are none; expired offers are never listed (F-13) */}
      {offers.length + venues.length > 0 && (
        <Section id="packages">
          <SectionHeader
            eyebrow={home?.packages?.eyebrow || t.home.packagesEyebrow}
            title={home?.packages?.title || t.home.packagesTitle}
            intro={home?.packages?.intro || t.home.packagesIntro}
          />
          {offers.length > 0 && (
            <ul data-stagger className={cn('grid gap-6 md:gap-8', offers.length > 1 && 'md:grid-cols-2')}>
              {offers.map((offer) => (
                <li key={offer.id}>
                  <OfferPackageCard offer={offer} locale={locale} whatsapp={wa} />
                </li>
              ))}
            </ul>
          )}
          {venues.length > 0 && (
            <div className="flex flex-col gap-5">
              <p className="text-center font-display text-[24px] font-bold md:text-[28px]">
                {t.home.venueTitle}
              </p>
              <ul data-stagger className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
                {venues.map((pkg) => (
                  <li key={pkg.id}>
                    <VenuePackageCard pkg={pkg} locale={locale} />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* 3 · Photo mosaic — shown once there are at least four photos */}
      {photos.length >= 4 && (
        <Section tone="alt">
          <SectionHeader
            center={false}
            eyebrow={home?.gallery?.eyebrow || t.home.galleryEyebrow}
            title={home?.gallery?.title || t.home.galleryTitle}
            action={
              <Link href={href('gallery', locale)} className="btn-outline">
                {t.home.openGallery}
                <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
            }
          />
          <PhotoMosaic photos={photos} />
        </Section>
      )}

      {/* 4 · Experiences with filters, over a photo (the page's one dark section) */}
      <Section id="experiences" tone="dark" image={backdrop}>
        <SectionHeader
          dark
          eyebrow={home?.experiences?.eyebrow || t.home.experiencesEyebrow}
          title={home?.experiences?.title || t.home.experiencesTitle}
          intro={home?.experiences?.intro || t.home.experiencesIntro}
        />
        <Catalog
          dark
          gridClass="grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4"
          allLabel={t.catalog.all}
          resultsLabel={t.catalog.results}
          mobileLimit={4}
          filters={TYPES.map((type) => ({ value: type, label: typeLabel[type] }))}
          viewAll={{ label: t.cta.viewAll, href: href('activities', locale) }}
          items={experiences.map((exp) => {
            const to = target(exp)
            return {
              id: exp.id,
              type: exp.type,
              node: (
                <WaveCard
                  {...temp(exp)}
                  href={href(to.route, locale, to.hash)}
                  image={exp.heroImage}
                  title={exp.title}
                  text={exp.cardTag || exp.tagline}
                  badge={exp.availability === 'coming-soon' ? t.status.comingSoon : undefined}
                />
              ),
            }
          })}
        />
      </Section>

      {/* 5 · About: text + photo collage, values in one row */}
      <Section tone="soft">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          <div className="flex flex-col items-start gap-5">
            <SectionHeader
              center={false}
              eyebrow={home?.about?.eyebrow || t.home.aboutEyebrow}
              title={home?.about?.title || t.home.aboutTitle}
            />
            <p className="text-body-lg text-muted-foreground">
              {home?.about?.text || t.home.aboutText}
            </p>
            {(home?.about ? home.about.quote : t.home.aboutQuote) && (
              <blockquote className="font-display-italic border-l-4 border-accent pl-5 text-[22px] leading-snug text-primary">
                {home?.about ? home.about.quote : t.home.aboutQuote}
              </blockquote>
            )}
            <Link href={href('about', locale)} className="btn-primary">
              {home?.about?.eyebrow || t.home.aboutEyebrow}
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
          <ul
            className={cn(
              'grid gap-3 sm:gap-4',
              collage.length > 1 && 'grid-cols-[3fr_2fr]',
              collage.length > 2 && 'grid-rows-2',
            )}
          >
            {collage.map((m, index) => (
              <li
                key={m.id}
                {...temp(m)}
                className={cn('group', index === 0 && collage.length > 2 && 'row-span-2')}
              >
                <div className="zoom-media h-full overflow-hidden rounded-media">
                  <CmsImage
                    media={m}
                    placeholder=""
                    size="card"
                    sizes="(min-width: 1024px) 30vw, 60vw"
                    className={cn(
                      'size-full',
                      index === 0 ? 'min-h-72 md:min-h-[26rem]' : 'min-h-32',
                    )}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
        <ul data-stagger className="grid grid-cols-2 gap-x-4 gap-y-6 border-t border-border pt-8 lg:grid-cols-4">
          {values.map(({ icon: Icon, label, text }, i) => (
            <li key={label} className="flex items-start gap-3">
              <span
                className={cn(
                  'inline-flex size-11 shrink-0 items-center justify-center rounded-xl',
                  TINTS[i % TINTS.length],
                )}
                aria-hidden="true"
              >
                <Icon className="size-5" strokeWidth={1.75} />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <strong>{label}</strong>
                {text && (
                  <span className="hidden text-small text-muted-foreground sm:block">{text}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      {/* 6 · Upcoming events — hidden when nothing is scheduled (F-13) */}
      {events.length > 0 && (
        <Section>
          <SectionHeader
            center={false}
            eyebrow={home?.highlights?.eyebrow || t.home.offersEyebrow}
            title={home?.highlights?.title || t.home.offersTitle}
            action={
              <Link href={href('events', locale)} className="btn-outline">
                {t.cta.viewSchedule}
                <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
            }
          />
          <ul
            className={cn(
              'grid gap-6',
              events.length > 1 && 'sm:grid-cols-2',
              events.length > 2 && 'lg:grid-cols-3',
            )}
          >
            {events.map((event, index) => (
              <li key={event.id} className={cn(index >= 1 && 'max-sm:hidden')}>
                <OverlayCard
                  wide={events.length < 3}
                  {...temp(event)}
                  href={href('events', locale)}
                  image={event.image}
                  category={t.events.categories[event.category]}
                  title={event.title}
                  chips={[
                    {
                      icon: (
                        <CalendarDays className="size-3.5 text-accent-on-dark" aria-hidden="true" />
                      ),
                      text: `${formatDate(event.startsAt, locale, { weekday: 'short' })} · ${formatTime(event.startsAt, locale)}`,
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 7 · Why D’Sanga — hidden when the CMS has no items */}
      {whyItems.length > 0 && (
        <Section tone="white" className="border-t border-border">
          <SectionHeader
            eyebrow={home?.whyVisit?.eyebrow || t.home.whyEyebrow}
            title={home?.whyVisit?.title || t.home.whyTitle}
            intro={home?.whyVisit?.intro || t.home.whyIntro}
          />
          <ul data-stagger className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            {whyItems.map((item) => {
              const Icon = iconFor(item.icon)
              return (
                <li
                  key={item.id ?? item.title}
                  className="flex items-center gap-4 sm:items-start lg:flex-col lg:items-center lg:text-center"
                >
                  <span
                    className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"
                    aria-hidden="true"
                  >
                    <Icon className="size-6" strokeWidth={1.75} />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-[21px] leading-tight">{item.title}</h3>
                    {item.text && (
                      <p className="hidden text-small text-muted-foreground sm:block">
                        {item.text}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </Section>
      )}

      {/* 8 · Plan your visit */}
      <Section>
        <SectionHeader
          center={false}
          eyebrow={home?.visit?.eyebrow || t.home.visitEyebrow}
          title={home?.visit?.title || t.home.visitTitle}
        />
        <div className="grid gap-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          {settings?.mapEmbedUrl ? (
            <iframe
              title={home?.visit?.title || t.home.visitTitle}
              src={settings.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="aspect-video w-full rounded-media border-0 sm:aspect-[4/3]"
            />
          ) : (
            <CmsImage
              placeholder={t.home.mapPlaceholder}
              className="aspect-video w-full rounded-media sm:aspect-[4/3]"
            />
          )}
          <div {...temp(settings)} className="flex min-w-0 flex-col gap-4">
            {[
              settings?.address && { icon: MapPin, title: t.home.address, body: settings.address },
              settings?.openingHours?.length && {
                icon: Clock,
                title: t.home.hours,
                body: settings.openingHours
                  .slice(0, 2)
                  .map((row) => `${row.area}: ${row.weekday}`)
                  .join('\n'),
              },
              settings?.parking && { icon: Car, title: t.home.parking, body: settings.parking },
            ]
              .filter((x): x is { icon: LucideIcon; title: string; body: string } => Boolean(x))
              .map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="flex gap-4 rounded-card border border-border bg-surface p-5"
                >
                  <span
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-highlight text-primary"
                    aria-hidden="true"
                  >
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <strong className="block">{title}</strong>
                    <span className="whitespace-pre-line text-muted-foreground">{body}</span>
                  </span>
                </div>
              ))}
            {faqs.length > 0 && (
              <div className="flex flex-col gap-2">
                <strong>{t.home.quickFaq}</strong>
                <FaqList faqs={faqs.slice(0, 3)} />
              </div>
            )}
            <div className="flex flex-wrap gap-3">
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
              <Link href={href('visit', locale)} className="btn-outline">
                {t.home.allFaq}
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* 9 · Closing CTA band */}
      <CtaBand
        locale={locale}
        showNotice={false}
        image={experiences.find((e) => e.key === 'gathering')?.heroImage}
        eyebrow={home?.cta?.eyebrow || t.home.ctaEyebrow}
        title={home?.cta?.title || t.home.ctaTitle}
        text={home?.cta?.text || t.home.ctaText}
      >
        <WhatsAppButton number={wa} locale={locale} label={t.home.chatWhatsApp} variant="gold" />
        <Link href={href('visit', locale)} className="btn-outline-light">
          {t.home.ctaSecondary}
        </Link>
      </CtaBand>
    </>
  )
}
