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
    beforeChange: [
      requireBothLocalesGlobal(['hero.title', 'hero.intro', 'experiences.title', 'about.title', 'about.values.*.label', 'whyVisit.items.*.title']),
    ],
  },
  fields: [
    {
      name: 'hero',
      type: 'group',
      fields: [
        text('eyebrow'),
        text('title', true),
        {
          ...text('titleAccent'),
          admin: { description: 'Words at the end of the title shown in the accent colour, e.g. “a Space for Everyone”. Must appear in the title.' },
        },
        { ...text('tagline'), admin: { description: 'Short italic line under the title. Empty = hidden.' } },
        { name: 'intro', type: 'textarea', localized: true, required: true },
        { name: 'image', type: 'upload', relationTo: 'media', admin: { description: 'Full-width photo behind the title: landscape, at least 2400 px wide, calm area in the middle.' } },
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
        { name: 'quote', type: 'textarea', localized: true, admin: { description: 'Quote card under the text. Empty = hidden.' } },
        { name: 'image', type: 'upload', relationTo: 'media' },
        {
          name: 'values',
          type: 'array',
          maxRows: 4,
          fields: [
            { name: 'label', type: 'text', localized: true, required: true },
            iconField(),
            { name: 'text', type: 'text', localized: true, admin: { description: 'One short sentence (hidden on phones).' } },
          ],
        },
      ],
    },
    {
      name: 'ways',
      label: 'Four ways section (dark)',
      type: 'group',
      admin: { description: 'One card per experience type: Pool, Bistro & Coffee, Work & Space, Activities.' },
      fields: [text('eyebrow'), text('title'), { name: 'intro', type: 'textarea', localized: true }],
    },
    {
      name: 'whyVisit',
      label: 'Why D’Sanga section',
      type: 'group',
      admin: { description: 'Hidden when there are no items.' },
      fields: [
        text('eyebrow'),
        text('title'),
        { name: 'intro', type: 'textarea', localized: true },
        {
          name: 'items',
          type: 'array',
          maxRows: 4,
          fields: [iconField(), { name: 'title', type: 'text', localized: true, required: true }, { name: 'text', type: 'textarea', localized: true }],
        },
      ],
    },
    { name: 'gallery', type: 'group', fields: [text('eyebrow'), text('title')] },
    { name: 'visit', label: 'Plan your visit section', type: 'group', fields: [text('eyebrow'), text('title')] },
    {
      name: 'cta',
      label: 'Closing call to action',
      type: 'group',
      fields: [text('eyebrow'), text('title'), { name: 'text', type: 'textarea', localized: true }],
    },
    // F-15: temporary data marker + person in charge.
    ...governanceFields,
  ],
}
