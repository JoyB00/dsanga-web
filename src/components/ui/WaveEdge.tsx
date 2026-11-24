import { cn } from '@/lib/cn'

/**
 * Water-line edge between a photo and the panel below it (layout v3 motif). The fill takes the panel
 * colour from `currentColor`; a thin gold line follows the crest.
 */
export function WaveEdge({ className, line = true }: { className?: string; line?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 400 40"
      preserveAspectRatio="none"
      className={cn('pointer-events-none absolute inset-x-0 -bottom-px w-full', className)}
    >
      <path d="M0 22C50 4 92 4 140 18s92 20 140 4 82-16 120-4V40H0Z" fill="currentColor" />
      {line && (
        <path
          d="M0 22C50 4 92 4 140 18s92 20 140 4 82-16 120-4"
          fill="none"
          stroke="var(--ds-color-accent-on-dark)"
          strokeWidth="2.5"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )
}
