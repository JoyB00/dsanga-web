import Image from 'next/image'

import type { Media } from '@/payload-types'
import { cn } from '@/lib/cn'
import { mediaSrc } from '@/lib/media'

type Props = {
  media?: Media | number | null
  /** Shown on the placeholder while the real photo isn't uploaded yet (temporary data). */
  placeholder: string
  className?: string
  sizes?: string
  /** Above the fold (hero): load immediately with high priority. */
  priority?: boolean
  size?: 'thumb' | 'card' | 'hero'
}

/**
 * Renders a Payload image with its localized alt text, or a labelled sand placeholder
 * when no photo has been uploaded yet. The wrapper sets the box; the image covers it.
 */
export function CmsImage({
  media,
  placeholder,
  className,
  sizes = '100vw',
  priority,
  size = 'card',
}: Props) {
  const doc = typeof media === 'object' && media ? media : null
  const variant = doc?.sizes?.[size]
  const src = mediaSrc(variant?.url || doc?.url, doc?.updatedAt)

  if (!doc || !src) {
    return (
      <div
        aria-hidden="true"
        className={cn(
          'flex items-center justify-center overflow-hidden bg-[repeating-linear-gradient(45deg,var(--ds-color-placeholder)_0_14px,var(--ds-color-surface-alt)_14px_28px)] p-4 text-center text-caption font-semibold text-muted-foreground',
          className,
        )}
      >
        {placeholder}
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-placeholder', className)}>
      <Image
        src={src}
        alt={doc.alt ?? ''}
        fill
        sizes={sizes}
        // Next 16 deprecated `priority`: above-the-fold photos (the LCP element) load eagerly
        // with high fetch priority instead.
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        className="object-cover"
        style={
          doc.focalX != null && doc.focalY != null
            ? { objectPosition: `${doc.focalX}% ${doc.focalY}%` }
            : undefined
        }
      />
    </div>
  )
}
