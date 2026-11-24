import type { Media } from '@/payload-types'
import { cn } from '@/lib/cn'
import { temp } from '@/lib/verification'
import { CmsImage } from './CmsImage'

/** Tall, wide, wide, tall, … so every column ends at the same height (2 columns on phones, 4 from md). */
const isTall = (index: number) => index % 4 === 0 || index % 4 === 3

/** Staggered photo wall under the packages (layout v3). Phones show the first four photos. */
export function PhotoMosaic({ photos, columns = 4 }: { photos: Media[]; columns?: 2 | 4 }) {
  // Full rows of four only: an incomplete last row would leave uneven columns.
  if (photos.length < 4) return null
  // Four photos in four columns: one row of equal cards.
  const oneRow = columns === 4 && photos.length < 8
  const items = photos.slice(0, photos.length >= 8 ? 8 : 4)
  return (
    <ul className={cn('columns-2 gap-3 md:gap-4', columns === 4 && 'md:columns-4')}>
      {items.map((m, index) => (
        <li
          key={m.id}
          {...temp(m)}
          className={cn('group mb-3 break-inside-avoid md:mb-4', index >= 4 && 'max-md:hidden')}
        >
          <div className="zoom-media overflow-hidden rounded-card">
            <CmsImage
              media={m}
              placeholder=""
              size="card"
              sizes="(min-width: 768px) 25vw, 50vw"
              className={cn(
                'w-full',
                isTall(index) ? 'aspect-[3/4]' : 'aspect-[4/3]',
                oneRow && 'md:aspect-[4/5]',
              )}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
