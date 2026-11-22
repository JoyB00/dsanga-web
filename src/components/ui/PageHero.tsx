import type { ReactNode } from 'react'

import type { Media } from '@/payload-types'
import { cn } from '@/lib/cn'
import { Breadcrumbs, type Crumb } from './Breadcrumbs'
import { CmsImage } from './CmsImage'
import { Eyebrow } from './Section'

type Props = {
  crumbs: Crumb[]
  eyebrow?: string | null
  title: string
  tagline?: string | null
  intro?: string | null
  actions?: ReactNode
  /** Full-width photo. Without one the page gets the short gradient header (Contact, Privacy). */
  image?: Media | number | null
  /** F-15 staging marker, from temp(doc). */
  'data-unverified'?: ''
}

/**
 * Inner-page hero (layout v2 §4.2): full-width photo under a dark overlay, white serif title, gold tagline,
 * breadcrumb and CTAs; or a short gradient header for text pages.
 */
export function PageHero({
  crumbs,
  eyebrow,
  title,
  tagline,
  intro,
  actions,
  image,
  ...marker
}: Props) {
  const hasPhoto = Boolean(image)
  return (
    <section
      {...marker}
      className={cn(
        'relative isolate flex items-end overflow-hidden',
        hasPhoto
          ? 'min-h-[56svh] bg-primary-hover md:min-h-[62vh]'
          : 'bg-linear-to-br from-primary via-primary-hover to-foreground',
      )}
    >
      {hasPhoto && (
        <>
          <div className="absolute inset-0 -z-10">
            <CmsImage
              media={image}
              placeholder=""
              priority
              size="hero"
              sizes="100vw"
              className="size-full"
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-linear-to-b from-[rgb(0_0_0/0.5)] via-[rgb(0_0_0/0.35)] to-[rgb(0_0_0/0.82)]"
          />
        </>
      )}
      <div
        className={cn(
          'container-content flex flex-col items-start gap-5',
          hasPhoto ? 'pt-36 pb-14 md:pb-20' : 'pt-32 pb-12 md:pt-40 md:pb-16',
        )}
      >
        <Breadcrumbs crumbs={crumbs} onDark />
        {eyebrow && <Eyebrow dark>{eyebrow}</Eyebrow>}
        <h1 className="max-w-4xl text-[40px] leading-[1.03] text-white md:text-[64px]">{title}</h1>
        {tagline && (
          <p className="font-display-italic max-w-2xl text-[22px] leading-snug text-accent-on-dark md:text-[28px]">
            {tagline}
          </p>
        )}
        {intro && <p className="max-w-2xl text-body-lg text-white/90">{intro}</p>}
        {actions && (
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </section>
  )
}
