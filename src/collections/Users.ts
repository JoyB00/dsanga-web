import type { CollectionConfig } from 'payload'

import { ROLES, ROLE_LABELS, hasRole, isSuperAdmin, superAdminFieldAccess } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Admin',
  },
  auth: true,
  access: {
    // Accounts are personal and managed only by the Super Admin Desa (spec §7).
    create: isSuperAdmin,
    delete: isSuperAdmin,
    read: ({ req }) => {
      if (!req.user) return false
      return hasRole(req.user, 'super-admin') ? true : { id: { equals: req.user.id } }
    },
    update: ({ req }) => {
      if (!req.user) return false
      return hasRole(req.user, 'super-admin') ? true : { id: { equals: req.user.id } }
    },
  },
  hooks: {
    beforeChange: [
      // The very first account becomes Super Admin so the project can be bootstrapped.
      async ({ data, operation, req }) => {
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({ collection: 'users', req })
          if (totalDocs === 0) data.role = 'super-admin'
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'viewer',
      saveToJWT: true,
      options: ROLES.map((value) => ({ value, label: ROLE_LABELS[value] })),
      access: { update: superAdminFieldAccess, create: superAdminFieldAccess },
    },
  ],
}
