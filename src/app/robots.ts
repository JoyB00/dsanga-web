import type { MetadataRoute } from 'next'

import { indexingAllowed, siteUrl } from '@/lib/seo'

// Read at request time so one build can serve staging (blocked) and production (open).
export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  if (!indexingAllowed()) return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api/'] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  }
}
