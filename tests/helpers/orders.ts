import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

let counters: { key: string; value: number }[] = []

export async function rememberCounters() {
  const payload = await getPayload({ config })
  counters = (await payload.find({ collection: 'counters', limit: 1000, depth: 0 })).docs.map(({ key, value }) => ({ key, value }))
}

/** Removes the test order with its invoice and gives the running numbers back. */
export async function cleanupOrders(customerName: string) {
  const payload = await getPayload({ config })
  const numbers: string[] = []
  for (const collection of ['invoices', 'orders'] as const) {
    const { docs } = await payload.find({ collection, where: { customerName: { equals: customerName } }, depth: 0, limit: 50 })
    for (const doc of docs) numbers.push(String('invoiceNumber' in doc ? doc.invoiceNumber : 'orderNumber' in doc ? doc.orderNumber : ''))
    await payload.delete({ collection, where: { customerName: { equals: customerName } } })
  }
  await payload.delete({ collection: 'audit-logs', where: { summary: { in: numbers } } })
  for (const doc of (await payload.find({ collection: 'counters', limit: 1000, depth: 0 })).docs) {
    const before = counters.find((c) => c.key === doc.key)
    if (before) await payload.update({ collection: 'counters', id: doc.id, data: { value: before.value } })
    else await payload.delete({ collection: 'counters', id: doc.id })
  }
}
