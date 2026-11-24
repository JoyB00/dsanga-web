import { randomBytes } from 'crypto'
import { APIError, type CollectionBeforeChangeHook, type CollectionConfig, type Field } from 'payload'

import { canApprove, canManageOrders } from '../access/roles'
import { auditHooks } from '../hooks/auditLog'
import { nextInvoiceNumber } from '../lib/numbering'

const refuse = (message: string) => new APIError(message, 400, undefined, true)

/** Staff can only change these after an invoice is issued; everything else is frozen. */
const EDITABLE = ['status', 'dueDate', 'paidAt', 'paymentMethod', 'paymentReference', 'voidReason']
const FROZEN = [
  'invoiceNumber', 'token', 'issuedAt', 'order', 'activeOrder', 'customerName', 'customerWhatsapp', 'customerEmail',
  'language', 'items', 'subtotal', 'discount', 'total', 'seller',
]

const protect: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  if (operation === 'create') {
    data.invoiceNumber = await nextInvoiceNumber(req)
    data.token = randomBytes(24).toString('hex')
    data.issuedAt = new Date().toISOString()
    data.status = 'unpaid'
    return data
  }

  for (const key of FROZEN) data[key] = originalDoc[key]
  const next = { ...originalDoc, ...data }

  const from = originalDoc.status
  const to = next.status
  const changed = EDITABLE.some((key) => JSON.stringify(next[key] ?? null) !== JSON.stringify(originalDoc[key] ?? null))
  if (from === 'void' && changed) throw refuse('Invoice yang sudah batal tidak bisa diubah. Terbitkan invoice baru dari pesanan.')
  if (from === 'paid' && changed) {
    if (to === 'unpaid') throw refuse('Invoice yang sudah lunas tidak bisa kembali ke belum dibayar. Batalkan lalu terbitkan ulang.')
    if (req.user && !canApprove(req.user)) {
      throw refuse('Invoice yang sudah lunas hanya bisa diubah atau dibatalkan oleh Penanggung Jawab.')
    }
  }
  if (to === 'paid' && from !== 'paid') {
    if (!next.paymentMethod) throw refuse('Pilih cara pembayaran sebelum menandai lunas.')
    data.paidAt = next.paidAt || new Date().toISOString()
  }
  if (to === 'void' && from !== 'void') {
    if (!next.voidReason?.trim()) throw refuse('Isi alasan pembatalan invoice.')
    data.activeOrder = null // a new invoice may be issued for the order
  }
  return data
}

/** Copied from the order when the invoice is issued. */
const frozen = (field: Field): Field =>
  ({
    ...field,
    access: { update: () => false },
    admin: { ...('admin' in field ? field.admin : {}), readOnly: true },
  }) as Field

/**
 * Invoices are issued from an order (POST /api/orders/:id/invoice) and never edited or deleted:
 * a wrong one is voided and a new one issued, so the numbers stay complete.
 */
export const Invoices: CollectionConfig = {
  slug: 'invoices',
  labels: { singular: 'Invoice', plural: 'Invoice' },
  admin: {
    group: 'Pesanan',
    useAsTitle: 'invoiceNumber',
    defaultColumns: ['invoiceNumber', 'customerName', 'total', 'status', 'issuedAt'],
    listSearchableFields: ['invoiceNumber', 'customerName', 'customerWhatsapp'],
    description: 'Invoice dibuat dari halaman Pesanan.',
  },
  defaultSort: '-issuedAt',
  disableDuplicate: true,
  access: { read: canManageOrders, create: () => false, update: canManageOrders, delete: () => false },
  hooks: { beforeChange: [protect], ...auditHooks },
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'unpaid',
      index: true,
      options: [
        { value: 'unpaid', label: 'Belum dibayar' },
        { value: 'paid', label: 'Lunas' },
        { value: 'void', label: 'Batal' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'actions',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '/components/admin/InvoiceActions#InvoiceActions' } },
    },
    {
      name: 'paymentMethod',
      label: 'Cara pembayaran',
      type: 'select',
      options: [
        { value: 'transfer', label: 'Transfer bank' },
        { value: 'qris', label: 'QRIS' },
        { value: 'cash', label: 'Tunai' },
        { value: 'card', label: 'Kartu' },
      ],
      admin: { position: 'sidebar', condition: (data) => data?.status !== 'void' },
    },
    {
      name: 'paidAt',
      label: 'Tanggal lunas',
      type: 'date',
      admin: { position: 'sidebar', condition: (data) => data?.status === 'paid', description: 'Kosong = hari ini.' },
    },
    {
      name: 'paymentReference',
      label: 'Referensi pembayaran',
      type: 'text',
      admin: { position: 'sidebar', condition: (data) => data?.status === 'paid', description: 'Tidak tampil di invoice.' },
    },
    {
      name: 'dueDate',
      label: 'Jatuh tempo (opsional)',
      type: 'date',
      admin: { position: 'sidebar', condition: (data) => data?.status === 'unpaid' },
    },
    {
      name: 'voidReason',
      label: 'Alasan batal',
      type: 'text',
      admin: { position: 'sidebar', condition: (data) => data?.status === 'void' },
    },
    {
      type: 'row',
      fields: [
        frozen({ name: 'invoiceNumber', label: 'Nomor invoice', type: 'text', unique: true, index: true }),
        frozen({ name: 'issuedAt', label: 'Tanggal terbit', type: 'date', index: true }),
        frozen({ name: 'order', label: 'Pesanan', type: 'relationship', relationTo: 'orders', required: true, index: true }),
      ],
    },
    {
      type: 'row',
      fields: [
        frozen({ name: 'customerName', label: 'Nama customer', type: 'text', required: true }),
        frozen({ name: 'customerWhatsapp', label: 'Nomor WhatsApp', type: 'text' }),
        frozen({ name: 'customerEmail', label: 'Email', type: 'text' }),
      ],
    },
    frozen({
      name: 'language',
      label: 'Bahasa',
      type: 'select',
      options: [
        { value: 'id', label: 'Bahasa Indonesia' },
        { value: 'en', label: 'English' },
      ],
    }),
    frozen({
      name: 'items',
      label: 'Produk',
      type: 'array',
      fields: [
        { name: 'description', label: 'Keterangan', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'quantity', label: 'Jumlah', type: 'number' },
            { name: 'unit', label: 'Satuan', type: 'text' },
            { name: 'unitPrice', label: 'Harga satuan (Rp)', type: 'number' },
            { name: 'amount', label: 'Jumlah harga (Rp)', type: 'number' },
          ],
        },
      ],
    }),
    {
      type: 'row',
      fields: [
        frozen({ name: 'subtotal', label: 'Subtotal (Rp)', type: 'number' }),
        frozen({ name: 'discount', label: 'Diskon (Rp)', type: 'number' }),
        frozen({
          name: 'total',
          label: 'Total (Rp)',
          type: 'number',
          admin: { components: { Cell: '/components/admin/RupiahCell#RupiahCell' } },
        }),
      ],
    },
    // Business details as they were on the day of issue.
    { name: 'seller', type: 'json', access: { update: () => false }, admin: { hidden: true } },
    // Private link: /invoice/<token>
    { name: 'token', type: 'text', unique: true, index: true, access: { update: () => false }, admin: { hidden: true } },
    // Order id while the invoice is active; unique, so an order can't get two active invoices.
    { name: 'activeOrder', type: 'text', unique: true, access: { update: () => false }, admin: { hidden: true } },
  ],
}
