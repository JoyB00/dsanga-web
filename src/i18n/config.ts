export const locales = ['en', 'id'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

export const isLocale = (value: string | undefined): value is Locale =>
  Boolean(value && (locales as readonly string[]).includes(value))

/**
 * Public URL slugs per language (spec §3.1). The app folders use the English slug;
 * src/proxy.ts maps /id/<indonesian-slug> onto them.
 */
export const routes = {
  home: { en: '', id: '' },
  about: { en: 'about', id: 'tentang' },
  pool: { en: 'pool', id: 'pool' },
  dining: { en: 'dining', id: 'bistro-coffee' },
  workSpace: { en: 'work-space', id: 'work-space' },
  activities: { en: 'activities', id: 'aktivitas' },
  events: { en: 'events', id: 'events' },
  offers: { en: 'offers', id: 'promo' },
  gallery: { en: 'gallery', id: 'galeri' },
  visit: { en: 'visit', id: 'info-kunjungan' },
  contact: { en: 'contact', id: 'kontak' },
  privacy: { en: 'privacy', id: 'kebijakan-privasi' },
} as const

export type RouteKey = keyof typeof routes

export const routeKeyForSlug = (locale: Locale, slug: string): RouteKey | undefined =>
  (Object.keys(routes) as RouteKey[]).find((key) => routes[key][locale] === slug)

/**
 * Which page a pathname points to. Accepts public URLs (/pool, /id/bistro-coffee) and the
 * internal rewritten form (/en/pool, /id/dining), so it works wherever the path comes from.
 */
export const routeKeyFromPathname = (pathname: string): RouteKey => {
  const segments = pathname.split('/').filter(Boolean)
  const prefixed = segments[0] === 'id' || segments[0] === 'en'
  const slug = (prefixed ? segments[1] : segments[0]) ?? ''
  return routeKeyForSlug('id', slug) ?? routeKeyForSlug('en', slug) ?? 'home'
}

/** Public href for a page in a language: English has no prefix, Indonesian lives under /id. */
export const href = (key: RouteKey, locale: Locale, hash?: string): string => {
  const slug = routes[key][locale]
  const base = locale === defaultLocale ? `/${slug}` : `/id${slug ? `/${slug}` : ''}`
  return hash ? `${base}#${hash}` : base
}
