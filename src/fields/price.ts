import type { Field, FieldAccess } from 'payload'

/**
 * Not every product shows its price (order flow, Nov 2026). Staff always see prices; visitors, including
 * the public API, only when the record says so. Without a document (filtering and sorting) the answer is
 * "no", so a hidden price can't be guessed through queries either.
 */
export const readPrice: FieldAccess = ({ req, doc }) =>
  Boolean(req.user) || (doc != null && (doc as { showPrice?: boolean | null }).showPrice !== false)

export const showPriceField: Field = {
  name: 'showPrice',
  type: 'checkbox',
  label: 'Show price on the website',
  defaultValue: true,
  admin: {
    position: 'sidebar',
    description: 'Off = the price is hidden and visitors ask for it on WhatsApp. Staff still use it in orders.',
  },
}
