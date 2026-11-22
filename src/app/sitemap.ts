import type { MetadataRoute } from 'next'

import { href, locales, routes, type RouteKey } from '@/i18n/config'
import { languageAlternates, siteUrl } from '@/lib/seo'

/** XML sitemap with every page in both languages and hreflang links (spec §3.1, §9). */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl()
  const absolute = (path: string) => `${base}${path === '/' ? '' : path}` || base
  return (Object.keys(routes) as RouteKey[]).flatMap((key) =>
    locales.map((locale) => ({
      url: absolute(href(key, locale)),
      changeFrequency: key === 'events' || key === 'offers' ? ('weekly' as const) : ('monthly' as const),
      priority: key === 'home' ? 1 : key === 'privacy' ? 0.3 : 0.7,
      alternates: {
        languages: Object.fromEntries(Object.entries(languageAlternates(key)).map(([lang, path]) => [lang, absolute(path)])),
      },
    })),
  )
}
