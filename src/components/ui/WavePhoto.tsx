import type { ReactNode } from 'react'

import type { Media } from '@/payload-types'
import { cn } from '@/lib/cn'
import { CmsImage } from './CmsImage'
import { WaveEdge } from './WaveEdge'

/** Photo with the water-line edge for the top of a white card. The panel below needs `relative -mt-px bg-surface`. */
export function WavePhoto({
  media,
  placeholder,
  sizes,
  className = 'aspect-[16/10]',
  children,
}: {
  media?: Media | number | null
  placeholder: string
  sizes: string
  className?: string
  /** Badges placed on the photo. */
  children?: ReactNode
}) {
  return (
    <div className="relative text-surface">
      <div className="zoom-media overflow-hidden">
        <CmsImage
          media={media}
          placeholder={placeholder}
          size="card"
          sizes={sizes}
          className={cn('w-full', className)}
        />
      </div>
      <WaveEdge className="h-9" />
      {children}
    </div>
  )
}
