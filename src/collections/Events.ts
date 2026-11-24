import type { CollectionConfig } from 'payload'

import { canEditContent } from '../access/roles'
import { governanceFields } from '../fields/governance'
import { readPrice, showPriceField } from '../fields/price'
import { auditHooks } from '../hooks/auditLog'

/** Agenda + archive. Events whose start date has passed are shown in the archive (F-13). */
export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'startsAt', '_status', 'verified'],
  },
  versions: { drafts: true, maxPerDoc: 25 },
  defaultSort: 'startsAt',
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
    create: canEditContent,
    update: canEditContent,
    delete: canEditContent,
    readVersions: canEditContent,
  },
  hooks: auditHooks,
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { value: 'class', label: 'Class' },
        { value: 'workshop', label: 'Workshop' },
        { value: 'music', label: 'Live music' },
        { value: 'market', label: 'Festival & creative market' },
        { value: 'community', label: 'Community' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'startsAt', type: 'date', required: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'endsAt', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    { name: 'location', type: 'text', localized: true },
    { name: 'summary', type: 'textarea', localized: true },
    { name: 'description', type: 'richText', localized: true },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      type: 'row',
      fields: [
        { name: 'capacity', type: 'number', min: 0 },
        { name: 'priceAmount', type: 'number', min: 0, access: { read: readPrice }, admin: { description: 'Rupiah, no separators.' } },
        { name: 'price', type: 'text', label: 'Price words', localized: true, access: { read: readPrice }, admin: { description: 'Only for words instead of a number, e.g. Free.' } },
      ],
    },
    {
      name: 'joinViaWhatsApp',
      type: 'checkbox',
      defaultValue: true,
      admin: { description: 'Show "Join via WhatsApp" with the event name as context.' },
    },
    showPriceField,
    ...governanceFields,
  ],
}
