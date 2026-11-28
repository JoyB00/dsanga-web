'use client'

import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useState, type ReactNode } from 'react'

import { cn } from '@/lib/cn'

type Filter = { value: string; label: string }
type Item = { id: string | number; type: string; node: ReactNode }

/**
 * Layout v2 §4.5: filter pills with counts above a card grid. Pills wrap on phones (no sideways scroll),
 * use aria-pressed, and the number of results is announced to screen readers. With `mobileLimit`, the
 * "All" view on phones shows that many cards, then the "View all" link.
 */
export function Catalog({
  filters,
  allLabel,
  resultsLabel,
  items,
  viewAll,
  mobileLimit,
  dark,
  gridClass = 'gap-6 sm:grid-cols-2 lg:grid-cols-3',
}: {
  filters: Filter[]
  allLabel: string
  /** "{n} shown" */
  resultsLabel: string
  items: Item[]
  viewAll?: { label: string; href: string }
  mobileLimit?: number
  /** On a dark section. */
  dark?: boolean
  gridClass?: string
}) {
  const [active, setActive] = useState('all')
  const visible = active === 'all' ? items : items.filter((i) => i.type === active)
  const count = (value: string) =>
    value === 'all' ? items.length : items.filter((i) => i.type === value).length
  const pills = [{ value: 'all', label: allLabel }, ...filters].filter((f) => count(f.value) > 0)

  return (
    <div className="flex flex-col gap-8">
      {pills.length > 2 && (
        <div role="group" aria-label={allLabel} className="flex flex-wrap justify-center gap-2">
          {pills.map((f) => (
            <button
              key={f.value}
              type="button"
              aria-pressed={active === f.value}
              onClick={() => setActive(f.value)}
              className={cn(
                'min-h-touch rounded-full border px-5 text-small font-bold transition-colors',
                dark
                  ? active === f.value
                    ? 'border-accent-on-dark bg-accent-on-dark text-foreground'
                    : 'border-white/40 bg-[rgb(0_0_0/0.25)] text-white hover:border-accent-on-dark'
                  : active === f.value
                    ? 'border-primary bg-primary text-on-primary shadow-[0_6px_16px_rgb(31_77_58/0.25)]'
                    : 'border-border bg-surface text-foreground hover:border-primary hover:text-primary',
              )}
            >
              {f.label} ({count(f.value)})
            </button>
          ))}
        </div>
      )}
      <p className="sr-only" aria-live="polite">
        {resultsLabel.replace('{n}', String(visible.length))}
      </p>
      <ul data-stagger className={cn('grid', gridClass)}>
        {visible.map((item, index) => (
          <li
            key={item.id}
            className={cn(
              mobileLimit != null && active === 'all' && index >= mobileLimit && 'max-sm:hidden',
            )}
          >
            {item.node}
          </li>
        ))}
      </ul>
      {viewAll && (
        <Link
          href={viewAll.href}
          className={cn(dark ? 'btn-outline-light' : 'btn-outline', 'self-center px-8')}
        >
          {viewAll.label}
          <ArrowRight className="size-5" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
