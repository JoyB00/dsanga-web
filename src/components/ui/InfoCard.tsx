import type { ComponentType, ReactNode } from 'react'

import { cn } from '@/lib/cn'

type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>

/** Light tints of the v1 palette for icon tiles (layout v2 §3.1). */
export const TINTS = [
  'bg-highlight text-primary',
  'bg-tint-sand text-accent-text',
  'bg-surface-alt text-warm',
  'bg-tint-mint text-secondary',
] as const

/** Horizontal info card (layout v2 §4.4): icon tile left, label and value right. */
export function InfoCard({
  icon: Icon,
  label,
  children,
  className,
}: {
  icon: IconComponent
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full items-start gap-4 rounded-card border border-border bg-surface p-5 shadow-card',
        className,
      )}
    >
      <span
        className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-highlight text-primary"
        aria-hidden="true"
      >
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="font-bold text-foreground">{label}</span>
        <div className="text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

/** Icon card (layout v2 §4.4): tinted icon tile, serif title, short text. */
export function IconCard({
  icon: Icon,
  title,
  text,
  tint = 0,
  className,
}: {
  icon: IconComponent
  title: string
  text?: ReactNode
  tint?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full flex-col gap-3 rounded-card border border-border bg-surface p-6 shadow-card',
        className,
      )}
    >
      <span
        className={cn(
          'inline-flex size-12 items-center justify-center rounded-xl',
          TINTS[tint % TINTS.length],
        )}
        aria-hidden="true"
      >
        <Icon className="size-6" strokeWidth={1.75} />
      </span>
      <h3 className="text-[22px] leading-tight">{title}</h3>
      {text && <div className="text-small text-muted-foreground">{text}</div>}
    </div>
  )
}

/** White card that frames an FAQ list, table, form or long text. */
export function Panel({
  children,
  className,
  ...marker
}: {
  children: ReactNode
  className?: string
  'data-unverified'?: ''
}) {
  return (
    <div
      {...marker}
      className={cn(
        'rounded-card border border-border bg-surface p-5 shadow-card md:p-8',
        className,
      )}
    >
      {children}
    </div>
  )
}
