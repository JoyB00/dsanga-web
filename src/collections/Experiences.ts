import type { CollectionConfig, Where } from 'payload'

import { canEditProducts } from '../access/roles'
import { governanceFields } from '../fields/governance'
import { auditHooks } from '../hooks/auditLog'
import { restrictPublish } from '../hooks/restrictPublish'

/**
 * Pool, Bistro & Coffee, Work & Space and each activity (F-02 product management).
 * Status drives the "Coming Soon" label and hides items from the public site.
 */
export const Experiences: CollectionConfig = {
  slug: 'experiences',
  admin: {
    group: 'Products',
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'availability', 'verified', 'updatedAt'],
  },
  versions: { drafts: true, maxPerDoc: 50 },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      const publicOnly: Where = { and: [{ _status: { equals: 'published' } }, { availability: { not_equals: 'hidden' } }] }
      return publicOnly
    },
    create: canEditProducts,
    update: canEditProducts,
    delete: canEditProducts,
    readVersions: canEditProducts,
  },
  hooks: {
    beforeChange: [restrictPublish],
    ...auditHooks,
  },
  fields: [
    { name: 'title', type: 'text', required: true, localized: true },
    {
      name: 'key',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Stable id used by the site, e.g. pool, dining, coffee, work-space, playground, wellness.',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      options: [
        { value: 'pool', label: 'Pool' },
        { value: 'dining', label: 'Bistro & Coffee' },
        { value: 'work', label: 'Work & Space' },
        { value: 'activity', label: 'Activity' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      // Not "status": that name clashes with the drafts enum (_status) in Postgres.
      name: 'availability',
      type: 'select',
      required: true,
      defaultValue: 'available',
      options: [
        { value: 'available', label: 'Available / Tersedia' },
        { value: 'coming-soon', label: 'Coming Soon / Segera hadir' },
        { value: 'hidden', label: 'Hidden / Disembunyikan' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    ...governanceFields,
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Content',
          fields: [
            { name: 'tagline', type: 'text', localized: true },
            { name: 'summary', type: 'textarea', localized: true },
            { name: 'heroImage', type: 'upload', relationTo: 'media' },
            { name: 'gallery', type: 'upload', relationTo: 'media', hasMany: true },
            {
              name: 'facilities',
              type: 'array',
              fields: [{ name: 'label', type: 'text', required: true, localized: true }],
            },
            { name: 'capacity', type: 'text', localized: true },
          ],
        },
        {
          label: 'Hours & prices',
          description: 'Publishing changes here needs approver sign-off (F-11).',
          fields: [
            {
              name: 'hours',
              type: 'group',
              fields: [
                { name: 'weekday', type: 'text', admin: { placeholder: '08.00–18.00' } },
                { name: 'weekend', type: 'text', admin: { placeholder: '07.00–18.00' } },
                { name: 'note', type: 'text', localized: true },
              ],
            },
            {
              name: 'prices',
              type: 'array',
              fields: [
                { name: 'label', type: 'text', required: true, localized: true },
                // Localized because values can be words ("Free" / "Gratis", "On request" / "Sesuai permintaan").
                { name: 'weekday', type: 'text', localized: true },
                { name: 'weekend', type: 'text', localized: true },
                { name: 'unit', type: 'text', localized: true, admin: { placeholder: '/ person' } },
              ],
            },
            { name: 'paymentNote', type: 'text', localized: true },
          ],
        },
        {
          label: 'Rules',
          fields: [
            { name: 'rules', type: 'richText', localized: true },
            { name: 'childPolicy', type: 'richText', localized: true },
            { name: 'terms', type: 'richText', localized: true },
          ],
        },
        {
          label: 'WhatsApp',
          fields: [
            {
              name: 'whatsappContext',
              type: 'text',
              localized: true,
              admin: {
                description: 'Topic used in the pre-filled WhatsApp message, e.g. "Pool" (F-03).',
              },
            },
          ],
        },
      ],
    },
  ],
}
