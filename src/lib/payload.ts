import config from '@payload-config'
import { getPayload } from 'payload'
import { cache } from 'react'

export const getPayloadClient = cache(() => getPayload({ config }))

export const getSiteSettings = cache(async (locale: 'en' | 'id') => {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', locale, fallbackLocale: false })
})
