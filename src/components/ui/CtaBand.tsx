import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import { WhatsAppNotice } from './WhatsAppButton'

/** Closing call to action (layout v2 §4.6): full-width green gradient band, centred text, two buttons. */
export function CtaBand({
  eyebrow,
  title,
  text,
  locale,
  showNotice = true,
  children,
}: {
  eyebrow?: string | null
  title: string
  text?: string | null
  locale: Locale
  /** "A WhatsApp message does not confirm your booking" (spec §6). */
  showNotice?: boolean
  children?: ReactNode
}) {
  return (
    <section className="bg-linear-to-br from-primary via-primary-hover to-foreground py-20 text-center md:py-24">
      <div className="container-content flex flex-col items-center gap-6">
        {eyebrow && (
          <span className="text-[12px] font-bold tracking-[0.24em] text-accent-on-dark uppercase">
            {eyebrow}
          </span>
        )}
        <h2 className="max-w-3xl text-[36px] leading-[1.05] text-white md:text-[54px]">{title}</h2>
        {text && <p className="max-w-2xl text-body-lg text-highlight">{text}</p>}
        {children && (
          <div className="flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
            {children}
          </div>
        )}
        {showNotice && (
          <WhatsAppNotice locale={locale} dark className="justify-center text-center" />
        )}
      </div>
    </section>
  )
}
