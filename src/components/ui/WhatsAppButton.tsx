import { Info } from 'lucide-react'

import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'
import { whatsappUrl } from '@/lib/whatsapp'
import { WhatsAppIcon } from '../WhatsAppIcon'

const VARIANTS = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  /** On a photo (layout v2 §4.3) */
  glass: 'btn-glass',
  /** On a dark section or the CTA band */
  gold: 'btn-gold',
  /** Plain text link inside a card */
  link: 'inline-flex items-center gap-1.5 font-bold text-primary [&>svg]:hidden',
  /** Floating "Ask us" button (layout v2 §4.8); icon only on phones */
  floating:
    'fixed right-4 bottom-4 z-40 inline-flex min-h-14 min-w-14 items-center justify-center gap-2 rounded-full bg-[#25D366] font-bold text-[#0B3D2E] no-underline shadow-[0_10px_24px_rgb(37_211_102/0.4)] hover:bg-[#3BE07A] hover:text-[#0B3D2E] sm:px-5 [&>svg]:size-6 sm:[&>svg]:size-5',
} as const

type Props = {
  number?: string | null
  locale: Locale
  /** Topic used in the pre-filled message (F-03), e.g. "Pool". */
  topic?: string | null
  label: string
  variant?: keyof typeof VARIANTS
  className?: string
}

/** WhatsApp CTA. Renders nothing until an official/test number is configured (F-03). */
export function WhatsAppButton({
  number,
  locale,
  topic,
  label,
  variant = 'primary',
  className,
}: Props) {
  const url = whatsappUrl(number, locale, topic)
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-track="whatsapp_click"
      data-topic={topic ?? undefined}
      data-location={variant === 'floating' ? 'floating' : undefined}
      className={cn(VARIANTS[variant], className)}
    >
      <WhatsAppIcon />
      <span className={variant === 'floating' ? 'max-sm:sr-only' : undefined}>{label}</span>
    </a>
  )
}

/** "Sending a WhatsApp message does not confirm your booking." (spec §6). */
export function WhatsAppNotice({
  locale,
  dark,
  className,
}: {
  locale: Locale
  dark?: boolean
  className?: string
}) {
  return (
    <p
      className={cn(
        'flex items-start gap-2 text-small',
        dark ? 'text-white/75' : 'text-muted-foreground',
        className,
      )}
    >
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {getDictionary(locale).whatsappNotice}
    </p>
  )
}
