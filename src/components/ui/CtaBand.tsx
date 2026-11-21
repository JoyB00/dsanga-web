import type { ReactNode } from 'react'

import type { Locale } from '@/i18n/config'
import { WhatsAppNotice } from './WhatsAppButton'

/** Closing call-to-action card used at the bottom of product pages. */
export function CtaBand({
  title,
  text,
  locale,
  showNotice = true,
  children,
}: {
  title: string
  text: string
  locale: Locale
  showNotice?: boolean
  children?: ReactNode
}) {
  return (
    <section className="pb-section-mobile md:pb-section">
      <div className="container-content">
        <div className="card flex flex-wrap items-center justify-between gap-6 bg-surface-alt p-8 md:p-10">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 className="text-display-lg lg:text-display-lg">{title}</h2>
            <p className="text-body-lg text-muted-foreground">{text}</p>
            {showNotice && <WhatsAppNotice locale={locale} />}
          </div>
          {children && <div className="flex flex-wrap gap-3">{children}</div>}
        </div>
      </div>
    </section>
  )
}
