import { getPayload } from 'payload'

import config from '@payload-config'
import type { Locale } from '../../i18n/config'
import type { Invoice, Order } from '../../payload-types'
import { formatDate, formatRupiah, formatTime } from '../format'

type Seller = {
  name?: string
  address?: string
  phone?: string
  email?: string
  taxId?: string
  bankAccounts?: { bank: string; number: string; holder: string }[]
  terms?: string
}

const LABELS = {
  en: {
    title: 'Invoice',
    billTo: 'Billed to',
    details: 'Details',
    issued: 'Invoice date',
    due: 'Due date',
    order: 'Order number',
    visit: 'Visit',
    people: 'People',
    item: 'Description',
    quantity: 'Qty',
    unitPrice: 'Unit price',
    amount: 'Amount',
    subtotal: 'Subtotal',
    discount: 'Discount',
    total: 'Total',
    payment: 'Payment',
    paymentAsk: 'Please contact D’Sanga on WhatsApp for payment details.',
    holder: 'Account name',
    paidOn: 'Paid on',
    taxId: 'Tax ID (NPWP)',
    download: 'Download PDF',
    thanks: 'Thank you for choosing D’Sanga.',
    status: { unpaid: 'Unpaid', paid: 'Paid', void: 'Cancelled' },
    method: { transfer: 'Bank transfer', qris: 'QRIS', cash: 'Cash', card: 'Card' },
    voidNote: 'This invoice has been cancelled and is no longer valid.',
  },
  id: {
    title: 'Invoice',
    billTo: 'Ditagihkan kepada',
    details: 'Rincian',
    issued: 'Tanggal invoice',
    due: 'Jatuh tempo',
    order: 'Nomor pesanan',
    visit: 'Kunjungan',
    people: 'Jumlah orang',
    item: 'Keterangan',
    quantity: 'Jumlah',
    unitPrice: 'Harga satuan',
    amount: 'Jumlah harga',
    subtotal: 'Subtotal',
    discount: 'Diskon',
    total: 'Total',
    payment: 'Pembayaran',
    paymentAsk: 'Hubungi D’Sanga lewat WhatsApp untuk cara pembayaran.',
    holder: 'Atas nama',
    paidOn: 'Lunas pada',
    taxId: 'NPWP',
    download: 'Unduh PDF',
    thanks: 'Terima kasih telah memilih D’Sanga.',
    status: { unpaid: 'Belum dibayar', paid: 'Lunas', void: 'Batal' },
    method: { transfer: 'Transfer bank', qris: 'QRIS', cash: 'Tunai', card: 'Kartu' },
    voidNote: 'Invoice ini sudah dibatalkan dan tidak berlaku lagi.',
  },
} as const

/** Everything the web page and the PDF print, already formatted in the customer's language. */
export function invoiceView(invoice: Invoice) {
  const locale: Locale = invoice.language === 'en' ? 'en' : 'id'
  const t = LABELS[locale]
  const seller = (invoice.seller ?? {}) as Seller
  const order = invoice.order && typeof invoice.order === 'object' ? (invoice.order as Order) : null
  const date = (iso?: string | null) => formatDate(iso, locale, { month: 'long' })

  return {
    locale,
    t,
    number: invoice.invoiceNumber ?? '',
    fileName: `${(invoice.invoiceNumber ?? 'invoice').replace(/\//g, '-')}.pdf`,
    status: invoice.status,
    statusLabel: t.status[invoice.status],
    statusNote:
      invoice.status === 'paid' && invoice.paidAt
        ? `${t.paidOn} ${date(invoice.paidAt)}${invoice.paymentMethod ? ` · ${t.method[invoice.paymentMethod]}` : ''}`
        : invoice.status === 'void'
          ? t.voidNote
          : '',
    seller: {
      name: seller.name ?? '',
      lines: [
        ...(seller.address ?? '').split('\n'),
        seller.phone ?? '',
        seller.email ?? '',
        seller.taxId ? `${t.taxId}: ${seller.taxId}` : '',
      ].filter(Boolean),
      terms: seller.terms ?? '',
      bankAccounts: seller.bankAccounts ?? [],
    },
    customer: {
      name: invoice.customerName,
      lines: [invoice.customerWhatsapp ? `+${invoice.customerWhatsapp}` : '', invoice.customerEmail ?? ''].filter(Boolean),
    },
    details: [
      [t.issued, date(invoice.issuedAt)],
      ...(invoice.dueDate && invoice.status === 'unpaid' ? [[t.due, date(invoice.dueDate)]] : []),
      // The visit may be rescheduled after the invoice, so it is read from the order.
      ...(order
        ? [
            [t.order, order.orderNumber ?? ''],
            [t.visit, `${date(order.visitAt)}, ${formatTime(order.visitAt, locale)} WITA`],
            [t.people, String(order.people)],
          ]
        : []),
    ] as [string, string][],
    items: (invoice.items ?? []).map((item) => ({
      id: item.id ?? item.description ?? '',
      description: item.description ?? '',
      quantity: [item.quantity, item.unit].filter(Boolean).join(' '),
      unitPrice: formatRupiah(item.unitPrice),
      amount: formatRupiah(item.amount),
    })),
    sums: invoice.discount
      ? ([
          [t.subtotal, formatRupiah(invoice.subtotal)],
          [t.discount, `−${formatRupiah(invoice.discount)}`],
        ] as [string, string][])
      : [],
    total: formatRupiah(invoice.total),
  }
}

export type InvoiceView = ReturnType<typeof invoiceView>

/** The link's random token is the only key: no match, no invoice. */
export async function getInvoiceByToken(token: string): Promise<Invoice | null> {
  if (!/^[a-f0-9]{48}$/.test(token)) return null
  const payload = await getPayload({ config })
  const { docs } = await payload.find({ collection: 'invoices', where: { token: { equals: token } }, depth: 1, limit: 1 })
  return docs[0] ?? null
}
