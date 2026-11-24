import { renderInvoicePdf } from '@/lib/invoice/pdf'
import { getInvoiceByToken, invoiceView } from '@/lib/invoice/view'

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const invoice = await getInvoiceByToken((await params).token)
  if (!invoice) return new Response('Not found', { status: 404 })
  const view = invoiceView(invoice)
  const pdf = await renderInvoicePdf(view)
  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${view.fileName}"`,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'Referrer-Policy': 'no-referrer',
    },
  })
}
