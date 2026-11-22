import { cache } from 'react'

import type { Locale } from '../i18n/config'
import type { PageIntroKey } from '../collections/PageIntros'
import type { Faq } from '../payload-types'
import { getPayloadClient } from './payload'

/**
 * Public data access. `overrideAccess: false` applies the same rules as an anonymous
 * visitor: published only, hidden experiences and expired offers excluded (F-13).
 */
const base = (locale: Locale) => ({ locale, fallbackLocale: false as const, overrideAccess: false, depth: 1 })

const getGlobal = async <S extends 'home-page' | 'about-page' | 'privacy-page'>(slug: S, locale: Locale) => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug, locale, fallbackLocale: false, depth: 1, draft: false }).catch(() => null)
}

export const getHomePage = cache((locale: Locale) => getGlobal('home-page', locale))
export const getAboutPage = cache((locale: Locale) => getGlobal('about-page', locale))
export const getPrivacyPage = cache((locale: Locale) => getGlobal('privacy-page', locale))

/** Header copy for Activities, Events, Offers, Gallery, Visit Us and Contact. */
export const getPageIntro = cache(async (page: PageIntroKey, locale: Locale) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'page-intros',
    ...base(locale),
    where: { page: { equals: page } },
    limit: 1,
  })
  return docs[0] ?? null
})

export const getExperiences = cache(async (locale: Locale) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'experiences', ...base(locale), sort: 'order', limit: 50 })
  return docs
})

export const getExperience = cache(async (key: string, locale: Locale) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'experiences',
    ...base(locale),
    where: { key: { equals: key } },
    limit: 1,
  })
  return docs[0] ?? null
})

export const getMenuItems = cache(async (locale: Locale) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'menu-items',
    ...base(locale),
    where: { available: { equals: true } },
    sort: 'order',
    limit: 200,
  })
  return docs
})

export const getFaqs = cache(async (locale: Locale, topics?: Faq['topic'][]) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'faqs',
    ...base(locale),
    where: topics?.length ? { topic: { in: topics } } : undefined,
    sort: 'order',
    limit: 50,
  })
  return docs
})

export const getActiveOffers = cache(async (locale: Locale, limit = 6) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'offers', ...base(locale), sort: 'validUntil', limit })
  return docs
})

export const getUpcomingEvents = cache(async (locale: Locale, limit = 6) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'events',
    ...base(locale),
    where: { startsAt: { greater_than_equal: new Date().toISOString() } },
    sort: 'startsAt',
    limit,
  })
  return docs
})

export const getActivities = cache(async (locale: Locale) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'experiences',
    ...base(locale),
    where: { type: { equals: 'activity' } },
    sort: 'order',
    limit: 50,
  })
  return docs
})

/** Events whose start date has passed — the archive (F-13). */
export const getPastEvents = cache(async (locale: Locale, limit = 8) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'events',
    ...base(locale),
    where: { startsAt: { less_than: new Date().toISOString() } },
    sort: '-startsAt',
    limit,
  })
  return docs
})

export const getVenuePackages = cache(async (locale: Locale) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({ collection: 'venue-packages', ...base(locale), sort: 'order', limit: 20 })
  return docs
})

export const getGalleryMedia = cache(async (locale: Locale, limit = 6) => {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'media',
    ...base(locale),
    where: { showInGallery: { equals: true } },
    sort: '-createdAt',
    limit,
  })
  return docs
})
