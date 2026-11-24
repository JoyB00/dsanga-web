import type { ReactNode } from 'react'

import type { Media } from '@/payload-types'
import { cn } from '@/lib/cn'
import { PhotoBackdrop } from './PhotoBackdrop'

/** Layout v2 section building blocks (docs/spec-layout-v2.md §4.3, §5). */

/** Small pill label above a heading. */
export function Eyebrow({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3.5 py-1 text-[12px] font-bold tracking-[0.18em] uppercase',
        dark
          ? 'border border-accent-on-dark/45 bg-[rgb(0_0_0/0.3)] text-accent-on-dark backdrop-blur-sm'
          : 'bg-highlight text-primary',
      )}
    >
      {children}
    </span>
  )
}

/** Eyebrow + serif h2 + intro; centred for catalogs and dark sections, left-aligned next to content. */
export function SectionHeader({
  eyebrow,
  title,
  intro,
  dark,
  center = true,
  action,
  id,
}: {
  eyebrow?: string | null
  title: string
  intro?: ReactNode
  dark?: boolean
  center?: boolean
  /** Button or link shown to the right of a left-aligned header. */
  action?: ReactNode
  id?: string
}) {
  const head = (
    <div
      className={cn(
        'flex flex-col gap-4',
        center ? 'mx-auto items-center text-center' : 'items-start',
      )}
    >
      {eyebrow && <Eyebrow dark={dark}>{eyebrow}</Eyebrow>}
      <h2
        id={id}
        className={cn(
          'max-w-3xl text-[34px] leading-[1.08] md:text-[48px]',
          dark ? 'text-white' : 'text-foreground',
        )}
      >
        {title}
      </h2>
      {intro && (
        <div
          className={cn('max-w-xl text-body-lg', dark ? 'text-white/80' : 'text-muted-foreground')}
        >
          {intro}
        </div>
      )}
    </div>
  )
  if (!action) return head
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      {head}
      {action}
    </div>
  )
}

type Tone = 'cream' | 'white' | 'alt' | 'soft' | 'dark'
const TONES: Record<Tone, string> = {
  cream: 'bg-background',
  white: 'bg-surface',
  alt: 'bg-surface-alt',
  soft: 'bg-linear-to-b from-surface to-background',
  dark: 'on-dark relative isolate overflow-hidden bg-primary-hover text-white',
}

/**
 * Page section: 96 px vertical space on desktop, 64 px on phones. Alternate the light tones;
 * at most one dark section per page (§5).
 */
export function Section({
  id,
  tone = 'cream',
  label,
  image,
  className,
  children,
  ...marker
}: {
  id?: string
  tone?: Tone
  /** Photo behind a dark section (layout v3). */
  image?: Media | number | null
  /** Accessible name when the section has no visible heading. */
  label?: string
  className?: string
  children: ReactNode
  /** F-15 staging marker, from temp(doc). */
  'data-unverified'?: ''
}) {
  return (
    <section
      {...marker}
      id={id}
      aria-label={label}
      className={cn('scroll-mt-24 py-16 md:py-24', TONES[tone], className)}
    >
      {tone === 'dark' && image && <PhotoBackdrop image={image} />}
      {tone === 'dark' && !image && (
        <div
          aria-hidden="true"
          className="absolute -top-40 -left-40 size-[480px] rounded-full bg-primary/70 blur-3xl"
        />
      )}
      <div className="container-content relative flex flex-col gap-10">{children}</div>
    </section>
  )
}
