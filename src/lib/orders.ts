/** Order rules without Payload, so they are easy to test. Amounts are whole rupiah. */
export type OrderItem = {
  category?: string | null
  description?: string | null
  quantity?: number | null
  unit?: string | null
  unitPrice?: number | null
  amount?: number | null
  id?: string | null
}

export const DEFAULT_TABLE_MINUTES = 120

export const withAmounts = <T extends OrderItem>(items: T[] | null | undefined): T[] =>
  (items ?? []).map((item) => ({
    ...item,
    amount: Math.round((item.quantity ?? 0) * (item.unitPrice ?? 0)),
  }))

export function totals(items: OrderItem[], discount?: number | null) {
  const subtotal = items.reduce((sum, item) => sum + (item.amount ?? 0), 0)
  return { subtotal, total: subtotal - (discount ?? 0) }
}

export const endOf = (start: string | Date, minutes?: number | null) =>
  new Date(new Date(start).getTime() + (minutes || DEFAULT_TABLE_MINUTES) * 60_000).toISOString()

/** What an issued invoice freezes on its order: who pays, and how much for what. */
export const billingKey = (order: {
  customerName?: string | null
  customerWhatsapp?: string | null
  customerEmail?: string | null
  items?: OrderItem[] | null
  discount?: number | null
  type?: string | null
}) =>
  JSON.stringify([
    order.type ?? null,
    order.customerName ?? null,
    order.customerWhatsapp ?? null,
    order.customerEmail ?? null,
    order.discount ?? 0,
    (order.items ?? []).map((i) => [
      i.description ?? null,
      i.quantity ?? null,
      i.unit ?? null,
      i.unitPrice ?? null,
    ]),
  ])
