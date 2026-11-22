import Link from 'next/link'

import { cn } from '@/lib/cn'

export type Crumb = { label: string; href?: string }

export function Breadcrumbs({ crumbs, onDark }: { crumbs: Crumb[]; onDark?: boolean }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol
        className={cn(
          'flex flex-wrap gap-1.5 text-small',
          onDark ? 'text-white/80' : 'text-muted-foreground',
        )}
      >
        {crumbs.map((crumb, i) => (
          <li key={crumb.label} className="flex gap-1.5">
            {i > 0 && <span aria-hidden="true">/</span>}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className={cn(
                  'underline-offset-4 hover:underline',
                  onDark ? 'text-white/85 hover:text-white' : 'text-muted-foreground',
                )}
              >
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className={onDark ? 'text-white' : undefined}>
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
