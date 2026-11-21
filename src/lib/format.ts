import type { Locale } from '../i18n/config'

const TIME_ZONE = 'Asia/Makassar' // WITA (Bali)
const intlLocale = (locale: Locale) => (locale === 'id' ? 'id-ID' : 'en-GB')

/** Rp350.000 — the format used in the spec and the style tile. */
export const formatRupiah = (value?: number | null) =>
  value == null ? '' : `Rp${Math.round(value).toLocaleString('id-ID')}`

export const formatDate = (iso: string | null | undefined, locale: Locale, opts?: Intl.DateTimeFormatOptions) =>
  iso
    ? new Intl.DateTimeFormat(intlLocale(locale), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: TIME_ZONE,
        ...opts,
      }).format(new Date(iso))
    : ''

export const formatTime = (iso: string | null | undefined, locale: Locale) =>
  iso
    ? new Intl.DateTimeFormat(intlLocale(locale), { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE })
        .format(new Date(iso))
        .replace(':', '.')
    : ''
