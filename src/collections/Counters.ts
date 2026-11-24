import type { CollectionConfig } from 'payload'

/** Running numbers for orders and invoices. Written by src/lib/numbering.ts only. */
export const Counters: CollectionConfig = {
  slug: 'counters',
  admin: { hidden: true },
  access: { read: () => false, create: () => false, update: () => false, delete: () => false },
  fields: [
    { name: 'key', type: 'text', required: true, unique: true, index: true },
    { name: 'value', type: 'number', required: true, defaultValue: 0 },
  ],
}
