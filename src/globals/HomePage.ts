import type { GlobalConfig } from 'payload'

import { hasRole } from '../access/roles'
import { governanceFields } from '../fields/governance'
import { iconField } from '../fields/icons'
import { requireBothLocalesGlobal } from '../hooks/requireBothLocales'

const text = (name: string, required = false) => ({ name, type: 'text' as const, localized: true, required })

/** Editable copy for the Home page (spec §5). Experiences, offers and FAQs come from their own collections. */
export const HomePage: GlobalConfig = {
  slug: 'home-page',
  label: 'Home page',
  admin: { group: 'Pages' },
  versions: { drafts: true, max: 20 },
  access: {
    read: () => true,
    update: ({ req }) => hasRole(req.user, 'super-admin', 'approver', 'content-admin'),
  },
  hooks: {
    beforeChange: [requireBothLocalesGlobal(['hero.title', 'hero.intro', 'experiences.title', 'about.title', 'about.values.*.label'])],
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        text('eyebrow'),
        text('title', true),
        { name: 'intro', type: 'textarea', localized: true, required: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
      ],
    },
    {
      name: 'experiences',
      label: 'Explore section',
      type: 'group',
      fields: [text('eyebrow'), text('title', true), { name: 'intro', type: 'textarea', localized: true }],
    },
    { name: 'highlights', label: 'Offers & events section', type: 'group', fields: [text('eyebrow'), text('title')] },
    {
      name: 'about',
      type: 'group',
      fields: [
        text('eyebrow'),
        text('title', true),
        { name: 'text', type: 'textarea', localized: true },
        { name: 'image', type: 'upload', relationTo: 'media' },
        {
          name: 'values',
          type: 'array',
          maxRows: 4,
          fields: [{ name: 'label', type: 'text', localized: true, required: true }, iconField()],
        },
      ],
    },
    { name: 'gallery', type: 'group', fields: [text('eyebrow'), text('title')] },
    { name: 'visit', label: 'Plan your visit section', type: 'group', fields: [text('eyebrow'), text('title')] },
    // F-15: temporary data marker + person in charge.
    ...governanceFields,
  ],
}
