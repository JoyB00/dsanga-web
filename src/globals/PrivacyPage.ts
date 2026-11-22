import type { GlobalConfig } from 'payload'

import { hasRole } from '../access/roles'
import { governanceFields } from '../fields/governance'
import { requireBothLocalesGlobal } from '../hooks/requireBothLocales'

/** Privacy policy text (spec §4, §9 Kepatuhan). Final wording is approved by the pengelola. */
export const PrivacyPage: GlobalConfig = {
  slug: 'privacy-page',
  label: 'Privacy policy',
  admin: { group: 'Pages' },
  versions: { drafts: true, max: 20 },
  access: {
    read: () => true,
    update: ({ req }) => hasRole(req.user, 'super-admin', 'approver'),
  },
  hooks: { beforeChange: [requireBothLocalesGlobal(['title', 'sections.*.title', 'sections.*.body'])] },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'lastUpdated', type: 'date', admin: { position: 'sidebar' } },
    {
      name: 'sections',
      type: 'array',
      minRows: 1,
      fields: [
        {
          name: 'anchor',
          type: 'text',
          required: true,
          admin: { description: 'Short id used in the page link, e.g. "cookies".' },
          validate: (value: unknown) => (typeof value === 'string' && /^[a-z0-9-]+$/.test(value)) || 'Use lowercase letters, numbers and dashes only.',
        },
        { name: 'title', type: 'text', localized: true, required: true },
        { name: 'body', type: 'richText', localized: true, required: true },
      ],
    },
    // F-15: temporary data marker + person in charge.
    ...governanceFields,
  ],
}
