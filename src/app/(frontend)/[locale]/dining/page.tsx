import type { Metadata } from 'next'
import { Clock, Coffee, Download, Trees, UtensilsCrossed } from 'lucide-react'

import Link from 'next/link'

import { CmsImage } from '@/components/ui/CmsImage'
import { FactsStrip } from '@/components/ui/FactsStrip'
import { WavePhoto } from '@/components/ui/WavePhoto'
import { MenuTabs, type MenuCategory } from '@/components/ui/MenuTabs'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { formatRupiah } from '@/lib/format'
import { getSiteSettings } from '@/lib/payload'
import { getExperience, getMenuItems } from '@/lib/queries'
import { temp } from '@/lib/verification'
import type { MenuItem } from '@/payload-types'

const CATEGORY_ORDER: MenuItem['category'][] = [
  'mains',
  'snacks',
  'kids',
  'coffee',
  'drinks',
  'desserts',
]
import { PageHero } from '@/components/ui/PageHero'
import { Eyebrow, Section, SectionHeader } from '@/components/ui/Section'
import { CtaBand } from '@/components/ui/CtaBand'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const exp = await getExperience('dining', locale)
  // The SEO tab title (if filled in) already ends with "— D’Sanga", so it is used as-is.
  return pageMetadata({
    key: 'dining',
    locale,
    // The page covers the bistro and the coffee bar, so its name comes from the dictionary, not the experience.
    title: exp?.meta?.title || getDictionary(locale).dining.title,
    absoluteTitle: Boolean(exp?.meta?.title),
    description: exp?.meta?.description || exp?.summary,
    image: exp?.meta?.image || exp?.heroImage,
  })
}

/**
 * Bistro & Coffee (spec-layout-v2 §6.2): highlights over the hero edge, favourites as photo cards with the
 * price below (not over the photo, so prices stay easy to read), menu tabs, coffee on dark, ambience, CTA.
 */
export default async function DiningPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const [dining, coffee, menu, settings] = await Promise.all([
    getExperience('dining', locale),
    getExperience('coffee', locale),
    getMenuItems(locale),
    getSiteSettings(locale).catch(() => null),
  ])

  const wa = settings?.whatsappNumber
  const topic = dining?.whatsappContext || t.dining.title
  const featured = menu.filter((item) => item.featured && item.category !== 'coffee').slice(0, 4)
  const coffeeItems = menu.filter((item) => item.category === 'coffee')
  const categories: MenuCategory[] = CATEGORY_ORDER.map((category) => ({
    id: category,
    label: t.dining.categories[category],
    items: menu
      .filter((item) => item.category === category)
      .map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        note: item.dietaryNote,
        price: formatRupiah(item.price), // '' when hidden
        marker: temp(item),
      })),
  })).filter((cat) => cat.items.length > 0)
  const menuPdf =
    typeof settings?.menuPdf === 'object' && settings.menuPdf ? settings.menuPdf : null
  const hours = dining?.hours?.weekday

  const highlights = [
    { icon: UtensilsCrossed, value: t.dining.highlights.menu },
    { icon: Coffee, value: t.dining.highlights.coffee },
    { icon: Trees, value: t.dining.highlights.seating },
    ...(hours ? [{ icon: Clock, value: `${t.dining.highlights.hours} ${hours}` }] : []),
  ]

  return (
    <>
      <PageHero
        {...temp(dining)}
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: t.dining.title }]}
        title={t.dining.title}
        tagline={dining?.tagline}
        intro={dining?.summary}
        image={dining?.heroImage}
        actions={
          <>
            <a href="#menu" className="btn-primary">
              {t.cta.viewMenu}
            </a>
            <WhatsAppButton
              number={wa}
              locale={locale}
              topic={topic}
              intent="table"
              label={t.cta.reserveTable}
              variant="glass"
            />
          </>
        }
      />

      <FactsStrip label={t.dining.title} facts={highlights} />

      {featured.length > 0 && (
        <Section tone="cream">
          <SectionHeader eyebrow={t.dining.signatureEyebrow} title={t.dining.signatureTitle} />
          <ul data-stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item) => (
              <li
                key={item.id}
                {...temp(item)}
                className="group flex flex-col overflow-hidden rounded-card bg-surface shadow-card"
              >
                <WavePhoto
                  media={item.image}
                  placeholder={item.name}
                  className="aspect-[4/3] sm:aspect-square"
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                />
                <div className="relative -mt-px flex flex-1 flex-col gap-1.5 bg-surface px-5 pt-2 pb-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[22px] leading-tight font-bold text-foreground">
                      {item.name}
                    </h3>
                    {item.price != null && (
                      <strong className="whitespace-nowrap text-primary">
                        {formatRupiah(item.price)}
                      </strong>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-small text-muted-foreground">{item.description}</p>
                  )}
                  {item.dietaryNote && (
                    <span className="mt-auto pt-1 text-caption font-semibold text-accent-text">
                      {item.dietaryNote}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section id="menu" tone="alt">
        <SectionHeader
          center={false}
          eyebrow={t.dining.menuEyebrow}
          title={t.dining.menuTitle}
          action={
            menuPdf?.url ? (
              <a href={menuPdf.url} className="btn-outline" download>
                <Download className="size-5" aria-hidden="true" />
                {t.dining.downloadMenu}
              </a>
            ) : undefined
          }
        />
        <MenuTabs categories={categories} label={t.dining.menuTitle} />
        <p className="text-small text-muted-foreground">{t.dining.allergyNote}</p>
        <p className="text-small font-semibold text-foreground">{t.dining.tableNote}</p>
      </Section>

      {/* Coffee: the page's one dark section */}
      {coffee && (
        <Section id="coffee" tone="dark" image={coffee.gallery?.[0]}>
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="group">
              <div className="zoom-media overflow-hidden rounded-media">
                <CmsImage
                  media={coffee.heroImage}
                  placeholder={t.dining.coffeePlaceholder}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="aspect-[4/3] w-full"
                />
              </div>
            </div>
            <div className="flex flex-col items-start gap-5">
              <Eyebrow dark>{t.dining.coffeeEyebrow}</Eyebrow>
              <h2 className="text-[34px] leading-[1.08] font-bold text-white md:text-[48px]">
                {coffee.title}
              </h2>
              {coffee.tagline && (
                <p className="font-display-italic text-[24px] text-accent-on-dark">
                  {coffee.tagline}
                </p>
              )}
              {coffee.summary && <p className="text-body-lg text-white/80">{coffee.summary}</p>}
              {coffeeItems.length > 0 && (
                <ul className="grid w-full gap-3 sm:grid-cols-2">
                  {coffeeItems.map((item) => (
                    <li
                      key={item.id}
                      {...temp(item)}
                      className="flex items-baseline justify-between gap-3 rounded-card border border-white/15 bg-primary/90 p-4"
                    >
                      <span>
                        <strong className="block text-white">{item.name}</strong>
                        {item.description && (
                          <span className="text-small text-white/70">{item.description}</span>
                        )}
                      </span>
                      {item.price != null && (
                        <span className="font-bold whitespace-nowrap text-accent-on-dark">
                          {formatRupiah(item.price)}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <p className="text-white/80">{t.dining.tableNote}</p>
              <WhatsAppButton
                number={wa}
                locale={locale}
                topic={coffee.whatsappContext || coffee.title}
                intent="table"
                label={t.cta.reserveTable}
                context={coffee.title}
                variant="gold"
              />
            </div>
          </div>
        </Section>
      )}

      {!!dining?.facilities?.length && (
        <Section tone="cream">
          <SectionHeader eyebrow={t.dining.ambienceEyebrow} title={t.dining.ambienceTitle} />
          <ul data-stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dining.facilities.map((area, i) => (
              <li
                key={area.id ?? area.label}
                className="group relative overflow-hidden rounded-media"
              >
                <div className="zoom-media">
                  <CmsImage
                    media={dining.gallery?.[i]}
                    placeholder={area.label}
                    sizes="(min-width: 1024px) 33vw, 50vw"
                    className="aspect-[4/3] w-full"
                  />
                </div>
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-linear-to-b from-transparent from-50% to-[rgb(0_0_0/0.75)]"
                />
                <strong className="absolute inset-x-0 bottom-0 p-5 font-sans text-body-lg text-white">
                  {area.label}
                </strong>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <CtaBand
        locale={locale}
        image={dining?.gallery?.[1]}
        title={t.dining.ctaTitle}
        text={t.dining.ctaText}
      >
        <WhatsAppButton
          number={wa}
          locale={locale}
          topic={topic}
          intent="table"
          label={t.cta.reserveTable}
          variant="gold"
        />
        <Link href={href('visit', locale)} className="btn-outline-light">
          {t.home.ctaSecondary}
        </Link>
      </CtaBand>
    </>
  )
}
