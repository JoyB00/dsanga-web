import Image from 'next/image'

import type { Media } from '@/payload-types'
import { cn } from '@/lib/cn'

type Props = {
  media?: Media | number | null
  /** Shown on the placeholder while the real photo isn't uploaded yet (temporary data). */
  placeholder: string
  className?: string
  sizes?: string
  priority?: boolean
  size?: 'thumb' | 'card' | 'hero'
}

/**
 * Renders a Payload image with its localized alt text, or a labelled sand placeholder
 * when no photo has been uploaded yet. The wrapper sets the box; the image covers it.
 */
export function CmsImage({ media, placeholder, className, sizes = '100vw', priority, size = 'card' }: Props) {
  const doc = typeof media === 'object' && media ? media : null
  const variant = doc?.sizes?.[size]
  const src = variant?.url || doc?.url

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
        priority={priority}
        className="object-cover"
        style={doc.focalX != null && doc.focalY != null ? { objectPosition: `${doc.focalX}% ${doc.focalY}%` } : undefined}
      />
    </div>
  )
}
