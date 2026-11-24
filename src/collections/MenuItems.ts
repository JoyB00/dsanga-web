import type { CollectionConfig } from 'payload'

import { canEditProducts } from '../access/roles'
import { governanceFields } from '../fields/governance'
import { readPrice, showPriceField } from '../fields/price'
import { auditHooks } from '../hooks/auditLog'
import { restrictPublish } from '../hooks/restrictPublish'

export const MenuItems: CollectionConfig = {
  slug: 'menu-items',
  admin: {
    group: 'Products',
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'price', 'featured', 'verified'],
  },
  versions: { drafts: true, maxPerDoc: 25 },
  access: {
    read: ({ req }) => (req.user ? true : { _status: { equals: 'published' } }),
    create: canEditProducts,
    update: canEditProducts,
    delete: canEditProducts,
    readVersions: canEditProducts,
  },
  hooks: { beforeChange: [restrictPublish], ...auditHooks },
  fields: [
    { name: 'name', type: 'text', required: true, localized: true },
    { name: 'description', type: 'text', localized: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { value: 'mains', label: 'Mains' },
        { value: 'snacks', label: 'Snacks' },
        { value: 'kids', label: 'Kids' },
        { value: 'coffee', label: 'Coffee' },
        { value: 'drinks', label: 'Drinks' },
        { value: 'desserts', label: 'Desserts' },
      ],
    },
    { name: 'price', type: 'number', min: 0, access: { read: readPrice }, admin: { description: 'Rupiah, no separators.' } },
    { name: 'dietaryNote', type: 'text', localized: true, admin: { placeholder: 'Spicy · Contains peanuts' } },
    { name: 'image', type: 'upload', relationTo: 'media' },
    { name: 'featured', type: 'checkbox', defaultValue: false, admin: { position: 'sidebar' } },
    { name: 'available', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'order', type: 'number', defaultValue: 0, admin: { position: 'sidebar' } },
    showPriceField,
    ...governanceFields,
  ],
}
