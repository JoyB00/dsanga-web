import type { CollectionConfig } from 'payload'

import { isSuperAdmin } from '../access/roles'

/** F-12: written by hooks only; visible to the Super Admin. */
export const AuditLogs: CollectionConfig = {
  slug: 'audit-logs',
  admin: {
    group: 'Admin',
    useAsTitle: 'summary',
    defaultColumns: ['createdAt', 'action', 'collectionSlug', 'summary', 'user'],
  },
  defaultSort: '-createdAt',
  access: {
    read: isSuperAdmin,
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: 'action',
      type: 'select',
      required: true,
      options: ['create', 'update', 'publish', 'delete'].map((v) => ({ value: v, label: v })),
    },
    { name: 'collectionSlug', type: 'text', required: true },
    { name: 'documentId', type: 'text', required: true },
    { name: 'summary', type: 'text' },
    { name: 'user', type: 'relationship', relationTo: 'users' },
  ],
}
