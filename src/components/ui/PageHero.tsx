import type { ReactNode } from 'react'

import type { Media } from '@/payload-types'
import { cn } from '@/lib/cn'
import { Breadcrumbs, type Crumb } from './Breadcrumbs'
import { CmsImage } from './CmsImage'
import { Eyebrow } from './Section'
import { WaveEdge } from './WaveEdge'

const NEXT = { cream: 'text-background', alt: 'text-surface-alt', white: 'text-surface' } as const

type Props = {
  crumbs: Crumb[]
  eyebrow?: string | null
  title: string
  tagline?: string | null
  intro?: string | null
  actions?: ReactNode
  /** Full-width photo. Without one the page gets the short gradient header (Contact, Privacy). */
  image?: Media | number | null
  /** Background of the section below, so the wave runs into it. */
  next?: keyof typeof NEXT
  /** F-15 staging marker, from temp(doc). */
  'data-unverified'?: ''
}

/**
 * Inner-page hero (layout v3): bright full-width photo, shaded only behind the text, with a water-line edge
 * into the next section; or a short gradient header for text pages.
 */
export function PageHero({
  crumbs,
  eyebrow,
  title,
  tagline,
  intro,
  actions,
  image,
  next = 'cream',
  ...marker
}: Props) {
  const hasPhoto = Boolean(image)
  return (
    <>
      <section
        {...marker}
        className={cn(
          'on-dark relative isolate flex items-end overflow-hidden',
          hasPhoto
            ? 'min-h-[80svh] bg-primary-hover md:min-h-[78svh]'
            : 'bg-linear-to-br from-primary via-primary-hover to-foreground',
        )}
      >
        {hasPhoto && (
          <div className="hero-settle absolute inset-0 -z-10">
            <CmsImage
              media={image}
              placeholder=""
              priority
              size="hero"
              sizes="100vw"
              className="size-full"
            />
          </div>
        )}
        {/* The shade follows the height of the text, so short heroes stay bright. */}
        <div className={cn('relative w-full', hasPhoto && 'mt-56 md:mt-40')}>
          {hasPhoto && (
            <div
              aria-hidden="true"
              className="text-shade absolute inset-x-0 -top-28 bottom-0 -z-10"
            />
          )}
          <div
            className={cn(
              'container-content flex flex-col items-start gap-4',
              hasPhoto ? 'pb-24 md:pb-32' : 'pt-32 pb-20 md:pt-40 md:pb-28',
            )}
          >
            <Breadcrumbs crumbs={crumbs} onDark />
            {eyebrow && <Eyebrow dark>{eyebrow}</Eyebrow>}
            <h1 className="max-w-4xl text-[40px] leading-none text-white [text-shadow:0_2px_18px_rgb(0_0_0/0.35)] md:text-[68px]">
              {title}
            </h1>
            {tagline && (
              <p className="font-display-italic max-w-2xl text-[22px] leading-snug text-accent-on-dark md:text-[28px]">
                {tagline}
              </p>
            )}
            {intro && <p className="max-w-xl text-body-lg text-white/90">{intro}</p>}
            {actions && (
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
                {actions}
              </div>
            )}
          </div>
        </div>
        <WaveEdge className={cn('h-10 md:h-20', NEXT[next])} line={false} />
      </section>
      {/* Covers the sub-pixel seam under the wave. */}
      <div
        aria-hidden="true"
        className={cn('relative -mt-0.5 -mb-0.5 h-1 bg-current', NEXT[next])}
      />
    </>
  )
}
