import type { ReactNode } from 'react'

import type { Media } from '@/payload-types'
import { Breadcrumbs, type Crumb } from './Breadcrumbs'
import { CmsImage } from './CmsImage'

type Props = {
  crumbs: Crumb[]
  title: string
  tagline?: string | null
  intro?: string | null
  actions?: ReactNode
  image?: Media | number | null
  imagePlaceholder: string
  /** F-15 staging marker, from temp(doc). */
  'data-unverified'?: ''
}

/** Inner-page hero from the wireframes: breadcrumb, Caveat title, tagline, intro, CTAs, large photo. */
export function PageHero({ crumbs, title, tagline, intro, actions, image, imagePlaceholder, ...marker }: Props) {
  return (
    <section {...marker} className="pt-10 pb-12 md:pt-14 md:pb-16">
      <div className="container-content grid items-center gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
        <div className="flex flex-col gap-5">
          <Breadcrumbs crumbs={crumbs} />
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

/** Text-only page header (Visit Us, Contact, Privacy…). */
export function PageHeader({ crumbs, title, tagline, intro, ...marker }: Omit<Props, 'image' | 'imagePlaceholder' | 'actions'>) {
  return (
    <section {...marker} className="pt-10 pb-8 md:pt-14">
      <div className="container-content">
        <div className="flex max-w-3xl flex-col gap-4">
          <Breadcrumbs crumbs={crumbs} />
          <h1>{title}</h1>
          {tagline && <p className="text-h3 font-bold text-foreground">{tagline}</p>}
          {intro && <p className="text-body-lg text-muted-foreground">{intro}</p>}
        </div>
      </div>
    </section>
  )
}
