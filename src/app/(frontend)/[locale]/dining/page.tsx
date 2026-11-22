import { Clock, Coffee, Download, Trees, UtensilsCrossed } from 'lucide-react'
import type { Metadata } from 'next'

import { CmsImage } from '@/components/ui/CmsImage'
import { CtaBand } from '@/components/ui/CtaBand'
import { MenuTabs, type MenuCategory } from '@/components/ui/MenuTabs'
import { PageHero } from '@/components/ui/PageHero'
import { Section } from '@/components/ui/Section'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { formatRupiah } from '@/lib/format'
import { getSiteSettings } from '@/lib/payload'
import { getExperience, getMenuItems } from '@/lib/queries'
import type { MenuItem } from '@/payload-types'
import { pageMetadata } from '@/lib/seo'
import { temp } from '@/lib/verification'

type Props = { params: Promise<{ locale: string }> }

const CATEGORY_ORDER: MenuItem['category'][] = ['mains', 'snacks', 'kids', 'coffee', 'drinks', 'desserts']

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
        price: formatRupiah(item.price),
        marker: temp(item),
      })),
  })).filter((cat) => cat.items.length > 0)
  const menuPdf = typeof settings?.menuPdf === 'object' && settings.menuPdf ? settings.menuPdf : null
  const hours = dining?.hours?.weekday

  const highlights = [
    { icon: UtensilsCrossed, title: t.dining.highlights.menu },
    { icon: Coffee, title: t.dining.highlights.coffee },
    { icon: Trees, title: t.dining.highlights.seating },
    ...(hours ? [{ icon: Clock, title: `${t.dining.highlights.hours} ${hours}` }] : []),
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
        imagePlaceholder={t.dining.heroPlaceholder}
        actions={
          <>
            <a href="#menu" className="btn-outline">
              {t.cta.viewMenu}
            </a>
            <WhatsAppButton number={wa} locale={locale} topic={topic} label={t.cta.bookViaWhatsApp} />
          </>
        }
      />

      <section className="section-alt py-8" aria-label={t.dining.title}>
        <ul className="container-content grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map(({ icon: Icon, title }) => (
            <li key={title} className="flex items-center gap-3">
              <span className="icon-circle size-12 bg-surface" aria-hidden="true">
                <Icon className="size-[22px]" strokeWidth={1.75} />
              </span>
              <span className="font-bold text-foreground">{title}</span>
            </li>
          ))}
        </ul>
      </section>

      {featured.length > 0 && (
        <Section eyebrow={t.dining.signatureEyebrow} title={t.dining.signatureTitle}>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((item) => (
              <li key={item.id} {...temp(item)} className="card flex flex-col overflow-hidden">
                <CmsImage media={item.image} placeholder={item.name} className="aspect-[4/3] w-full" sizes="(min-width: 1024px) 25vw, 50vw" />
                <div className="flex flex-col gap-1.5 p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-body-lg">{item.name}</h3>
                    <strong className="whitespace-nowrap text-primary">{formatRupiah(item.price)}</strong>
                  </div>
                  {item.description && <p className="text-small text-muted-foreground">{item.description}</p>}
                  {item.dietaryNote && <span className="text-caption text-muted-foreground">{item.dietaryNote}</span>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section
        id="menu"
        alt
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
      >
        <MenuTabs categories={categories} label={t.dining.menuTitle} />
        <p className="text-small text-muted-foreground">{t.dining.allergyNote}</p>
      </Section>

      {coffee && (
        <section id="coffee" className="section scroll-mt-24">
          <div className="container-content grid items-center gap-10 lg:grid-cols-2">
            <CmsImage
              media={coffee.heroImage}
              placeholder={t.dining.coffeePlaceholder}
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="aspect-[4/3] w-full rounded-media"
            />
            <div className="flex flex-col gap-5">
              <span className="eyebrow">{t.dining.coffeeEyebrow}</span>
              <h2>{coffee.tagline ? `${coffee.title}: ${coffee.tagline}` : coffee.title}</h2>
              {coffee.summary && <p className="text-body-lg text-muted-foreground">{coffee.summary}</p>}
              {coffeeItems.length > 0 && (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {coffeeItems.map((item) => (
                    <li key={item.id} {...temp(item)} className="card flex items-baseline justify-between gap-3 p-4">
                      <span>
                        <strong className="block">{item.name}</strong>
                        {item.description && <span className="text-small text-muted-foreground">{item.description}</span>}
                      </span>
                      <span className="font-bold whitespace-nowrap">{formatRupiah(item.price)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {!!dining?.facilities?.length && (
        <Section alt eyebrow={t.dining.ambienceEyebrow} title={t.dining.ambienceTitle}>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {dining.facilities.map((area, i) => (
              <li key={area.id ?? area.label} className="flex flex-col gap-3">
                <CmsImage
                  media={dining.gallery?.[i]}
                  placeholder={area.label}
                  sizes="(min-width: 1024px) 33vw, 50vw"
                  className="aspect-[16/10] w-full rounded-card"
                />
                <strong>{area.label}</strong>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="pt-section-mobile md:pt-section">
        <CtaBand title={t.dining.ctaTitle} text={t.dining.ctaText} locale={locale}>
          <WhatsAppButton number={wa} locale={locale} topic={topic} label={t.cta.bookViaWhatsApp} />
        </CtaBand>
      </div>
    </>
  )
}
