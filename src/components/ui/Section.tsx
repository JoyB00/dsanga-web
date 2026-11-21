import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Props = {
  id?: string
  eyebrow?: string
  title?: string
  intro?: ReactNode
  /** Right-aligned link/button next to the heading, e.g. "View All →". */
  action?: ReactNode
  alt?: boolean
  className?: string
  children: ReactNode
}

/** Page section: eyebrow + Caveat h2 + optional intro and action, on cream or sand. */
export function Section({ id, eyebrow, title, intro, action, alt, className, children }: Props) {
  const hasHeader = eyebrow || title || intro || action
  return (
    <section id={id} className={cn('section', alt && 'section-alt', className)}>
      <div className="container-content flex flex-col gap-8">
        {hasHeader && (
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex max-w-2xl flex-col gap-3">
              {eyebrow && <span className="eyebrow">{eyebrow}</span>}
              {title && <h2>{title}</h2>}
              {intro && <div className="text-body-lg text-muted-foreground">{intro}</div>}
            </div>
            {action}
          </div>
        )}
        {children}
      </div>
    </section>
  )
}
