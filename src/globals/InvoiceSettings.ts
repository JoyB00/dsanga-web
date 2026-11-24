import type { GlobalConfig } from 'payload'

import { approverFieldAccess, hasRole, isOrderStaff } from '../access/roles'

/** Business details printed on invoices. Staff only, unlike Site settings. */
export const InvoiceSettings: GlobalConfig = {
  slug: 'invoice-settings',
  label: 'Pengaturan invoice',
  admin: { group: 'Pesanan', description: 'Perubahan hanya berlaku untuk invoice baru.' },
  access: {
    read: ({ req }) => isOrderStaff(req.user),
    update: ({ req }) => hasRole(req.user, 'super-admin', 'approver'),
  },
  fields: [
    { name: 'businessName', label: 'Nama usaha', type: 'text', required: true, defaultValue: 'D’Sanga Pool, Bistro & Space' },
    { name: 'address', label: 'Alamat', type: 'textarea', admin: { description: 'Kosong = alamat di Site settings.' } },
    { name: 'phone', label: 'Telepon / WhatsApp', type: 'text', admin: { description: 'Kosong = nomor WhatsApp di Site settings.' } },
    { name: 'email', type: 'email', admin: { description: 'Kosong = email di Site settings.' } },
    { name: 'taxId', label: 'NPWP', type: 'text', admin: { description: 'Kosong = tidak tampil.' } },
    {
      name: 'bankAccounts',
      label: 'Rekening pembayaran',
      type: 'array',
      admin: { description: 'Kosong = bagian pembayaran meminta customer menghubungi D’Sanga.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'bank', type: 'text', required: true },
            { name: 'number', label: 'Nomor rekening', type: 'text', required: true },
            { name: 'holder', label: 'Atas nama', type: 'text', required: true },
          ],
        },
      ],
    },
    { name: 'terms', label: 'Catatan di bawah invoice', type: 'textarea', localized: true },
    {
      name: 'verified',
      type: 'checkbox',
      defaultValue: false,
      access: { update: approverFieldAccess },
      admin: { position: 'sidebar', description: 'F-15: data invoice sudah final dan disetujui.' },
    },
  ],
}
