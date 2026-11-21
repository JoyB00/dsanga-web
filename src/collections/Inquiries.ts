import { APIError, type CollectionConfig } from 'payload'

import { hasRole } from '../access/roles'

/** F-14: contact / availability form submissions. Public create, staff read. */
export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  admin: { group: 'Inbox', useAsTitle: 'name', defaultColumns: ['name', 'topic', 'status', 'createdAt'] },
  access: {
    create: () => true,
    read: ({ req }) => hasRole(req.user, 'super-admin', 'approver', 'content-admin', 'product-admin'),
    update: ({ req }) => hasRole(req.user, 'super-admin', 'approver', 'content-admin', 'product-admin'),
    delete: ({ req }) => hasRole(req.user, 'super-admin'),
  },
  hooks: {
    beforeValidate: [
      async ({ data, req, operation }) => {
        if (operation !== 'create' || req.user) return data
        // Honeypot: real visitors never fill this hidden field (F-09).
        if (data?.website) throw new APIError('Invalid submission.', 400, undefined, true)
        const settings = await req.payload.findGlobal({ slug: 'site-settings', req })
        if (!settings?.contactFormEnabled) {
          throw new APIError('The contact form is currently turned off. Please contact us on WhatsApp.', 403, undefined, true)
        }
        if (!data?.consent) throw new APIError('Please agree to the privacy policy.', 400, undefined, true)
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, maxLength: 120 },
    { name: 'email', type: 'email', required: true },
    { name: 'whatsapp', type: 'text', maxLength: 30 },
    {
      name: 'topic',
      type: 'select',
      defaultValue: 'general',
      options: ['general', 'pool', 'dining', 'work', 'events', 'other'].map((v) => ({ value: v, label: v })),
    },
    { name: 'visitDate', type: 'date' },
    { name: 'people', type: 'number', min: 1 },
    { name: 'message', type: 'textarea', required: true, maxLength: 2000 },
    { name: 'locale', type: 'select', options: ['en', 'id'].map((v) => ({ value: v, label: v })) },
    { name: 'consent', type: 'checkbox', required: true },
    { name: 'website', type: 'text', admin: { hidden: true } },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      options: [
        { value: 'new', label: 'New' },
        { value: 'answered', label: 'Answered' },
        { value: 'closed', label: 'Closed' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
