import type { CollectionConfig } from 'payload'

import { anyone, canEditMedia } from '../access/roles'
import { auditHooks } from '../hooks/auditLog'

/** PDFs such as the printable menu (spec §4: “Lihat Menu menuju PDF/menu digital”). */
export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: { group: 'Content', useAsTitle: 'title', defaultColumns: ['title', 'filename', 'updatedAt'] },
  access: {
    read: anyone,
    create: canEditMedia,
    update: canEditMedia,
    delete: canEditMedia,
  },
  hooks: auditHooks,
  upload: {
    mimeTypes: ['application/pdf'],
  },
  fields: [{ name: 'title', type: 'text', required: true, localized: true }],
}
