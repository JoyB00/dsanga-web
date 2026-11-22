import type { GlobalConfig } from 'payload'

import { hasRole } from '../access/roles'
import { iconField } from '../fields/icons'
import { requireBothLocalesGlobal } from '../hooks/requireBothLocales'

const text = (name: string, required = false) => ({ name, type: 'text' as const, localized: true, required })

/** Editable copy for the About page (spec §4 “Tentang D’Sanga”). */
export const AboutPage: GlobalConfig = {
  slug: 'about-page',
  label: 'About page',
  admin: { group: 'Pages' },
  versions: { drafts: true, max: 20 },
  access: {
    read: () => true,
    update: ({ req }) => hasRole(req.user, 'super-admin', 'approver', 'content-admin'),
  },
  hooks: { beforeChange: [requireBothLocalesGlobal(['hero.title', 'story.title', 'story.body', 'values.items.*.title'])] },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        text('title', true),
        text('tagline'),
        { name: 'intro', type: 'textarea', localized: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'story',
      type: 'group',
      fields: [text('eyebrow'), text('title', true), { name: 'body', type: 'richText', localized: true, required: true }],
    },
    { name: 'managed', label: 'Managed by', type: 'group', fields: [text('eyebrow'), text('title'), { name: 'text', type: 'textarea', localized: true }] },
    {
      name: 'purpose',
      type: 'group',
      fields: [text('eyebrow'), text('title'), { name: 'items', type: 'array', fields: [text('text', true)] }],
    },
    {
      name: 'values',
      type: 'group',
      fields: [
        text('eyebrow'),
        text('title'),
        {
          name: 'items',
          type: 'array',
          maxRows: 8,
          fields: [text('title', true), { name: 'text', type: 'textarea', localized: true }, iconField()],
        },
      ],
    },
    { name: 'cta', label: 'Closing call to action', type: 'group', fields: [text('title'), { name: 'text', type: 'textarea', localized: true }] },
  ],
}
