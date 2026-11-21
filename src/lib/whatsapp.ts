import type { Locale } from '../i18n/config'

/**
 * F-03: every WhatsApp button uses the one official number from Site settings and a
 * pre-filled message in the language of the current page (spec §6 message format).
 */
export function whatsappUrl(number: string | null | undefined, locale: Locale, topic?: string | null): string | null {
  const digits = (number ?? '').replace(/\D/g, '')
  if (digits.length < 8) return null // not configured yet → hide WhatsApp buttons

  const subject = topic?.trim()
  const text =
    locale === 'id'
      ? `Halo D’Sanga, saya ingin bertanya${subject ? ` tentang ${subject}` : ''}. Rencana kunjungan: [tanggal], jumlah orang: [jumlah], kebutuhan: [detail]. Mohon informasi harga dan ketersediaannya. Terima kasih.`
      : `Hello D’Sanga, I would like to ask${subject ? ` about ${subject}` : ''}. Planned visit: [date], number of people: [number], needs: [details]. Could you please share the price and availability? Thank you.`

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}
