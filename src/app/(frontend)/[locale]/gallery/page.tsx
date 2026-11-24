import type { Metadata } from 'next'
import Link from 'next/link'
import { GalleryGrid, type GalleryItem } from '@/components/ui/GalleryGrid'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { mediaSrc } from '@/lib/media'
import { getPageHead } from '@/lib/pageHead'
import { getSiteSettings } from '@/lib/payload'
import { getGalleryMedia, getHomePage } from '@/lib/queries'
import { temp } from '@/lib/verification'
import { CtaBand } from '@/components/ui/CtaBand'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { PageHero } from '@/components/ui/PageHero'
import { Section } from '@/components/ui/Section'
import { Panel } from '@/components/ui/InfoCard'
import { pageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const head = await getPageHead('gallery', locale)
  return pageMetadata({
    key: 'gallery',
    locale,
    title: head.title,
    description: head.intro || head.tagline,
    image: head.image,
  })
}

/** Gallery (spec-layout-v2 §6.2): photo hero, then the existing filter + lightbox grid. */
export default async function GalleryPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const head = await getPageHead('gallery', locale)
  const [media, home, settings] = await Promise.all([
    getGalleryMedia(locale, 120),
    getHomePage(locale),
    getSiteSettings(locale).catch(() => null),
  ])

  const items: GalleryItem[] = media
    .filter((m) => m.url)
    .map((m) => ({
      id: m.id,
      src: mediaSrc(m.sizes?.hero?.url || m.url, m.updatedAt)!,
      thumb: mediaSrc(m.sizes?.card?.url || m.url, m.updatedAt)!,
      alt: m.alt,
      caption: m.caption,
      category: m.galleryCategory,
      marker: temp(m),
    }))

  return (
    <>
      <PageHero
        {...temp(head)}
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: head.title }]}
        title={head.title}
        tagline={head.tagline}
        intro={head.intro}
        image={head.image}
      />
      <Section tone="cream">
        {items.length === 0 ? (
          <Panel>
            <p className="text-muted-foreground">{t.gallery.empty}</p>
          </Panel>
        ) : (
          <GalleryGrid
            items={items}
            t={{
              filterLabel: t.gallery.filterLabel,
              all: t.gallery.all,
              categories: t.gallery.categories,
              open: t.gallery.open,
              close: t.gallery.close,
              previous: t.gallery.previous,
              next: t.gallery.next,
              of: t.gallery.of,
            }}
          />
        )}
      </Section>

      <CtaBand
        locale={locale}
        showNotice={false}
        image={head.image}
        eyebrow={home?.cta?.eyebrow || t.home.ctaEyebrow}
        title={home?.cta?.title || t.home.ctaTitle}
        text={home?.cta?.text || t.home.ctaText}
      >
        <WhatsAppButton
          number={settings?.whatsappNumber}
          locale={locale}
          label={t.home.chatWhatsApp}
          variant="gold"
        />
        <Link href={href('visit', locale)} className="btn-outline-light">
          {t.home.ctaSecondary}
        </Link>
      </CtaBand>
    </>
  )
}
