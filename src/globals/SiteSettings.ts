import type { GlobalConfig } from 'payload'

import { approverFieldAccess, hasRole } from '../access/roles'

/** Contact details, opening hours and switches used across the site (spec §3.2, §4, F-03, F-14). */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  admin: { group: 'Admin' },
  access: {
    read: () => true,
    update: ({ req }) => hasRole(req.user, 'super-admin', 'approver'),
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Contact',
          fields: [
            {
              name: 'whatsappNumber',
              type: 'text',
              required: true,
              admin: {
                description:
                  'International format without + or spaces, e.g. 6281234567890. Used by every WhatsApp button (F-03). During development: vendor test number only.',
              },
            },
            { name: 'serviceHours', type: 'text', localized: true, admin: { placeholder: 'Daily 08.00–20.00 WITA' } },
            { name: 'email', type: 'email' },
            {
              name: 'social',
              type: 'group',
              admin: { description: 'Empty links are hidden on the site.' },
              fields: [
                { name: 'instagram', type: 'text' },
                { name: 'facebook', type: 'text' },
                { name: 'tiktok', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Location & hours',
          fields: [
            { name: 'address', type: 'textarea', localized: true, required: true },
            { name: 'mapsUrl', type: 'text', admin: { description: 'Google Maps link for "Get Directions".' } },
            { name: 'mapEmbedUrl', type: 'text' },
            {
              name: 'openingHours',
              type: 'array',
              fields: [
                { name: 'area', type: 'text', required: true, localized: true },
                // Localized because values can be words ("Closed" / "Tutup").
                { name: 'weekday', type: 'text', localized: true },
                { name: 'weekend', type: 'text', localized: true },
              ],
            },
            { name: 'specialHours', type: 'textarea', localized: true },
            { name: 'parking', type: 'textarea', localized: true },
            { name: 'transport', type: 'textarea', localized: true, admin: { description: 'How to get here (airport, Ubud, …).' } },
            { name: 'accessibility', type: 'textarea', localized: true },
          ],
        },
        {
          label: 'Downloads',
          fields: [
            {
              name: 'menuPdf',
              type: 'upload',
              relationTo: 'documents',
              localized: true,
              admin: { description: 'Printable menu per language. The “Download Menu” button hides when empty.' },
            },
          ],
        },
        {
          label: 'Switches',
          fields: [
            {
              name: 'contactFormEnabled',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'F-14: show the contact / availability forms.' },
            },
            {
              name: 'verified',
              type: 'checkbox',
              defaultValue: false,
              access: { update: approverFieldAccess },
              admin: { description: 'F-15: all contact data above is final and approved.' },
            },
          ],
        },
      ],
    },
  ],
}
