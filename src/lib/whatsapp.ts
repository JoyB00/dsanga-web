import type { Locale } from '../i18n/config'

/**
 * What the visitor wants (order flow, Nov 2026). Every order is agreed on WhatsApp:
 * - ask: general question
 * - booking: reserve a product (pool, rate, activity, offer)
 * - join: an event, which already has its date
 * - table: reserve a table at the restaurant or bistro; food and drinks are ordered on the spot
 * - quote: venue packages, priced per event
 */
export type WhatsAppIntent = 'ask' | 'booking' | 'join' | 'table' | 'quote'

const MESSAGES: Record<Locale, Record<WhatsAppIntent, (topic: string, askPrice: boolean) => string>> = {
  en: {
    ask: (t) =>
      `Hello D’Sanga, I would like to ask${t && ` about ${t}`}. Planned visit: [date], number of people: [number], needs: [details]. Could you please share the price and availability? Thank you.`,
    booking: (t, price) =>
      `Hello D’Sanga, I would like to book ${t || 'a visit'}. Date: [date], time: [time], number of people: [number], notes: [details]. Could you please confirm the availability${price ? ' and the price' : ''}? Thank you.`,
    join: (t, price) =>
      `Hello D’Sanga, I would like to join ${t}. Number of people: [number], notes: [details]. Could you please confirm if there are places left${price ? ', and the price' : ''}? Thank you.`,
    table: (t) =>
      `Hello D’Sanga, I would like to reserve a table${t && ` at ${t}`}. Date: [date], time: [time], number of people: [number], notes: [details]. Could you please confirm if a table is available? Thank you.`,
    quote: (t) =>
      `Hello D’Sanga, I would like to plan an event${t && `: ${t}`}. Date: [date], time: [time], number of guests: [number], type of event: [details]. Could you please share the availability and a quote? Thank you.`,
  },
  id: {
    ask: (t) =>
      `Halo D’Sanga, saya ingin bertanya${t && ` tentang ${t}`}. Rencana kunjungan: [tanggal], jumlah orang: [jumlah], kebutuhan: [detail]. Mohon informasi harga dan ketersediaannya. Terima kasih.`,
    booking: (t, price) =>
      `Halo D’Sanga, saya ingin reservasi ${t || 'kunjungan'}. Tanggal: [tanggal], jam: [jam], jumlah orang: [jumlah], catatan: [detail]. Mohon konfirmasi ketersediaan${price ? ' dan harganya' : 'nya'}. Terima kasih.`,
    join: (t, price) =>
      `Halo D’Sanga, saya ingin ikut ${t}. Jumlah orang: [jumlah], catatan: [detail]. Mohon konfirmasi apakah tempat masih tersedia${price ? ' dan berapa harganya' : ''}. Terima kasih.`,
    table: (t) =>
      `Halo D’Sanga, saya ingin reservasi meja${t && ` di ${t}`}. Tanggal: [tanggal], jam: [jam], jumlah orang: [jumlah], catatan: [detail]. Mohon konfirmasi apakah meja tersedia. Terima kasih.`,
    quote: (t) =>
      `Halo D’Sanga, saya ingin mengadakan acara${t && `: ${t}`}. Tanggal: [tanggal], jam: [jam], jumlah tamu: [jumlah], jenis acara: [detail]. Mohon informasi ketersediaan dan penawaran harganya. Terima kasih.`,
  },
}

/**
 * F-03: every WhatsApp button uses the one official number from Site settings and a
 * pre-filled message in the language of the current page.
 */
export function whatsappUrl(
  number: string | null | undefined,
  locale: Locale,
  topic?: string | null,
  { intent = 'ask', askPrice = true }: { intent?: WhatsAppIntent; askPrice?: boolean } = {},
): string | null {
  const digits = (number ?? '').replace(/\D/g, '')
  if (digits.length < 8) return null // not configured yet → hide WhatsApp buttons
  return `https://wa.me/${digits}?text=${encodeURIComponent(MESSAGES[locale][intent](topic?.trim() ?? '', askPrice))}`
}

/**
 * Customer numbers as staff type them → international digits for wa.me.
 * "0812…" is Indonesian (62…); tourists' numbers need their country code ("+61…").
 */
export function normalizePhone(value: string | null | undefined): string {
  const digits = (value ?? '').replace(/\D/g, '')
  if (digits.startsWith('00')) return digits.slice(2)
  return digits.startsWith('0') ? `62${digits.slice(1)}` : digits
}
