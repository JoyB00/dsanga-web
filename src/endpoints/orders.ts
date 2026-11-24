import { APIError, type Endpoint } from 'payload'

import { isOrderStaff } from '../access/roles'
import type { Locale } from '../i18n/config'

export type PriceListItem = {
  key: string
  category: string
  /** Shown in the admin list. */
  label: string
  /** Copied to the order, in the customer's language. */
  description: string
  unit: string
  unitPrice: number | null
}

const WORDS: Record<Locale, { weekday: string; weekend: string; from: string }> = {
  en: { weekday: 'weekday', weekend: 'weekend', from: 'from' },
  id: { weekday: 'hari kerja', weekend: 'akhir pekan', from: 'mulai' },
}

const cleanUnit = (unit?: string | null) => (unit ?? '').replace(/^\s*\/\s*/, '')

/**
 * GET /api/orders/price-list?locale=id — every product that can be ordered, with its current price
 * (also the prices hidden on the website). Menu items are left out: food is ordered on the spot.
 */
export const priceListEndpoint: Endpoint = {
  path: '/price-list',
  method: 'get',
  handler: async (req) => {
    if (!isOrderStaff(req.user)) throw new APIError('Forbidden', 403)
    const locale: Locale = req.searchParams.get('locale') === 'en' ? 'en' : 'id'
    const words = WORDS[locale]
    const { payload } = req
    const now = new Date().toISOString()
    const base = { locale, fallbackLocale: 'en' as const, depth: 0, limit: 200, req }
    const live = { _status: { equals: 'published' as const } }
    const [experiences, packages, offers, events] = await Promise.all([
      payload.find({
        collection: 'experiences',
        ...base,
        where: { and: [live, { availability: { equals: 'available' } }, { type: { not_equals: 'dining' } }] },
        sort: 'order',
      }),
      payload.find({ collection: 'venue-packages', ...base, where: live, sort: 'order' }),
      payload.find({
        collection: 'offers',
        ...base,
        where: { and: [live, { validFrom: { less_than_equal: now } }, { validUntil: { greater_than_equal: now } }] },
      }),
      payload.find({
        collection: 'events',
        ...base,
        where: { and: [live, { startsAt: { greater_than_equal: now } }] },
        sort: 'startsAt',
      }),
    ])

    const items: PriceListItem[] = []
    const add = (key: string, category: string, description: string, unit: string, unitPrice?: number | null) =>
      items.push({ key, category, label: description, description, unit, unitPrice: unitPrice ?? null })

    for (const exp of experiences.docs) {
      const rows = exp.prices ?? []
      if (!rows.length) add(`experiences-${exp.id}`, exp.type, exp.title, '')
      rows.forEach((row, i) => {
        const name = `${exp.title} – ${row.label}`
        const unit = cleanUnit(row.unit)
        const key = `experiences-${exp.id}-${i}`
        if (row.weekendAmount != null && row.weekendAmount !== row.weekdayAmount) {
          add(`${key}-wd`, exp.type, `${name} (${words.weekday})`, unit, row.weekdayAmount)
          add(`${key}-we`, exp.type, `${name} (${words.weekend})`, unit, row.weekendAmount)
        } else if (row.weekdayAmount != null || !row.weekday) {
          add(key, exp.type, name, unit, row.weekdayAmount)
        } else {
          add(key, exp.type, name, unit, 0) // words such as "Free"
        }
      })
    }
    for (const pkg of packages.docs) add(`venue-packages-${pkg.id}`, 'venue', pkg.name, '', pkg.priceFrom)
    for (const offer of offers.docs) add(`offers-${offer.id}`, 'offer', offer.title, cleanUnit(offer.priceUnit), offer.price)
    for (const event of events.docs) {
      // Words without an amount ("Free") count as 0, like the price rows above.
      add(`events-${event.id}`, 'event', event.title, '', event.priceAmount ?? (event.price ? 0 : null))
    }

    return Response.json({ items }, { headers: { 'Cache-Control': 'private, no-store' } })
  },
}

/** POST /api/orders/:id/invoice — freeze the order into a numbered invoice. */
export const createInvoiceEndpoint: Endpoint = {
  path: '/:id/invoice',
  method: 'post',
  handler: async (req) => {
    if (!isOrderStaff(req.user)) throw new APIError('Forbidden', 403)
    const { payload } = req
    const refuse = (message: string) => new APIError(message, 400, undefined, true)

    const order = await payload
      .findByID({ collection: 'orders', id: String(req.routeParams?.id), depth: 0, req })
      .catch(() => null)
    if (!order) throw new APIError('Pesanan tidak ditemukan.', 404, undefined, true)
    if (order.type !== 'booking') throw refuse('Reservasi meja tidak memakai invoice.')
    if (order.status === 'cancelled') throw refuse('Pesanan ini sudah dibatalkan.')
    if (!order.total) throw refuse('Total pesanan masih Rp0.')

    const existing = await payload.find({
      collection: 'invoices',
      where: { activeOrder: { equals: String(order.id) } },
      depth: 0,
      limit: 1,
      req,
    })
    if (existing.docs[0]) throw refuse(`Pesanan ini sudah punya invoice ${existing.docs[0].invoiceNumber}.`)

    const locale = order.language
    const [settings, site] = await Promise.all([
      payload.findGlobal({ slug: 'invoice-settings', locale, fallbackLocale: 'en', depth: 0, req }),
      payload.findGlobal({ slug: 'site-settings', locale, fallbackLocale: 'en', depth: 0, req }),
    ])
    const siteNumber = (site.whatsappNumber ?? '').replace(/\D/g, '')

    const invoice = await payload.create({
      collection: 'invoices',
      depth: 0,
      req,
      data: {
        status: 'unpaid',
        order: order.id,
        activeOrder: String(order.id),
        customerName: order.customerName,
        customerWhatsapp: order.customerWhatsapp,
        customerEmail: order.customerEmail,
        language: locale,
        items: (order.items ?? []).map(({ description, quantity, unit, unitPrice, amount }) => ({
          description,
          quantity,
          unit,
          unitPrice,
          amount,
        })),
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        seller: {
          name: settings.businessName || 'D’Sanga Pool, Bistro & Space',
          address: settings.address || site.address || '',
          phone: settings.phone || (siteNumber.length >= 8 ? `+${siteNumber}` : ''),
          email: settings.email || site.email || '',
          taxId: settings.taxId || '',
          bankAccounts: (settings.bankAccounts ?? []).map(({ bank, number, holder }) => ({ bank, number, holder })),
          terms: settings.terms || '',
        },
      },
    })
    return Response.json({ id: invoice.id, invoiceNumber: invoice.invoiceNumber })
  },
}
