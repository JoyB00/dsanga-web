import type { Locale } from '../i18n/config'
import type { Event, Experience } from '../payload-types'
import { formatRupiah } from './format'

type PriceRow = NonNullable<Experience['prices']>[number]

const FROM: Record<Locale, string> = { en: 'From', id: 'Mulai' }

/** "Rp50.000", "From Rp75.000", or the words that replace a number ("Free"). Empty when there is no price. */
export function priceText(row: PriceRow, day: 'weekday' | 'weekend', locale: Locale): string {
  const words = row[day]?.trim()
  if (words) return words
  const amount = day === 'weekday' ? row.weekdayAmount : row.weekendAmount
  if (amount == null) return ''
  return row.startingFrom ? `${FROM[locale]} ${formatRupiah(amount)}` : formatRupiah(amount)
}

/** Event price: words ("Free") first, otherwise the amount. Empty when there is none or it is hidden. */
export const eventPrice = (event: Pick<Event, 'price' | 'priceAmount'>): string =>
  event.price?.trim() || formatRupiah(event.priceAmount)
