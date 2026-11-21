'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'

import { cn } from '@/lib/cn'

export type MenuCategory = {
  id: string
  label: string
  items: { id: number | string; name: string; description?: string | null; note?: string | null; price: string }[]
}

/** Menu category tabs (WAI-ARIA tabs pattern: arrow keys move between tabs). */
export function MenuTabs({ categories, label }: { categories: MenuCategory[]; label: string }) {
  const [active, setActive] = useState(0)
  const tabs = useRef<Array<HTMLButtonElement | null>>([])
  const baseId = useId()
  if (!categories.length) return null

  const focusTab = (index: number) => {
    const next = (index + categories.length) % categories.length
    setActive(next)
    tabs.current[next]?.focus()
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight') focusTab(index + 1)
    else if (e.key === 'ArrowLeft') focusTab(index - 1)
    else if (e.key === 'Home') focusTab(0)
    else if (e.key === 'End') focusTab(categories.length - 1)
    else return
    e.preventDefault()
  }

  const current = categories[active]

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
        {categories.map((cat, i) => (
          <button
            key={cat.id}
            ref={(el) => {
              tabs.current[i] = el
            }}
            id={`${baseId}-tab-${cat.id}`}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-controls={`${baseId}-panel`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'min-h-touch cursor-pointer rounded-full border-2 px-5 text-small font-bold transition-colors',
              i === active
                ? 'border-primary bg-primary text-on-primary'
                : 'border-input-border bg-surface text-foreground hover:border-primary',
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${current.id}`}
        className="card px-6 py-2"
      >
        <ul>
          {current.items.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-4 border-b border-border py-4 last:border-0">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-foreground">{item.name}</span>
                {item.description && <span className="text-small text-muted-foreground">{item.description}</span>}
                {item.note && <span className="text-caption text-muted-foreground">{item.note}</span>}
              </div>
              <span className="font-bold whitespace-nowrap text-foreground">{item.price}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
