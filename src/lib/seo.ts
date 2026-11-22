import type { Metadata } from 'next'

import { href, locales, type Locale, type RouteKey } from '@/i18n/config'
import type { Media } from '@/payload-types'

export const SITE_NAME = 'D’Sanga Pool, Bistro & Space'
export const siteUrl = () => (process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000').replace(/\/$/, '')

/**
 * Search engines may index the site only when ALLOW_INDEXING=true (production).
 * Staging and local builds answer "noindex" and robots.txt disallows everything.
 */
export const indexingAllowed = () => process.env.ALLOW_INDEXING === 'true'

const OG_LOCALE: Record<Locale, string> = { en: 'en_US', id: 'id_ID' }
/** Temporary share image until real photos arrive (spec §14). */
const DEFAULT_OG_IMAGE = { url: '/og-default.jpg', width: 1200, height: 630 }

/** hreflang alternates for a page: en, id and x-default (→ English), spec §9 SEO dasar. */
export const languageAlternates = (key: RouteKey) => ({
  ...Object.fromEntries(locales.map((l) => [l, href(key, l)])),
  'x-default': href(key, 'en'),
})

const ogImage = (image: unknown, fallbackAlt: string) => {
  if (image && typeof image === 'object') {
    const media = image as Media
    const size = media.sizes?.card?.url ? media.sizes.card : media.sizes?.hero?.url ? media.sizes.hero : null
    const url = size?.url ?? media.url
    if (url) {
      return {
        url,
        width: size?.width ?? media.width ?? undefined,
        height: size?.height ?? media.height ?? undefined,
        alt: media.alt || fallbackAlt,
      }
    }
  }
  return { ...DEFAULT_OG_IMAGE, alt: SITE_NAME }
}

type PageMeta = {
  key: RouteKey
  locale: Locale
  title: string
  description?: string | null
  image?: unknown
  /** Use the title as-is instead of "<title> — D’Sanga" (Home). */
  absoluteTitle?: boolean
}

/** Title, description, canonical, hreflang, Open Graph and Twitter card for one page in one language. */
export function pageMetadata({ key, locale, title, description, image, absoluteTitle }: PageMeta): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} — D’Sanga`
  const url = href(key, locale)
  const desc = description?.trim() || undefined
  const img = ogImage(image, title)
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description: desc,
    alternates: { canonical: url, languages: languageAlternates(key) },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      url,
      title: fullTitle,
      description: desc,
      locale: OG_LOCALE[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => OG_LOCALE[l]),
      images: [img],
    },
    twitter: { card: 'summary_large_image', title: fullTitle, description: desc, images: [img.url] },
  }
}
