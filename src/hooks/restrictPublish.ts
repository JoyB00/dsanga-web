import { APIError, type CollectionBeforeChangeHook } from 'payload'

import { canApprove } from '../access/roles'

/**
 * F-11: changes to prices, opening hours, safety rules and offers can be saved as drafts by
 * admins, but only an approver (Penanggung Jawab) or super admin can publish them.
 * Server-side calls without a user (seed scripts, jobs) are allowed.
 */
export const restrictPublish: CollectionBeforeChangeHook = ({ data, req }) => {
  if (!req.user) return data
  if (data?._status === 'published' && !canApprove(req.user)) {
    throw new APIError(
      'Saved as draft is allowed, but publishing this change needs approval from the Penanggung Jawab (approver).',
      403,
      undefined,
      true,
    )
  }
  return data
}
