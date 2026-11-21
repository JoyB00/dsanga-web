import type { CollectionConfig } from 'payload'

import { anyone, canEditContent } from '../access/roles'
import { governanceFields } from '../fields/governance'
import { auditHooks } from '../hooks/auditLog'

/** F-10: FAQ managed by topic, shown on related pages and collected on Visit Us. */
export const Faqs: CollectionConfig = {
  slug: 'faqs',
  labels: { singular: 'FAQ', plural: 'FAQs' },
  admin: { group: 'Content', useAsTitle: 'question', defaultColumns: ['question', 'topic', 'order'] },
  defaultSort: 'order',
  access: {
    read: anyone,
    create: canEditContent,
    update: canEditContent,
    delete: canEditContent,
  },
  hooks: auditHooks,
  fields: [
    { name: 'question', type: 'text', required: true, localized: true },
    { name: 'answer', type: 'textarea', required: true, localized: true },
    {
      name: 'topic',
      type: 'select',
      required: true,
      options: [
        { value: 'general', label: 'General' },
        { value: 'pool', label: 'Pool & kids' },
        { value: 'dining', label: 'Bistro & Coffee' },
        { value: 'work', label: 'Work & Space' },
        { value: 'events', label: 'Events' },
        { value: 'visit', label: 'Getting here' },
      ],
    },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    ...governanceFields,
  ],
}
