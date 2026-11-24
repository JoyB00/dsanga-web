import type { CollectionSlug, GlobalSlug, Payload } from 'payload'

/**
 * F-15 "Penanda data sementara": every record and setting has a Verified flag. Temporary data
 * (spec §14) stays unverified; staging shows it with a visual marker, and the go-live check
 * fails while unverified data would be visible in production.
 */

/** Staging only: outline unverified content on the public site (SHOW_TEMP_MARKERS=true). */
export const showTempMarkers = () => process.env.SHOW_TEMP_MARKERS === 'true'

type MaybeVerified = { verified?: boolean | null } | number | string | null | undefined

/** Spread onto the element that shows a CMS record: `<li {...temp(doc)}>`. */
export const temp = (...docs: MaybeVerified[]): { 'data-unverified'?: '' } =>
  showTempMarkers() && docs.some((doc) => doc && typeof doc === 'object' && !doc.verified) ? { 'data-unverified': '' } : {}

/** What the report checks: label, title field, and whether the collection has drafts. */
export const VERIFIED_COLLECTIONS: { slug: CollectionSlug; label: string; titleField: string; drafts: boolean }[] = [
  { slug: 'experiences', label: 'Experiences', titleField: 'title', drafts: true },
  { slug: 'menu-items', label: 'Menu items', titleField: 'name', drafts: true },
  { slug: 'events', label: 'Events', titleField: 'title', drafts: true },
  { slug: 'offers', label: 'Offers', titleField: 'title', drafts: true },
  { slug: 'venue-packages', label: 'Venue packages', titleField: 'name', drafts: true },
  { slug: 'faqs', label: 'FAQs', titleField: 'question', drafts: true },
  { slug: 'page-intros', label: 'Page headers', titleField: 'title', drafts: true },
  { slug: 'media', label: 'Photos', titleField: 'filename', drafts: false },
]

export const VERIFIED_GLOBALS: { slug: GlobalSlug; label: string }[] = [
  { slug: 'site-settings', label: 'Site settings' },
  { slug: 'home-page', label: 'Home page' },
  { slug: 'about-page', label: 'About page' },
  { slug: 'privacy-page', label: 'Privacy policy' },
  { slug: 'invoice-settings', label: 'Invoice settings' },
]

export type UnverifiedItem = { title: string; adminPath: string }
export type UnverifiedGroup = { label: string; listPath: string; total: number; items: UnverifiedItem[] }

/**
 * Published (visible) records that are still unverified. Drafts are not shown on the site, so
 * they do not block go-live. `limit` caps the items listed per group; `total` is always exact.
 */
export async function getUnverifiedReport(payload: Payload, limit = 5): Promise<UnverifiedGroup[]> {
  const groups: UnverifiedGroup[] = []

  for (const c of VERIFIED_COLLECTIONS) {
    const where = {
      and: [{ verified: { not_equals: true } }, ...(c.drafts ? [{ _status: { equals: 'published' } }] : [])],
    }
    const res = await payload.find({
      collection: c.slug,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      where: where as any,
      limit,
      depth: 0,
      locale: 'en',
      overrideAccess: true,
      pagination: true,
    })
    if (!res.totalDocs) continue
    groups.push({
      label: c.label,
      listPath: `/admin/collections/${c.slug}?where[verified][not_equals]=true`,
      total: res.totalDocs,
      items: res.docs.map((doc) => {
        const record = doc as unknown as Record<string, unknown>
        return {
          title: String(record[c.titleField] ?? record.key ?? record.page ?? `#${doc.id}`),
          adminPath: `/admin/collections/${c.slug}/${doc.id}`,
        }
      }),
    })
  }

  const unverifiedGlobals: UnverifiedItem[] = []
  for (const g of VERIFIED_GLOBALS) {
    const doc = (await payload.findGlobal({ slug: g.slug, depth: 0, overrideAccess: true })) as { verified?: boolean | null }
    if (!doc?.verified) unverifiedGlobals.push({ title: g.label, adminPath: `/admin/globals/${g.slug}` })
  }
  if (unverifiedGlobals.length) {
    groups.push({ label: 'Pages & settings', listPath: '/admin', total: unverifiedGlobals.length, items: unverifiedGlobals })
  }

  return groups
}
