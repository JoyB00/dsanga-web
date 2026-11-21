import { Info } from 'lucide-react'

import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'
import { whatsappUrl } from '@/lib/whatsapp'
import { WhatsAppIcon } from '../WhatsAppIcon'

type Props = {
  number?: string | null
  locale: Locale
  /** Topic used in the pre-filled message (F-03), e.g. "Pool". */
  topic?: string | null
  label: string
  variant?: 'primary' | 'outline'
  className?: string
}

/** WhatsApp CTA. Renders nothing until an official/test number is configured. */
export function WhatsAppButton({ number, locale, topic, label, variant = 'primary', className }: Props) {
  const url = whatsappUrl(number, locale, topic)
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      data-track="whatsapp_click"
      data-topic={topic ?? undefined}
      className={cn(variant === 'primary' ? 'btn-primary' : 'btn-outline', className)}
    >
      <WhatsAppIcon />
      {label}
    </a>
  )
}

/** "Sending a WhatsApp message does not confirm your booking." (spec §6). */
export function WhatsAppNotice({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <p className={cn('flex items-start gap-2 text-small text-muted-foreground', className)}>
      <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {getDictionary(locale).whatsappNotice}
    </p>
  )
}
