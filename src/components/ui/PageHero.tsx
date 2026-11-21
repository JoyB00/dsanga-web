import Link from 'next/link'
import type { ReactNode } from 'react'

import type { Media } from '@/payload-types'
import { CmsImage } from './CmsImage'

type Crumb = { label: string; href?: string }

type Props = {
  crumbs: Crumb[]
  title: string
  tagline?: string | null
  intro?: string | null
  actions?: ReactNode
  image?: Media | number | null
  imagePlaceholder: string
}

/** Inner-page hero from the wireframes: breadcrumb, Caveat title, tagline, intro, CTAs, large photo. */
export function PageHero({ crumbs, title, tagline, intro, actions, image, imagePlaceholder }: Props) {
  return (
    <section className="pt-10 pb-12 md:pt-14 md:pb-16">
      <div className="container-content grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex flex-col gap-5">
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
          <h1>{title}</h1>
          {tagline && <p className="text-h3 font-bold text-foreground">{tagline}</p>}
          {intro && <p className="max-w-xl text-body-lg text-muted-foreground">{intro}</p>}
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
        <CmsImage
          media={image}
          placeholder={imagePlaceholder}
          priority
          size="hero"
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="aspect-[4/3] w-full rounded-media"
        />
      </div>
    </section>
  )
}
