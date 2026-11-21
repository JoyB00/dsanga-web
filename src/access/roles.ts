import type { Access, FieldAccess, PayloadRequest } from 'payload'

/** Roles from spec §7 (CMS, Hak Akses, dan SOP Konten). */
export const ROLES = ['super-admin', 'approver', 'content-admin', 'product-admin', 'viewer'] as const
export type Role = (typeof ROLES)[number]

export const ROLE_LABELS: Record<Role, string> = {
  'super-admin': 'Super Admin Desa',
  approver: 'Penanggung Jawab (Approver)',
  'content-admin': 'Admin Konten',
  'product-admin': 'Admin Produk',
  viewer: 'Viewer / Pimpinan',
}

type MaybeUser = PayloadRequest['user'] | null | undefined

export const getRole = (user: MaybeUser): Role | undefined =>
  (user as { role?: Role } | null | undefined)?.role ?? undefined

export const hasRole = (user: MaybeUser, ...roles: Role[]): boolean => {
  const role = getRole(user)
  return Boolean(role && roles.includes(role))
}

/** Can publish price, hours, safety-rule and offer changes, and mark data as verified (F-11, F-15). */
export const canApprove = (user: MaybeUser) => hasRole(user, 'super-admin', 'approver')

export const isSuperAdmin: Access = ({ req }) => hasRole(req.user, 'super-admin')
export const isLoggedIn: Access = ({ req }) => Boolean(req.user)
export const anyone: Access = () => true

/** Pages content, events, offers, FAQ, gallery. */
export const canEditContent: Access = ({ req }) =>
  hasRole(req.user, 'super-admin', 'approver', 'content-admin')

/** Experiences (facilities), menu, prices, service status. */
export const canEditProducts: Access = ({ req }) =>
  hasRole(req.user, 'super-admin', 'approver', 'product-admin')

/** Media is shared by both admin types. */
export const canEditMedia: Access = ({ req }) =>
  hasRole(req.user, 'super-admin', 'approver', 'content-admin', 'product-admin')

export const approverFieldAccess: FieldAccess = ({ req }) => canApprove(req.user)
export const superAdminFieldAccess: FieldAccess = ({ req }) => hasRole(req.user, 'super-admin')
