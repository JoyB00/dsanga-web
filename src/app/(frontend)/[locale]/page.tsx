import {
  ArrowRight,
  CalendarDays,
  Car,
  Clock,
  FerrisWheel,
  House,
  Laptop,
  Leaf,
  MapPin,
  Tag,
  Users,
  UtensilsCrossed,
  Waves,
  type LucideIcon,
} from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { Catalog } from '@/components/ui/Catalog'
import { CmsImage } from '@/components/ui/CmsImage'
import { CtaBand } from '@/components/ui/CtaBand'
import { FaqList } from '@/components/ui/FaqList'
import { TINTS } from '@/components/ui/InfoCard'
import { OverlayCard } from '@/components/ui/OverlayCard'
import { Eyebrow, Section, SectionHeader } from '@/components/ui/Section'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { LocalBusinessJsonLd } from '@/components/LocalBusinessJsonLd'
import { href, isLocale, type Locale, type RouteKey } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'
import { formatDate, formatRupiah, formatTime } from '@/lib/format'
import { iconFor } from '@/lib/icons'
import { getSiteSettings } from '@/lib/payload'
import {
  getActiveOffers,
  getExperiences,
  getFaqs,
  getGalleryMedia,
  getHomePage,
  getUpcomingEvents,
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

/** Layout v2 §6.1 section 3: one dark card per experience type. */
const TYPES: { type: ExpType; route: RouteKey; icon: LucideIcon; tagClass: string }[] = [
  { type: 'pool', route: 'pool', icon: Waves, tagClass: 'text-accent-on-dark' },
  { type: 'dining', route: 'dining', icon: UtensilsCrossed, tagClass: 'text-tint-sand' },
  { type: 'work', route: 'workSpace', icon: Laptop, tagClass: 'text-tint-leaf' },
  { type: 'activity', route: 'activities', icon: FerrisWheel, tagClass: 'text-highlight' },
]

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

/** Splits the hero title so the accent words (CMS “Title accent”) get the accent colour. */
const splitTitle = (title: string, accent?: string | null): [string, string] => {
  const at = accent ? title.lastIndexOf(accent) : -1
  return at > 0 ? [title.slice(0, at).trimEnd(), title.slice(at)] : [title, '']
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
  const typeLabel: Record<ExpType, string> = {
    pool: t.nav.pool,
    dining: t.dining.title,
    work: t.nav.workSpace,
    activity: t.nav.activities,
  }

  // Editable copy from the CMS (Home page global); built-in text is only a fallback for empty fields.
  const heroTitle = home?.hero?.title || t.home.title
  const [titleMain, titleAccent] = splitTitle(
    heroTitle,
    home?.hero ? home.hero.titleAccent : t.home.titleAccent,
  )
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
  const highlights = [
    ...offers.map((o) => ({ kind: 'offer' as const, doc: o })),
    ...events.map((e) => ({ kind: 'event' as const, doc: e })),
  ].slice(0, 3)
  const chipIcon = (Icon: LucideIcon) => (
    <Icon className="size-3.5 text-accent-on-dark" aria-hidden="true" />
  )

  return (
    <>
      <LocalBusinessJsonLd
        locale={locale}
        settings={settings}
        description={intro}
        image={home?.hero?.image}
      />

      {/* 1 · Hero (layout v2 §4.2) */}
      <section
        {...temp(home)}
        className="relative isolate flex min-h-[80svh] items-center overflow-hidden bg-primary-hover md:min-h-[88vh]"
      >
        <div className="absolute inset-0 -z-10">
          <CmsImage
            media={home?.hero?.image}
            placeholder=""
            priority
            size="hero"
            sizes="100vw"
            className="size-full"
          />
        </div>
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgb(0_0_0/0.35),transparent_70%),linear-gradient(to_bottom,rgb(0_0_0/0.55),rgb(0_0_0/0.45)_45%,rgb(0_0_0/0.8))]"
        />
        <div className="container-content flex flex-col items-center gap-6 pt-32 pb-24 text-center md:pt-36">
          <Eyebrow dark>{home?.hero?.eyebrow || t.home.eyebrow}</Eyebrow>
          <h1 className="max-w-4xl text-[44px] leading-[1.02] text-white md:text-[72px] lg:text-[92px]">
            {titleMain}
            {titleAccent && <span className="block text-accent-on-dark">{titleAccent}</span>}
          </h1>
          {(home?.hero ? home.hero.tagline : t.home.tagline) && (
            <p className="font-display-italic max-w-2xl text-[22px] leading-snug text-highlight md:text-[28px]">
              {home?.hero ? home.hero.tagline : t.home.tagline}
            </p>
          )}
          <p className="max-w-2xl text-body-lg text-white/90">{intro}</p>
          <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            <a href="#experiences" className="btn-primary shadow-[0_10px_24px_rgb(31_77_58/0.35)]">
              {t.cta.explore}
              <ArrowRight className="size-5" aria-hidden="true" />
            </a>
            <WhatsAppButton
              number={wa}
              locale={locale}
              label={t.home.chatWhatsApp}
              variant="glass"
            />
          </div>
          <div
            aria-hidden="true"
            className="mt-6 hidden flex-col items-center gap-2 text-[11px] font-bold tracking-[0.2em] text-white/70 uppercase md:flex"
          >
            {t.scrollDown}
            <span className="flex h-9 w-5.5 justify-center rounded-full border-2 border-white/60 pt-1.5">
              <span className="scroll-dot size-1.5 rounded-full bg-accent-on-dark" />
            </span>
          </div>
        </div>
      </section>

      {/* 2 · About */}
      <Section tone="soft">
        <div className="grid items-center gap-12 lg:grid-cols-2">
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
              <blockquote className="font-display-italic rounded-card border border-border bg-surface p-6 text-[22px] leading-snug text-primary shadow-card">
                {home?.about ? home.about.quote : t.home.aboutQuote}
              </blockquote>
            )}
            <Link href={href('about', locale)} className="btn-primary">
              {home?.about?.eyebrow || t.home.aboutEyebrow}
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4">
            {values.map(({ icon: Icon, label, text }, i) => (
              <li
                key={label}
                className="flex flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-card sm:p-6"
              >
                <span
                  className={cn(
                    'inline-flex size-12 items-center justify-center rounded-xl',
                    TINTS[i % TINTS.length],
                  )}
                  aria-hidden="true"
                >
                  <Icon className="size-6" strokeWidth={1.75} />
                </span>
                <h3 className="text-[20px] leading-tight sm:text-[22px]">{label}</h3>
                {text && <p className="hidden text-small text-muted-foreground sm:block">{text}</p>}
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* 3 · Four ways to spend the day (the page's one dark section) */}
      <Section tone="dark">
        <SectionHeader
          dark
          eyebrow={home?.ways?.eyebrow || t.home.waysEyebrow}
          title={home?.ways?.title || t.home.waysTitle}
          intro={home?.ways?.intro || t.home.waysIntro}
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {TYPES.map(({ type, route, icon: Icon, tagClass }) => {
            const items = experiences.filter((e) => e.type === type)
            if (!items.length) return null
            const lead = items[0]
            return (
              <li key={type} {...temp(lead)}>
                <Link
                  href={href(route, locale)}
                  className="group grid h-full grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 rounded-card border border-white/10 bg-primary p-4 text-white no-underline transition-colors hover:border-accent-on-dark/50 hover:text-white sm:flex sm:flex-col sm:items-stretch sm:gap-4 sm:p-6"
                >
                  <span
                    className="row-span-2 inline-flex size-12 items-center justify-center rounded-xl bg-white/6"
                    aria-hidden="true"
                  >
                    <Icon className={cn('size-6', tagClass)} strokeWidth={1.75} />
                  </span>
                  <h3 className="text-[22px] leading-tight text-white sm:text-[24px]">
                    {typeLabel[type]}
                  </h3>
                  <p className="hidden text-small text-white/75 sm:line-clamp-4">
                    {lead.summary || lead.tagline}
                  </p>
                  <span
                    className={cn(
                      'flex items-center justify-between gap-2 text-small font-bold sm:mt-auto sm:border-t sm:border-white/10 sm:pt-4',
                      tagClass,
                    )}
                  >
                    {items.length > 1
                      ? items.map((e) => e.title).join(' · ')
                      : lead.cardTag || lead.tagline || lead.title}
                    <ArrowRight
                      className="size-4 shrink-0 transition-transform group-hover:translate-x-1"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </Section>

      {/* 4 · Experience catalog with filters */}
      <Section id="experiences" tone="alt">
        <SectionHeader
          eyebrow={home?.experiences?.eyebrow || t.home.experiencesEyebrow}
          title={home?.experiences?.title || t.home.experiencesTitle}
          intro={home?.experiences?.intro || t.home.experiencesIntro}
        />
        <Catalog
          allLabel={t.catalog.all}
          resultsLabel={t.catalog.results}
          filters={TYPES.map(({ type }) => ({ value: type, label: typeLabel[type] }))}
          viewAll={{ label: t.cta.viewAll, href: href('activities', locale) }}
          mobileLimit={3}
          items={experiences.map((exp) => {
            const to = target(exp)
            return {
              id: exp.id,
              type: exp.type,
              node: (
                <OverlayCard
                  {...temp(exp)}
                  href={href(to.route, locale, to.hash)}
                  image={exp.heroImage}
                  category={typeLabel[exp.type]}
                  title={exp.title}
                  badge={exp.availability === 'coming-soon' ? t.status.comingSoon : undefined}
                  chips={
                    exp.hours?.weekday
                      ? [{ icon: chipIcon(Clock), text: `${t.openPrefix} ${exp.hours.weekday}` }]
                      : []
                  }
                />
              ),
            }
          })}
        />
      </Section>

      {/* 5 · Offers & upcoming event — hidden when nothing is active (F-13) */}
      {highlights.length > 0 && (
        <Section>
          <SectionHeader
            center={false}
            eyebrow={home?.highlights?.eyebrow || t.home.offersEyebrow}
            title={home?.highlights?.title || t.home.offersTitle}
            action={
              <div className="flex flex-wrap gap-2">
                <Link href={href('offers', locale)} className="btn-outline">
                  {t.home.allOffers}
                </Link>
                <Link href={href('events', locale)} className="btn-outline">
                  {t.nav.events}
                </Link>
              </div>
            }
          />
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {highlights.map((item, index) => (
              <li key={`${item.kind}-${item.doc.id}`} className={cn(index >= 2 && 'max-sm:hidden')}>
                {item.kind === 'offer' ? (
                  <OverlayCard
                    {...temp(item.doc)}
                    href={href('offers', locale)}
                    image={item.doc.image}
                    category={t.nav.offers}
                    title={item.doc.title}
                    chips={[
                      {
                        icon: chipIcon(CalendarDays),
                        text: `${t.home.validUntil} ${formatDate(item.doc.validUntil, locale)}`,
                      },
                      ...(item.doc.price != null
                        ? [{ icon: chipIcon(Tag), text: formatRupiah(item.doc.price) }]
                        : []),
                    ]}
                  />
                ) : (
                  <OverlayCard
                    {...temp(item.doc)}
                    href={href('events', locale)}
                    image={item.doc.image}
                    category={t.nav.events}
                    title={item.doc.title}
                    chips={[
                      {
                        icon: chipIcon(CalendarDays),
                        text: `${formatDate(item.doc.startsAt, locale, { weekday: 'short' })} · ${formatTime(item.doc.startsAt, locale)}`,
                      },
                    ]}
                  />
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* 6 · Why D’Sanga — hidden when the CMS has no items (layout v2 §7) */}
      {whyItems.length > 0 && (
        <Section tone="white" className="border-t border-border">
          <SectionHeader
            eyebrow={home?.whyVisit?.eyebrow || t.home.whyEyebrow}
            title={home?.whyVisit?.title || t.home.whyTitle}
            intro={home?.whyVisit?.intro || t.home.whyIntro}
          />
          <ul className="grid gap-5 md:grid-cols-2">
            {whyItems.map((item) => {
              const Icon = iconFor(item.icon)
              return (
                <li
                  key={item.id ?? item.title}
                  className="flex gap-4 rounded-card border border-border bg-background p-4 sm:gap-5 sm:p-6"
                >
                  <span
                    className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-on-primary shadow-[0_6px_16px_rgb(31_77_58/0.25)]"
                    aria-hidden="true"
                  >
                    <Icon className="size-6" strokeWidth={1.75} />
                  </span>
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-[20px] leading-tight sm:text-[22px]">{item.title}</h3>
                    {item.text && (
                      <p className="text-small text-muted-foreground sm:text-body">{item.text}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </Section>
      )}

      {/* 7 · Gallery teaser — shown once photos are marked “show in gallery” */}
      {gallery.length > 0 && (
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
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {gallery.map((m, index) => (
              <li key={m.id} {...temp(m)} className={cn('group', index >= 4 && 'max-md:hidden')}>
                <div className="zoom-media overflow-hidden rounded-card">
                  <CmsImage
                    media={m}
                    placeholder=""
                    size="card"
                    sizes="(min-width: 768px) 33vw, 50vw"
                    className="aspect-square w-full"
                  />
                </div>
              </li>
            ))}
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
