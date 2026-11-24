import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import '../(frontend)/globals.css'
import { cormorant, nunitoSans } from '../(frontend)/fonts'

/** Private invoice links: never indexed, no analytics, and the link is not passed on as a referrer. */
export const metadata: Metadata = {
  title: 'Invoice — D’Sanga',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
}

export default function InvoiceLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${cormorant.variable} ${nunitoSans.variable}`}>
      <body className="min-h-dvh bg-surface-alt">{children}</body>
    </html>
  )
}
