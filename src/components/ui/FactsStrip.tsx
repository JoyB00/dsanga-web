import type { ComponentType, ReactNode } from 'react'

import { cn } from '@/lib/cn'

export type Fact = {
  icon: ComponentType<{ className?: string }>
  /** Small line above the value; leave out when the value speaks for itself. */
  label?: string
  value: ReactNode
  note?: ReactNode
}

const COLUMNS: Record<number, string> = {
  1: '',
  2: 'grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-2 lg:grid-cols-5',
  6: 'grid-cols-2 lg:grid-cols-3',
}

/** White strip of key facts over the wave of a photo hero (layout v3). */
export function FactsStrip({
  facts,
  label,
  id,
  className,
  ...marker
}: {
  facts: Fact[]
  /** Accessible name of the section. */
  label: string
  id?: string
  className?: string
  /** F-15 staging marker, from temp(doc). */
  'data-unverified'?: ''
}) {
  if (!facts.length) return null
  // One fact per row would leave a hole in a two-column grid; the last one then takes the full row.
  const odd = facts.length % 2 === 1 && facts.length > 3
  const compact = facts.some((f) => !f.label)
  return (
    <section
      {...marker}
      id={id}
      aria-label={label}
      className={cn('container-content relative z-10 -mt-14 scroll-mt-28 md:-mt-20', className)}
    >
      <ul
        className={cn(
          'grid gap-px overflow-hidden rounded-media bg-border shadow-raised',
          COLUMNS[Math.min(facts.length, 6)],
        )}
      >
        {facts.map(({ icon: Icon, label: name, value, note }, i) => (
          <li
            key={name ?? i}
            className={cn(
              'flex min-w-0 flex-col gap-1 bg-surface p-4 md:p-6',
              odd && i === facts.length - 1 && 'col-span-2 lg:col-span-1',
            )}
          >
            <span className="flex items-center gap-2 text-caption font-bold text-accent-text">
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {name}
            </span>
            <span
              className={cn(
                'font-display leading-tight font-bold text-primary lining-nums',
                compact ? 'text-[21px] md:text-[24px]' : 'text-[24px] md:text-[32px]',
              )}
            >
              {value}
            </span>
            {note && <span className="text-caption text-muted-foreground">{note}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
