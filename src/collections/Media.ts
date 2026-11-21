import type { CollectionConfig } from 'payload'

import { anyone, canEditMedia } from '../access/roles'
import { auditHooks } from '../hooks/auditLog'

export const GALLERY_CATEGORIES = [
  { value: 'ambience', label: 'Ambience / Suasana' },
  { value: 'pool', label: 'Pool' },
  { value: 'dining', label: 'Dining' },
  { value: 'work', label: 'Work & Space' },
  { value: 'activities', label: 'Activities / Aktivitas' },
  { value: 'events', label: 'Events' },
] as const

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content', defaultColumns: ['filename', 'alt', 'galleryCategory', 'showInGallery'] },
  access: {
    read: anyone,
    create: canEditMedia,
    update: canEditMedia,
    delete: canEditMedia,
  },
  hooks: auditHooks,
  upload: {
    mimeTypes: ['image/*'],
    // F-04 / §9 performance: WebP output and responsive sizes.
    formatOptions: { format: 'webp', options: { quality: 80 } },
    imageSizes: [
      { name: 'thumb', width: 480, formatOptions: { format: 'webp', options: { quality: 75 } } },
      { name: 'card', width: 960, formatOptions: { format: 'webp', options: { quality: 78 } } },
      { name: 'hero', width: 1920, formatOptions: { format: 'webp', options: { quality: 80 } } },
    ],
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      localized: true,
      admin: { description: 'Describe the photo for screen readers. Required in English and Indonesian.' },
    },
    { name: 'caption', type: 'text', localized: true },
    {
      name: 'showInGallery',
      type: 'checkbox',
      defaultValue: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'galleryCategory',
      type: 'select',
      options: [...GALLERY_CATEGORIES],
      admin: { position: 'sidebar', condition: (_, siblingData) => Boolean(siblingData?.showInGallery) },
    },
    {
      name: 'usageRights',
      type: 'text',
      admin: { position: 'sidebar', description: 'Photo credit / permission note (spec §9 Kepatuhan).' },
    },
  ],
}
