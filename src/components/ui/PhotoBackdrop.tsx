import type { Media } from '@/payload-types'
import { cn } from '@/lib/cn'
import { CmsImage } from './CmsImage'

/** Decorative photo behind a dark section, under an even green shade that keeps text at AA contrast. */
export function PhotoBackdrop({
  image,
  shade = 'bg-primary-hover/85',
}: {
  image?: Media | number | null
  shade?: string
}) {
  return (
    <>
      <div aria-hidden="true" className="drift absolute -inset-y-[10%] inset-x-0 -z-10">
        <CmsImage media={image} placeholder="" size="hero" className="size-full" />
      </div>
      <div aria-hidden="true" className={cn('absolute inset-0 -z-10', shade)} />
    </>
  )
}
