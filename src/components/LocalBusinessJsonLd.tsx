import { href, type Locale } from '@/i18n/config'
import type { Media, SiteSetting } from '@/payload-types'
import { SITE_NAME, siteUrl } from '@/lib/seo'

type Props = { locale: Locale; settings: SiteSetting | null; description?: string | null; image?: unknown }

/**
 * Local SEO (spec §10): schema.org LocalBusiness built from Site settings, so name, address and
 * phone (NAP) always match what the site shows. Fields that are empty in the CMS are left out.
 */
export function LocalBusinessJsonLd({ locale, settings, description, image }: Props) {
  const base = siteUrl()
  const phone = (settings?.whatsappNumber ?? '').replace(/\D/g, '')
  const media = image && typeof image === 'object' ? (image as Media) : null
  const imageUrl = media?.sizes?.hero?.url || media?.url || '/og-default.jpg'
  const social = settings?.social
  const sameAs = [social?.instagram, social?.facebook, social?.tiktok].filter(Boolean)

  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${base}/#business`,
    name: SITE_NAME,
    url: `${base}${href('home', locale) === '/' ? '' : href('home', locale)}` || base,
    description: description || undefined,
    image: imageUrl.startsWith('http') ? imageUrl : `${base}${imageUrl}`,
    telephone: phone.length >= 8 ? `+${phone}` : undefined,
    email: settings?.email || undefined,
    address: settings?.address
      ? {
          '@type': 'PostalAddress',
          streetAddress: settings.address.replace(/\s*\n\s*/g, ', '),
          addressLocality: 'Sukawati',
          addressRegion: 'Bali',
          addressCountry: 'ID',
        }
      : undefined,
    hasMap: settings?.mapsUrl || undefined,
    sameAs: sameAs.length ? sameAs : undefined,
    parentOrganization: { '@type': 'GovernmentOrganization', name: 'Desa Sukawati' },
    inLanguage: locale,
  }

  return (
    <script
      type="application/ld+json"
      // `<` is escaped so CMS text can never close the script tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
