import type { CollectionConfig } from 'payload'

import { canManageOrders, hasRole } from '../access/roles'
import { auditHooks } from '../hooks/auditLog'

/** Tables staff can assign to a reservation. Never shown on the website. */
export const DiningTables: CollectionConfig = {
  slug: 'dining-tables',
  labels: { singular: 'Meja', plural: 'Meja' },
  admin: { group: 'Pesanan', useAsTitle: 'name', defaultColumns: ['name', 'area', 'capacity', 'active'] },
  defaultSort: 'name',
  access: {
    read: canManageOrders,
    create: canManageOrders,
    update: canManageOrders,
    delete: ({ req }) => hasRole(req.user, 'super-admin'),
  },
  hooks: auditHooks,
  fields: [
    { name: 'name', label: 'Nomor meja', type: 'text', required: true, unique: true, admin: { placeholder: 'R1' } },
    {
      name: 'area',
      type: 'select',
      required: true,
      options: [
        { value: 'restaurant', label: 'Restaurant (Coffee & Bar)' },
        { value: 'bistro', label: 'Bistro' },
      ],
    },
    { name: 'capacity', label: 'Kapasitas (orang)', type: 'number', required: true, min: 1 },
    { name: 'active', label: 'Bisa dipakai', type: 'checkbox', defaultValue: true },
  ],
}
