import {
  APIError,
  ValidationError,
  type CollectionBeforeChangeHook,
  type CollectionBeforeValidateHook,
  type CollectionConfig,
} from 'payload'

import { canManageOrders } from '../access/roles'
import { createInvoiceEndpoint, priceListEndpoint } from '../endpoints/orders'
import { auditHooks } from '../hooks/auditLog'
import { nextOrderNumber } from '../lib/numbering'
import { billingKey, endOf, totals, withAmounts } from '../lib/orders'
import { normalizePhone } from '../lib/whatsapp'

const fail = (path: string, message: string) =>
  new ValidationError({ collection: 'orders', errors: [{ path, message }] })

const prepare: CollectionBeforeValidateHook = ({ data, originalDoc }) => {
  if (!data) return data
  const merged = { ...originalDoc, ...data }
  if (data.customerWhatsapp) data.customerWhatsapp = normalizePhone(data.customerWhatsapp)

  if (merged.type === 'table') {
    // Food and drinks are ordered at D’Sanga, so a table reservation has no items and no price.
    data.items = []
    data.discount = 0
    if (merged.visitAt) data.endsAt = endOf(merged.visitAt, merged.durationMinutes)
  } else {
    data.table = null
    data.endsAt = null
  }
  data.items = withAmounts(data.items ?? merged.items)
  Object.assign(data, totals(data.items, data.discount ?? merged.discount))
  return data
}

const check: CollectionBeforeChangeHook = async ({ data, originalDoc, operation, req }) => {
  const order = { ...originalDoc, ...data }

  if (order.type === 'booking' && !order.items?.length) {
    throw fail('items', 'Isi minimal satu produk untuk reservasi produk.')
  }
  if (order.total < 0) throw fail('discount', 'Diskon lebih besar dari subtotal.')

  // A table can't be given to two groups at the same time, unless staff say it is fine.
  const tableId = order.table && typeof order.table === 'object' ? order.table.id : order.table
  if (order.type === 'table' && tableId && order.status === 'confirmed' && !order.allowOverlap) {
    const clash = await req.payload.find({
      collection: 'orders',
      depth: 0,
      limit: 1,
      req,
      where: {
        and: [
          { type: { equals: 'table' } },
          { table: { equals: tableId } },
          { status: { equals: 'confirmed' } },
          { visitAt: { less_than: order.endsAt } },
          { endsAt: { greater_than: new Date(order.visitAt).toISOString() } },
          ...(originalDoc?.id ? [{ id: { not_equals: originalDoc.id } }] : []),
        ],
      },
    })
    if (clash.docs[0]) {
      throw fail(
        'table',
        `Meja ini sudah dipakai pesanan ${clash.docs[0].orderNumber} (${clash.docs[0].customerName}) pada jam tersebut. Pilih meja lain, atau centang “Izinkan meja ganda”.`,
      )
    }
  }

  if (operation === 'create') {
    data.orderNumber = await nextOrderNumber(req)
    return data
  }

  // The number never changes, and an active invoice freezes the billing data.
  data.orderNumber = originalDoc.orderNumber
  const cancelling = order.status === 'cancelled' && originalDoc.status !== 'cancelled'
  if (cancelling || billingKey(order) !== billingKey(originalDoc)) {
    const { docs } = await req.payload.find({
      collection: 'invoices',
      depth: 0,
      limit: 1,
      req,
      where: { and: [{ order: { equals: originalDoc.id } }, { status: { not_equals: 'void' } }] },
    })
    if (docs[0]) {
      throw new APIError(
        `Pesanan ini sudah punya invoice ${docs[0].invoiceNumber}. Batalkan invoice itu dulu, baru ${cancelling ? 'batalkan pesanan' : 'ubah customer, produk, atau harga'}.`,
        400,
        undefined,
        true,
      )
    }
  }
  return data
}

const isBooking = (data: { type?: string }) => data?.type !== 'table'
const isTable = (data: { type?: string }) => data?.type === 'table'
const rupiahCell = { Cell: '/components/admin/RupiahCell#RupiahCell' }

/**
 * Orders agreed on WhatsApp, entered by staff. `booking` = products with a fixed price (invoice);
 * `table` = a table at the restaurant or bistro (no invoice, food is ordered on the spot).
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Pesanan', plural: 'Pesanan' },
  admin: {
    group: 'Pesanan',
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'customerName', 'type', 'visitAt', 'total', 'status'],
    listSearchableFields: ['orderNumber', 'customerName', 'customerWhatsapp'],
    description: 'Diisi setelah pesanan disepakati dengan customer di WhatsApp.',
  },
  defaultSort: '-createdAt',
  disableDuplicate: true,
  access: {
    read: canManageOrders,
    create: canManageOrders,
    update: canManageOrders,
    delete: () => false, // Cancel instead: numbers stay complete.
  },
  endpoints: [priceListEndpoint, createInvoiceEndpoint],
  hooks: { beforeValidate: [prepare], beforeChange: [check], ...auditHooks },
  fields: [
    {
      name: 'orderNumber',
      label: 'Nomor pesanan',
      type: 'text',
      unique: true,
      index: true,
      admin: { position: 'sidebar', readOnly: true, description: 'Dibuat otomatis saat disimpan.' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'confirmed',
      options: [
        { value: 'confirmed', label: 'Deal' },
        { value: 'completed', label: 'Selesai' },
        { value: 'cancelled', label: 'Batal' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'actions',
      type: 'ui',
      admin: { position: 'sidebar', components: { Field: '/components/admin/OrderActions#OrderActions' } },
    },
    {
      name: 'type',
      label: 'Jenis pesanan',
      type: 'radio',
      required: true,
      defaultValue: 'booking',
      options: [
        { value: 'booking', label: 'Reservasi produk (pool, space, event, paket)' },
        { value: 'table', label: 'Reservasi meja (restaurant, bistro)' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'customerName', label: 'Nama customer', type: 'text', required: true, maxLength: 120 },
        {
          name: 'customerWhatsapp',
          label: 'Nomor WhatsApp',
          type: 'text',
          required: true,
          admin: { placeholder: '0812… atau +61…', description: 'Nomor luar negeri: tulis dengan kode negara.' },
          validate: (value: unknown) => {
            const digits = normalizePhone(typeof value === 'string' ? value : '')
            return (digits.length >= 8 && digits.length <= 15) || 'Nomor WhatsApp tidak valid.'
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'customerEmail', label: 'Email (opsional)', type: 'email' },
        {
          name: 'language',
          label: 'Bahasa customer',
          type: 'select',
          required: true,
          defaultValue: 'id',
          options: [
            { value: 'id', label: 'Bahasa Indonesia' },
            { value: 'en', label: 'English' },
          ],
          admin: { description: 'Dipakai di invoice dan pesan WhatsApp.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'visitAt',
          label: 'Tanggal & jam kunjungan',
          type: 'date',
          required: true,
          index: true,
          admin: { date: { pickerAppearance: 'dayAndTime', displayFormat: 'd MMM yyyy HH:mm', timeFormat: 'HH:mm' } },
        },
        { name: 'people', label: 'Jumlah orang', type: 'number', required: true, min: 1, defaultValue: 1 },
      ],
    },
    {
      type: 'row',
      admin: { condition: isTable },
      fields: [
        {
          name: 'table',
          label: 'Nomor meja',
          type: 'relationship',
          relationTo: 'dining-tables',
          index: true,
          filterOptions: { active: { equals: true } },
          admin: { description: 'Ditentukan admin. Boleh dikosongkan dulu.' },
        },
        {
          name: 'durationMinutes',
          label: 'Lama (menit)',
          type: 'number',
          min: 15,
          max: 1440,
          defaultValue: 120,
        },
      ],
    },
    {
      name: 'allowOverlap',
      label: 'Izinkan meja ganda',
      type: 'checkbox',
      defaultValue: false,
      admin: { condition: isTable, description: 'Centang bila meja memang boleh dipakai bersama pesanan lain di jam yang sama.' },
    },
    { name: 'endsAt', type: 'date', index: true, admin: { hidden: true } },
    {
      name: 'items',
      label: 'Produk',
      labels: { singular: 'Produk', plural: 'Produk' },
      type: 'array',
      admin: { condition: isBooking, initCollapsed: false },
      fields: [
        {
          name: 'pick',
          type: 'ui',
          admin: { components: { Field: '/components/admin/ProductPicker#ProductPicker' } },
        },
        { name: 'description', label: 'Keterangan', type: 'text', required: true, maxLength: 200 },
        {
          type: 'row',
          fields: [
            { name: 'quantity', label: 'Jumlah', type: 'number', required: true, min: 1, defaultValue: 1 },
            { name: 'unit', label: 'Satuan', type: 'text', maxLength: 30, admin: { placeholder: 'orang' } },
            {
              name: 'unitPrice',
              label: 'Harga satuan (Rp)',
              type: 'number',
              required: true,
              min: 0,
              admin: { description: 'Harga yang disepakati.' },
              validate: (value: unknown) =>
                (typeof value === 'number' && Number.isInteger(value) && value >= 0) ||
                'Isi harga dalam rupiah, tanpa titik atau koma.',
            },
            { name: 'amount', label: 'Jumlah harga (Rp)', type: 'number', admin: { readOnly: true, description: 'Dihitung saat disimpan.' } },
          ],
        },
        { name: 'category', type: 'text', admin: { hidden: true } },
      ],
    },
    {
      type: 'row',
      admin: { condition: isBooking },
      fields: [
        {
          name: 'discount',
          label: 'Diskon (Rp)',
          type: 'number',
          defaultValue: 0,
          validate: (value: unknown) =>
            value == null || (typeof value === 'number' && Number.isInteger(value) && value >= 0) || 'Isi diskon dalam rupiah.',
        },
        { name: 'subtotal', label: 'Subtotal (Rp)', type: 'number', admin: { readOnly: true } },
        {
          name: 'total',
          label: 'Total (Rp)',
          type: 'number',
          admin: { readOnly: true, description: 'Dihitung saat disimpan.', components: rupiahCell },
        },
      ],
    },
    { name: 'internalNotes', label: 'Catatan internal', type: 'textarea', admin: { description: 'Tidak tampil di invoice.' } },
    {
      name: 'invoices',
      label: 'Invoice',
      type: 'join',
      collection: 'invoices',
      on: 'order',
      admin: { condition: isBooking, allowCreate: false, defaultColumns: ['invoiceNumber', 'total', 'status', 'issuedAt'] },
    },
  ],
}
