import Link from 'next/link'

export type Crumb = { label: string; href?: string }

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap gap-1 text-small text-muted-foreground">
        {crumbs.map((crumb, i) => (
          <li key={crumb.label} className="flex gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="text-muted-foreground underline-offset-4 hover:underline">
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
