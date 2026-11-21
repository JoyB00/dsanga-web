import type { Experience } from '@/payload-types'
import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'

/** Status always shown as text, never colour alone (spec §8). */
export function AvailabilityBadge({
  availability,
  locale,
  className,
}: {
  availability: Experience['availability']
  locale: Locale
  className?: string
}) {
  const t = getDictionary(locale)
  if (availability === 'coming-soon') return <span className={cn('badge-soon', className)}>{t.status.comingSoon}</span>
  if (availability === 'available') return <span className={cn('badge-available', className)}>{t.status.available}</span>
  return null
}
