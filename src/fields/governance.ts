import type { Field } from 'payload'

import { approverFieldAccess } from '../access/roles'

/**
 * Fields every managed record carries (spec §7 SOP + F-15):
 * - verified: data sementara stays unverified until the Penanggung Jawab checks it.
 * - pic: who is responsible for keeping this record correct.
 * (Last-updated date is Payload's built-in updatedAt.)
 */
export const governanceFields: Field[] = [
  {
    name: 'verified',
    type: 'checkbox',
    label: 'Verified (final data)',
    defaultValue: false,
    access: { update: approverFieldAccess },
    admin: {
      position: 'sidebar',
      description:
        'Unchecked = temporary data (spec §14). Must be checked by an approver before go-live (F-15).',
    },
  },
  {
    name: 'pic',
    type: 'text',
    label: 'PIC',
    admin: {
      position: 'sidebar',
      description: 'Person in charge of keeping this information correct.',
    },
  },
]
