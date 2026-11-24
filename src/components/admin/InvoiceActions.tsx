'use client'

import { Button, useConfig, useDocumentInfo } from '@payloadcms/ui'

import { formatRupiah } from '@/lib/format'

/** Invoice sidebar: open, download, and send the private link on WhatsApp. */
export function InvoiceActions() {
  const { savedDocumentData: invoice } = useDocumentInfo()
  const { config } = useConfig()
  if (!invoice?.token) return null

  const link = `${config.serverURL}/invoice/${invoice.token}`
  const total = formatRupiah(invoice.total)
  const message =
    invoice.language === 'en'
      ? invoice.status === 'paid'
        ? `Hello ${invoice.customerName}, thank you, we have received your payment of ${total} for invoice ${invoice.invoiceNumber}. You can view it here: ${link}`
        : `Hello ${invoice.customerName}, here is your D’Sanga invoice ${invoice.invoiceNumber} for ${total}: ${link}`
      : invoice.status === 'paid'
        ? `Halo ${invoice.customerName}, terima kasih, pembayaran ${total} untuk invoice ${invoice.invoiceNumber} sudah kami terima. Invoice bisa dilihat di sini: ${link}`
        : `Halo ${invoice.customerName}, berikut invoice D’Sanga ${invoice.invoiceNumber} sebesar ${total}: ${link}`

  return (
    <div className="field-type" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {invoice.status !== 'void' && invoice.customerWhatsapp && (
        <Button
          el="anchor"
          url={`https://wa.me/${invoice.customerWhatsapp}?text=${encodeURIComponent(message)}`}
          newTab
          buttonStyle="primary"
          margin={false}
        >
          Kirim via WhatsApp
        </Button>
      )}
      <Button el="anchor" url={link} newTab buttonStyle="secondary" margin={false}>
        Lihat invoice
      </Button>
      <Button el="anchor" url={`${link}/pdf`} newTab buttonStyle="secondary" margin={false}>
        Unduh PDF
      </Button>
    </div>
  )
}
