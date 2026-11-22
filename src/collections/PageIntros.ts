import type { CollectionConfig } from 'payload'

import { canEditContent } from '../access/roles'
import { governanceFields } from '../fields/governance'
import { auditHooks } from '../hooks/auditLog'
import { requireBothLocales } from '../hooks/requireBothLocales'

/**
 * Header copy (title, tagline, intro, photo) for pages whose body comes from other collections:
 * Activities, Events, Offers, Gallery, Visit Us, Contact.
 */
export const PAGE_INTRO_KEYS = [
  { value: 'activities', label: 'Activities' },
  { value: 'events', label: 'Events' },
  { value: 'offers', label: 'Offers' },
  { value: 'gallery', label: 'Gallery' },
  { value: 'visit', label: 'Visit Us' },
  { value: 'contact', label: 'Contact' },
] as const

export type PageIntroKey = (typeof PAGE_INTRO_KEYS)[number]['value']

export const PageIntros: CollectionConfig = {
  slug: 'page-intros',
  labels: { singular: 'Page header', plural: 'Page headers' },
  admin: { group: 'Pages', useAsTitle: 'title', defaultColumns: ['title', 'page', '_status', 'updatedAt'] },
  versions: { drafts: true, maxPerDoc: 20 },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
    create: canEditContent,
    update: canEditContent,
    delete: ({ req }) => Boolean(req.user && (req.user as { role?: string }).role === 'super-admin'),
  },
  hooks: { beforeChange: [requireBothLocales(['title'])], ...auditHooks },
  fields: [
    { name: 'page', type: 'select', required: true, unique: true, options: [...PAGE_INTRO_KEYS], admin: { position: 'sidebar' } },
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'tagline', type: 'text', localized: true },
    { name: 'intro', type: 'textarea', localized: true },
    { name: 'heroImage', type: 'upload', relationTo: 'media' },
    ...governanceFields,
  ],
}
