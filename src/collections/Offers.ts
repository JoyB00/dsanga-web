import type { CollectionConfig, Where } from 'payload'

import { canEditContent } from '../access/roles'
import { governanceFields } from '../fields/governance'
import { readPrice, showPriceField } from '../fields/price'
import { auditHooks } from '../hooks/auditLog'
import { restrictPublish } from '../hooks/restrictPublish'

/** Promo. Expired offers are hidden from the public automatically (F-13); publishing needs approval (F-11). */
export const Offers: CollectionConfig = {
  slug: 'offers',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'validFrom', 'validUntil', '_status', 'verified'],
  },
  versions: { drafts: true, maxPerDoc: 25 },
  defaultSort: 'validUntil',
  access: {
    read: ({ req }) => {
      if (req.user) return true
      const now = new Date().toISOString()
      const activeOnly: Where = {
        and: [
          { _status: { equals: 'published' } },
          { validFrom: { less_than_equal: now } },
          { validUntil: { greater_than_equal: now } },
        ],
      }
      return activeOnly
    },
    create: canEditContent,
    update: canEditContent,
    delete: canEditContent,
    readVersions: canEditContent,
  },
  hooks: { beforeChange: [restrictPublish], ...auditHooks },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    {
      name: 'category',
      type: 'text',
      localized: true,
      admin: { placeholder: 'Pool + Dining' },
    },
    {
      type: 'row',
      fields: [
        { name: 'validFrom', type: 'date', required: true },
        { name: 'validUntil', type: 'date', required: true },
      ],
    },
    { name: 'summary', type: 'textarea', localized: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      type: 'row',
      fields: [
        { name: 'price', type: 'number', min: 0, access: { read: readPrice } },
        { name: 'originalPrice', type: 'number', min: 0, access: { read: readPrice } },
        { name: 'priceUnit', type: 'text', localized: true, admin: { placeholder: '/ person' } },
      ],
    },
    { name: 'terms', type: 'richText', localized: true },
    showPriceField,
    ...governanceFields,
  ],
}
