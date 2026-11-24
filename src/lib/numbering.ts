import { sql } from '@payloadcms/db-postgres'
import type { PayloadRequest } from 'payload'

/** Year and month in Bali time, e.g. { year: '2026', month: '11' }. */
const yearMonth = (date: Date) => {
  const [year, month] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
  })
    .format(date)
    .split('-')
  return { year, month }
}

/**
 * Next value of a counter, inside the request's own transaction: two people saving at the same moment
 * never get the same number, and a failed save gives its number back (no gaps).
 */
async function nextValue(req: PayloadRequest, key: string): Promise<number> {
  const adapter = req.payload.db as unknown as {
    drizzle: { execute: (q: unknown) => Promise<{ rows: { value: string | number }[] }> }
    sessions: Record<string, { db: { execute: (q: unknown) => Promise<{ rows: { value: string | number }[] }> } }>
  }
  const transactionID = await req.transactionID
  const db = (transactionID != null && adapter.sessions[transactionID]?.db) || adapter.drizzle
  const { rows } = await db.execute(sql`
    INSERT INTO "counters" ("key", "value", "updated_at", "created_at") VALUES (${key}, 1, now(), now())
    ON CONFLICT ("key") DO UPDATE SET "value" = "counters"."value" + 1, "updated_at" = now()
    RETURNING "value"`)
  return Number(rows[0].value)
}

const pad = (n: number) => String(n).padStart(4, '0')

/** DS-2611-0001 */
export async function nextOrderNumber(req: PayloadRequest, now = new Date()) {
  const { year, month } = yearMonth(now)
  return `DS-${year.slice(2)}${month}-${pad(await nextValue(req, `order-${year}-${month}`))}`
}

/** INV/2026/11/0001. Its own sequence: every order has a number, but not every order gets an invoice. */
export async function nextInvoiceNumber(req: PayloadRequest, now = new Date()) {
  const { year, month } = yearMonth(now)
  return `INV/${year}/${month}/${pad(await nextValue(req, `invoice-${year}-${month}`))}`
}
