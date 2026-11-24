'use client'

import { Button, toast, useDocumentInfo, useFormModified } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type ActiveInvoice = { id: number | string; invoiceNumber: string }

/** Order sidebar: issue the invoice, or open the one that exists; chat with the customer. */
export function OrderActions() {
  const { id, savedDocumentData: order } = useDocumentInfo()
  const modified = useFormModified()
  const router = useRouter()
  const [invoice, setInvoice] = useState<ActiveInvoice | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    let active = true
    const query = `where[order][equals]=${id}&where[status][not_equals]=void&limit=1&depth=0`
    fetch(`/api/invoices?${query}`, { credentials: 'include' })
      .then((res) => res.json())
      .then((data) => active && setInvoice(data?.docs?.[0] ?? null))
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [id, order?.updatedAt])

  if (!id || !order) return null

  const issue = async () => {
    setBusy(true)
    try {
      const res = await fetch(`/api/orders/${id}/invoice`, { method: 'POST', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.errors?.[0]?.message ?? 'Invoice gagal dibuat.')
      toast.success(`Invoice ${data.invoiceNumber} dibuat.`)
      router.push(`/admin/collections/invoices/${data.id}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invoice gagal dibuat.')
    } finally {
      setBusy(false)
    }
  }

  const bookable = order.type === 'booking' && order.status !== 'cancelled'
  return (
    <div className="field-type" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {invoice ? (
        <Button el="link" to={`/admin/collections/invoices/${invoice.id}`} buttonStyle="primary" margin={false}>
          Buka invoice {invoice.invoiceNumber}
        </Button>
      ) : (
        bookable && (
          <>
            <Button onClick={issue} disabled={busy || modified} buttonStyle="primary" margin={false}>
              Buat invoice
            </Button>
            {modified && <small>Simpan perubahan dulu sebelum membuat invoice.</small>}
          </>
        )
      )}
      {order.customerWhatsapp && (
        <Button el="anchor" url={`https://wa.me/${order.customerWhatsapp}`} newTab buttonStyle="secondary" margin={false}>
          Chat customer
        </Button>
      )}
    </div>
  )
}
