import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

import type { Media } from '@/payload-types'
import { cn } from '@/lib/cn'
import { CmsImage } from './CmsImage'

export type Chip = { icon?: ReactNode; text: string }

/**
 * Photo card (layout v2 §4.4): photo (4:3 on phones, 4:5 from tablet), dark gradient from the middle down,
 * category, serif title, up to two chips and a round arrow. The whole card is one link named by its title,
 * so it must not contain other buttons or links.
 */
export function OverlayCard({
  href,
  image,
  category,
  title,
  chips = [],
  badge,
  wide,
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  ...marker
}: {
  href: string
  image?: Media | number | null
  category: string
  title: string
  chips?: Chip[]
  /** e.g. "Coming soon" */
  badge?: string
  /** Landscape on tablet and up, for rows of two. */
  wide?: boolean
  sizes?: string
  /** F-15 staging marker, from temp(doc). */
  'data-unverified'?: ''
}) {
  return (
    <Link
      {...marker}
      href={href}
      className={cn(
        'group relative block aspect-[4/3] overflow-hidden rounded-card bg-primary-hover text-white no-underline shadow-[0_8px_24px_rgb(31_42_36/0.12)] hover:text-white',
        wide ? 'lg:aspect-[16/9]' : 'sm:aspect-[4/5]',
      )}
    >
      <div className="zoom-media absolute inset-0">
        <CmsImage media={image} placeholder={title} sizes={sizes} className="size-full" />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-transparent from-25% via-[rgb(0_0_0/0.4)] via-60% to-[rgb(0_0_0/0.88)]"
      />
      {badge && <span className="badge-soon absolute top-4 left-4">{badge}</span>}
      <div className="absolute inset-x-0 bottom-0 flex items-end gap-4 p-5 md:p-6">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <span className="text-[12px] font-bold tracking-[0.14em] text-accent-on-dark uppercase">
            {category}
          </span>
          <h3 className="text-[26px] leading-[1.1] text-white">{title}</h3>
          {chips.length > 0 && (
            <ul className="mt-1 flex flex-wrap gap-2">
              {chips.map((chip) => (
                <li
                  key={chip.text}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[rgb(0_0_0/0.55)] px-2.5 py-1 text-[12px] font-semibold text-white"
                >
                  {chip.icon}
                  {chip.text}
                </li>
              ))}
            </ul>
          )}
        </div>
        <span
          aria-hidden="true"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-white/70 transition-colors group-hover:bg-white group-hover:text-primary-hover"
        >
          <ArrowRight className="size-5" />
        </span>
      </div>
    </Link>
  )
}
