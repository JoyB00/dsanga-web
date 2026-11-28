import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import type { Media } from '@/payload-types'
import { PhotoBackdrop } from './PhotoBackdrop'
import { WhatsAppNotice } from './WhatsAppButton'

/** Closing call to action (layout v2 §4.6): full-width green band (over a photo in layout v3), centred text, two buttons. */
export function CtaBand({
  eyebrow,
  title,
  text,
  locale,
  showNotice = true,
  image,
  children,
}: {
  eyebrow?: string | null
  title: string
  text?: string | null
  locale: Locale
  /** "A WhatsApp message does not confirm your booking" (spec §6). */
  showNotice?: boolean
  image?: Media | number | null
  children?: ReactNode
}) {
  return (
    <section className="on-dark relative isolate overflow-clip bg-linear-to-br from-primary via-primary-hover to-foreground py-20 text-center md:py-28">
      {image && <PhotoBackdrop image={image} shade="bg-primary-hover/78" />}
      <div className="container-content reveal-children flex flex-col items-center gap-6">
        {eyebrow && (
          <span className="text-[12px] font-bold tracking-[0.24em] text-accent-on-dark uppercase">
            {eyebrow}
          </span>
        )}
        <h2 className="max-w-3xl text-[36px] leading-[1.05] text-white md:text-[54px]">{title}</h2>
        {text && <p className="max-w-xl text-body-lg text-highlight">{text}</p>}
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
