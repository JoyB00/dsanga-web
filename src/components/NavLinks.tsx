'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { routeKeyFromPathname, type RouteKey } from '../i18n/config'
import { cn } from '../lib/cn'

type Item = { key: RouteKey; label: string; href: string }

/** Main navigation links with the current page marked (aria-current + green underline). */
export function NavLinks({ items, variant }: { items: Item[]; variant: 'desktop' | 'mobile' }) {
  const current = routeKeyFromPathname(usePathname() ?? '/')

  return items.map((item) => {
    const active = item.key === current
    return (
      <Link
        key={item.key}
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'no-underline',
          variant === 'desktop'
            ? cn(
                'border-b-2 py-2 text-body font-semibold hover:text-primary',
                active ? 'border-primary text-primary' : 'border-transparent text-foreground',
              )
            : cn(
                'flex min-h-touch items-center border-b border-border text-body-lg font-bold',
                active ? 'text-primary' : 'text-foreground',
              ),
        )}
      >
        {item.label}
      </Link>
    )
  })
}
