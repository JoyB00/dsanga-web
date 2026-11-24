// @vitest-environment node
import { createLocalReq, getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'
import { createInvoiceEndpoint, priceListEndpoint, type PriceListItem } from '@/endpoints/orders'
import { renderInvoicePdf } from '@/lib/invoice/pdf'
import { getInvoiceByToken, invoiceView } from '@/lib/invoice/view'
import { normalizePhone, whatsappUrl } from '@/lib/whatsapp'
import type { Order, User } from '@/payload-types'

/**
 * Order flow (docs/spec-order-flow.md): orders agreed on WhatsApp, tables, invoices and hidden prices.
 * Runs against the dev database; everything it creates starts with "QA " and is removed, and the running
 * numbers are put back.
 */
let payload: Payload
const users = {} as Record<'content-admin' | 'order-admin' | 'approver' | 'viewer', User>
let counters: { key: string; value: number }[] = []
let tableId: number

const as = (user: User) => ({ user, overrideAccess: false as const })
const visit = (hours: number) => new Date(Date.UTC(2031, 0, 5, hours)).toISOString()

const booking = (data: Partial<Order> = {}) => ({
  type: 'booking' as const,
  status: 'confirmed' as const,
  customerName: 'QA Customer',
  customerWhatsapp: '0812 3456 7890',
  language: 'id' as const,
  visitAt: visit(2),
  people: 4,
  items: [
    { description: 'QA Pool – Dewasa', quantity: 2, unit: 'orang', unitPrice: 50000 },
    { description: 'QA Pool – Anak', quantity: 2, unit: 'orang', unitPrice: 30000 },
  ],
  ...data,
})
const tableOrder = (hours: number, data: Partial<Order> = {}) => ({
  type: 'table' as const,
  status: 'confirmed' as const,
  customerName: 'QA Table',
  customerWhatsapp: '+61 400 000 000',
  language: 'en' as const,
  visitAt: visit(hours),
  people: 2,
  table: tableId,
  durationMinutes: 120,
  ...data,
})

const call = async (endpoint: typeof createInvoiceEndpoint, user: User | null, id?: number) => {
  const req = await createLocalReq({ user: user ? { ...user, collection: 'users' } : undefined }, payload)
  Object.assign(req, { routeParams: { id }, searchParams: new URLSearchParams('locale=id') })
  return endpoint.handler(req)
}
const issue = async (id: number, user = users['order-admin']) => (await (await call(createInvoiceEndpoint, user, id)).json()) as { id: number; invoiceNumber: string }
const createOrder = (data: Partial<Order> = {}) => payload.create({ collection: 'orders', data: booking(data), ...as(users['order-admin']) })

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  counters = (await payload.find({ collection: 'counters', limit: 1000, depth: 0 })).docs.map(({ key, value }) => ({ key, value }))
  for (const role of ['content-admin', 'order-admin', 'approver', 'viewer'] as const) {
    const email = `orders-${role}@qa.test`
    await payload.delete({ collection: 'users', where: { email: { equals: email } } })
    users[role] = await payload.create({ collection: 'users', data: { email, password: 'qa-test-password', name: email, role } })
  }
  tableId = (await payload.create({ collection: 'dining-tables', data: { name: 'QA T1', area: 'bistro', capacity: 4, active: true } })).id
})

afterAll(async () => {
  const ids = Object.values(users).map((u) => u.id)
  await payload.delete({ collection: 'invoices', where: { customerName: { like: 'QA ' } } })
  await payload.delete({ collection: 'orders', where: { customerName: { like: 'QA ' } } })
  await payload.delete({ collection: 'dining-tables', where: { name: { like: 'QA ' } } })
  await payload.delete({ collection: 'menu-items', where: { name: { like: 'QA ' } } })
  await payload.delete({ collection: 'audit-logs', where: { or: [{ user: { in: ids } }, { summary: { like: '@qa.test' } }] } })
  await payload.delete({ collection: 'users', where: { and: [{ email: { like: 'orders-' } }, { email: { like: '@qa.test' } }] } })
  // Give the test numbers back.
  const now = await payload.find({ collection: 'counters', limit: 1000, depth: 0 })
  for (const doc of now.docs) {
    const before = counters.find((c) => c.key === doc.key)
    if (before) await payload.update({ collection: 'counters', id: doc.id, data: { value: before.value } })
    else await payload.delete({ collection: 'counters', id: doc.id })
  }
})

describe('orders', () => {
  it('numbers the order, normalizes the phone and calculates the total', async () => {
    const order = await createOrder({ discount: 10000 })
    expect(order.orderNumber).toMatch(/^DS-\d{4}-\d{4}$/)
    expect(order.customerWhatsapp).toBe('6281234567890')
    expect([order.subtotal, order.total]).toEqual([160000, 150000])
    expect(order.items?.[0].amount).toBe(100000)
  })

  it('never gives two orders the same number, also at the same moment', async () => {
    const orders = await Promise.all(Array.from({ length: 5 }, () => createOrder()))
    expect(new Set(orders.map((o) => o.orderNumber)).size).toBe(5)
  })

  it('refuses a booking without products, a discount above the subtotal and a wrong phone number', async () => {
    await expect(createOrder({ items: [] })).rejects.toThrow(/Produk|items/i)
    await expect(createOrder({ discount: 999999 })).rejects.toThrow()
    await expect(createOrder({ customerWhatsapp: '12' })).rejects.toThrow()
  })

  it('staff cannot set the number or the total themselves', async () => {
    const order = await createOrder({ orderNumber: 'DS-HACK', total: 1 })
    expect(order.orderNumber).not.toBe('DS-HACK')
    expect(order.total).toBe(160000)
  })

  it('a table reservation has no items and no price', async () => {
    const order = await payload.create({ collection: 'orders', data: tableOrder(1, { items: booking().items }), ...as(users['order-admin']) })
    expect(order.items).toEqual([])
    expect(order.total).toBe(0)
    expect(order.endsAt).toBe(visit(3))
    await expect(issue(order.id)).rejects.toThrow(/Reservasi meja/)
  })

  it('warns when a table is taken at that time; the next slot and a cancelled order are fine', async () => {
    const create = (hours: number, data: Partial<Order> = {}) =>
      payload.create({ collection: 'orders', data: tableOrder(hours, data), ...as(users['order-admin']) })
    await expect(create(2)).rejects.toThrow()
    await expect(create(0)).rejects.toThrow()
    await create(3) // starts when the first one ends
    expect((await create(2, { allowOverlap: true })).id).toBeTruthy()
    const { docs } = await payload.find({ collection: 'orders', where: { customerName: { equals: 'QA Table' } } })
    for (const doc of docs) await payload.update({ collection: 'orders', id: doc.id, data: { status: 'cancelled' } })
    expect((await create(1)).id).toBeTruthy()
  })
})

describe('access', () => {
  it('visitors, content admins and viewers see no orders, invoices, tables or invoice settings', async () => {
    for (const user of [undefined, users['content-admin'], users.viewer]) {
      for (const collection of ['orders', 'invoices', 'dining-tables', 'counters'] as const) {
        await expect(payload.find({ collection, user, overrideAccess: false })).rejects.toThrow(/not allowed/i)
      }
      await expect(payload.findGlobal({ slug: 'invoice-settings', user, overrideAccess: false })).rejects.toThrow(/not allowed/i)
      await expect(payload.create({ collection: 'orders', data: booking(), user, overrideAccess: false })).rejects.toThrow(/not allowed/i)
    }
    await expect(call(priceListEndpoint, null)).rejects.toThrow(/Forbidden/)
    await expect(call(priceListEndpoint, users['content-admin'])).rejects.toThrow(/Forbidden/)
  })

  it('order admins cannot delete orders, create invoices directly, change prices or publish content', async () => {
    const order = await createOrder()
    const user = as(users['order-admin'])
    await expect(payload.delete({ collection: 'orders', id: order.id, ...user })).rejects.toThrow(/not allowed/i)
    await expect(
      payload.create({ collection: 'invoices', data: { order: order.id, customerName: 'QA x', status: 'paid' }, ...user }),
    ).rejects.toThrow(/not allowed/i)
    await expect(payload.updateGlobal({ slug: 'invoice-settings', data: { businessName: 'x' }, ...user })).rejects.toThrow(/not allowed/i)
    const { docs } = await payload.find({ collection: 'experiences', limit: 1 })
    await expect(payload.update({ collection: 'experiences', id: docs[0].id, data: { order: 9 }, ...user })).rejects.toThrow(/not allowed/i)
  })
})

describe('invoices', () => {
  it('freezes the order into one numbered invoice', async () => {
    const order = await createOrder({ discount: 10000 })
    const created = await issue(order.id)
    expect(created.invoiceNumber).toMatch(/^INV\/\d{4}\/\d{2}\/\d{4}$/)
    await expect(issue(order.id)).rejects.toThrow(/sudah punya invoice/)
    const invoice = await payload.findByID({ collection: 'invoices', id: created.id, depth: 0 })
    expect(invoice).toMatchObject({ status: 'unpaid', total: 150000, discount: 10000, customerName: 'QA Customer', order: order.id })
    expect(invoice.token).toMatch(/^[a-f0-9]{48}$/)

    // Billing data of the order is locked; the visit can still be rescheduled.
    const edit = (data: Partial<Order>) => payload.update({ collection: 'orders', id: order.id, data, ...as(users['order-admin']) })
    await expect(edit({ discount: 0 })).rejects.toThrow(/sudah punya invoice/)
    await expect(edit({ customerName: 'QA Other' })).rejects.toThrow(/sudah punya invoice/)
    await expect(edit({ status: 'cancelled' })).rejects.toThrow(/sudah punya invoice/)
    expect((await edit({ visitAt: visit(5) })).visitAt).toBe(visit(5))

    // Staff can't change amounts on the invoice.
    const tampered = await payload.update({ collection: 'invoices', id: invoice.id, data: { total: 1, customerName: 'QA Hack', dueDate: visit(5) }, ...as(users['order-admin']) })
    expect(tampered).toMatchObject({ total: 150000, customerName: 'QA Customer', dueDate: visit(5) })
  })

  it('two people issuing at the same moment get one invoice', async () => {
    const order = await createOrder()
    const results = await Promise.allSettled([issue(order.id), issue(order.id), issue(order.id)])
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1)
    const { totalDocs } = await payload.find({ collection: 'invoices', where: { order: { equals: order.id } } })
    expect(totalDocs).toBe(1)
  })

  it('unpaid → paid → void follows the rules, then a new invoice may be issued', async () => {
    const order = await createOrder()
    const { id } = await issue(order.id)
    const edit = (data: object, user = users['order-admin']) => payload.update({ collection: 'invoices', id, data, depth: 0, ...as(user) })

    await expect(edit({ status: 'paid' })).rejects.toThrow(/cara pembayaran/i)
    await expect(edit({ status: 'void' })).rejects.toThrow(/alasan/i)
    const paid = await edit({ status: 'paid', paymentMethod: 'transfer' })
    expect(paid.paidAt).toBeTruthy()
    await expect(edit({ status: 'unpaid' })).rejects.toThrow(/tidak bisa kembali/)
    await expect(edit({ status: 'void', voidReason: 'salah' })).rejects.toThrow(/Penanggung Jawab/)
    const voided = await edit({ status: 'void', voidReason: 'Salah harga' }, users.approver)
    expect(voided.status).toBe('void')
    await expect(edit({ status: 'unpaid' }, users.approver)).rejects.toThrow(/sudah batal/)

    await payload.update({ collection: 'orders', id: order.id, data: { discount: 5000 }, ...as(users['order-admin']) })
    const again = await issue(order.id)
    expect(again.id).not.toBe(id)
  })

  it('refuses a free or cancelled order', async () => {
    const free = await createOrder({ items: [{ description: 'QA Gratis', quantity: 1, unitPrice: 0 }] })
    await expect(issue(free.id)).rejects.toThrow(/Rp0/)
    const cancelled = await createOrder({ status: 'cancelled' })
    await expect(issue(cancelled.id)).rejects.toThrow(/dibatalkan/)
  })

  it('the private link needs the exact token, and the PDF renders in the customer’s language', async () => {
    const order = await createOrder({
      language: 'en',
      items: Array.from({ length: 40 }, (_, i) => ({ description: `QA Item ${i + 1}`, quantity: 1, unit: 'person', unitPrice: 10000 })),
    })
    const { id } = await issue(order.id)
    const invoice = await payload.findByID({ collection: 'invoices', id })
    expect((await getInvoiceByToken(invoice.token!))?.id).toBe(id)
    expect(await getInvoiceByToken(invoice.token!.slice(0, -1))).toBeNull()
    expect(await getInvoiceByToken('f'.repeat(48))).toBeNull()
    const view = invoiceView(invoice)
    expect(view.statusLabel).toBe('Unpaid')
    expect(view.total).toBe('Rp400.000')
    const pdf = await renderInvoicePdf(view)
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
  })
})

describe('prices', () => {
  it('a hidden price never reaches visitors, also not through filters; staff still see it', async () => {
    const item = await payload.create({
      collection: 'menu-items',
      data: { name: 'QA Hidden', category: 'coffee', price: 12345, showPrice: false, _status: 'draft' },
      locale: 'en',
      draft: true,
    })
    await payload.update({ collection: 'menu-items', id: item.id, locale: 'id', draft: true, data: { name: 'QA Tersembunyi' } })
    await payload.update({ collection: 'menu-items', id: item.id, locale: 'en', data: { _status: 'published' } })
    const where = { id: { equals: item.id } }
    const visitor = await payload.find({ collection: 'menu-items', where, overrideAccess: false })
    expect(visitor.totalDocs).toBe(1)
    expect(visitor.docs[0].price).toBeUndefined()
    const staff = await payload.find({ collection: 'menu-items', where, ...as(users['content-admin']) })
    expect(staff.docs[0].price).toBe(12345)
    await expect(payload.find({ collection: 'menu-items', where: { price: { greater_than: 1 } }, overrideAccess: false })).rejects.toThrow()

    await payload.update({ collection: 'menu-items', id: item.id, data: { showPrice: true, _status: 'published' } })
    expect((await payload.find({ collection: 'menu-items', where, overrideAccess: false })).docs[0].price).toBe(12345)
  })

  it('the price list for staff includes hidden prices and both pool tariffs, but no menu items', async () => {
    const res = await call(priceListEndpoint, users['order-admin'])
    const { items } = (await res.json()) as { items: PriceListItem[] }
    expect(items.filter((i) => i.category === 'pool' && /Dewasa/.test(i.description)).map((i) => i.unitPrice)).toEqual([50000, 60000])
    expect(items.some((i) => i.category === 'activity' && i.unitPrice === 75000)).toBe(true)
    expect(items.some((i) => /Kopi Bali|Nasi Campur/.test(i.description))).toBe(false)
  })
})

describe('WhatsApp', () => {
  const text = (url: string | null) => new URL(url!).searchParams.get('text')
  it('asks for what the visitor wants, in their language', () => {
    expect(text(whatsappUrl('62811111111', 'id', 'Bistro', { intent: 'table' }))).toMatch(/reservasi meja di Bistro.*meja tersedia/)
    expect(text(whatsappUrl('62811111111', 'id', 'Pool', { intent: 'booking', askPrice: false }))).toMatch(/reservasi Pool.*ketersediaannya/)
    expect(text(whatsappUrl('62811111111', 'id', 'Kelas Kreatif', { intent: 'booking', askPrice: true }))).toMatch(/ketersediaan dan harganya/)
    expect(text(whatsappUrl('62811111111', 'en', 'Pavilion', { intent: 'quote' }))).toMatch(/plan an event: Pavilion.*quote/)
    expect(whatsappUrl('0', 'en', 'Pool')).toBeNull()
  })
  it('turns typed numbers into international ones', () => {
    expect(normalizePhone('0812-3456-7890')).toBe('6281234567890')
    expect(normalizePhone('+61 400 000 000')).toBe('61400000000')
    expect(normalizePhone('0061 400 000 000')).toBe('61400000000')
  })
})
