import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

import type { Media } from '@/payload-types'
import { CmsImage } from './CmsImage'
import { WaveEdge } from './WaveEdge'

/**
 * Experience card for the dark section (layout v3): photo with a water-line edge over a green panel.
 * The whole card is one link named by its title, so it must not contain other buttons or links.
 */
export function WaveCard({
  href,
  image,
  title,
  text,
  badge,
  ...marker
}: {
  href: string
  image?: Media | number | null
  title: string
  text?: string | null
  /** e.g. "Coming soon" */
  badge?: string
  /** F-15 staging marker, from temp(doc). */
  'data-unverified'?: ''
}) {
  return (
    <Link
      {...marker}
      href={href}
      className="group relative flex h-full flex-col overflow-hidden rounded-card bg-primary text-white no-underline shadow-[0_12px_32px_rgb(0_0_0/0.3)] hover:text-white"
    >
      <div className="zoom-media relative overflow-hidden text-primary">
        <CmsImage
          media={image}
          placeholder={title}
          sizes="(min-width: 1024px) 25vw, 50vw"
          className="aspect-square w-full sm:aspect-[4/5]"
        />
        <WaveEdge className="h-8 sm:h-12" />
      </div>
      {badge && <span className="badge-soon absolute top-3 left-3">{badge}</span>}
      <div className="relative -mt-px flex flex-1 items-end justify-between gap-3 bg-primary px-4 pt-1 pb-4 sm:px-5 sm:pb-5">
        <div className="flex min-w-0 flex-col gap-1 self-start">
          <h3 className="text-[20px] leading-tight text-white sm:text-[25px]">{title}</h3>
          {text && <p className="hidden text-small text-white/80 sm:block">{text}</p>}
        </div>
        <ArrowRight
          className="size-5 shrink-0 text-accent-on-dark transition-transform group-hover:translate-x-1 max-sm:hidden"
          aria-hidden="true"
        />
      </div>
    </Link>
  )
}
