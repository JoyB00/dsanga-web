import type { CollectionConfig } from 'payload'

import { canEditContent } from '../access/roles'
import { governanceFields } from '../fields/governance'
import { readPrice, showPriceField } from '../fields/price'
import { auditHooks } from '../hooks/auditLog'
import { restrictPublish } from '../hooks/restrictPublish'

/** Private event / venue hire packages on the Events page. */
export const VenuePackages: CollectionConfig = {
  slug: 'venue-packages',
  admin: { group: 'Content', useAsTitle: 'name', defaultColumns: ['name', 'capacity', 'priceFrom', 'verified'] },
  versions: { drafts: true, maxPerDoc: 10 },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
    create: canEditContent,
    update: canEditContent,
    delete: canEditContent,
  },
  hooks: { beforeChange: [restrictPublish], ...auditHooks },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'capacity', type: 'number', required: true, min: 1 },
    { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Photo on the package card (Home). Landscape or portrait.' } },
    { name: 'priceFrom', type: 'number', min: 0, access: { read: readPrice }, admin: { description: 'Leave empty for "On request".' } },
    {
      name: 'inclusions',
      type: 'array',
      fields: [{ name: 'label', type: 'text', required: true, localized: true }],
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    showPriceField,
    ...governanceFields,
  ],
}
