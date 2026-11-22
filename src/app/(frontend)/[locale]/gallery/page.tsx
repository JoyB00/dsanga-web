import type { Metadata } from 'next'

import { GalleryGrid, type GalleryItem } from '@/components/ui/GalleryGrid'
import { PageHeader } from '@/components/ui/PageHero'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getPageHead } from '@/lib/pageHead'
import { mediaSrc } from '@/lib/media'
import { getGalleryMedia } from '@/lib/queries'
import { pageMetadata } from '@/lib/seo'
import { temp } from '@/lib/verification'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const head = await getPageHead('gallery', locale)
  return pageMetadata({ key: 'gallery', locale, title: head.title, description: head.intro || head.tagline, image: head.image })
}

export default async function GalleryPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const head = await getPageHead('gallery', locale)
  const media = await getGalleryMedia(locale, 120)

  const items: GalleryItem[] = media
    .filter((m) => m.url)
    .map((m) => ({
      id: m.id,
      src: mediaSrc(m.sizes?.hero?.url || m.url)!,
      thumb: mediaSrc(m.sizes?.card?.url || m.url)!,
      alt: m.alt,
      caption: m.caption,
      category: m.galleryCategory,
      marker: temp(m),
    }))

  return (
    <>
      <PageHeader
        {...temp(head)}
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: head.title }]}
        title={head.title}
        intro={head.intro}
      />
      <section className="pb-section-mobile md:pb-section">
        <div className="container-content">
          {items.length === 0 ? (
            <p className="card p-6 text-muted-foreground">{t.gallery.empty}</p>
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
        </div>
      </section>
    </>
  )
}
