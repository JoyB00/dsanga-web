import { cache } from 'react'

import type { PageIntroKey } from '../collections/PageIntros'
import type { Locale } from '../i18n/config'
import { getDictionary } from '../i18n/dictionaries'
import { getPageIntro } from './queries'

/**
 * Page header copy: edited in the CMS (Page headers collection); the built-in text is only
 * used when a field is empty.
 */
export const getPageHead = cache(async (key: PageIntroKey, locale: Locale) => {
  const t = getDictionary(locale)
  const fallback: Record<PageIntroKey, { title: string; tagline?: string; intro?: string }> = {
    activities: { title: t.activities.title, tagline: t.activities.tagline, intro: t.activities.intro },
    events: { title: t.events.title, tagline: t.events.tagline, intro: t.events.intro },
    offers: { title: t.offers.title, intro: t.offers.intro },
    gallery: { title: t.gallery.title, intro: t.gallery.intro },
    visit: { title: t.visit.title, tagline: t.visit.tagline },
    contact: { title: t.contact.title, intro: t.contact.intro },
  }
  const intro = await getPageIntro(key, locale)
  return {
    title: intro?.title || fallback[key].title,
    tagline: intro?.tagline || fallback[key].tagline,
    intro: intro?.intro || fallback[key].intro,
    image: intro?.heroImage,
  }
})
