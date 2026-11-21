import type { ComponentType, ReactNode } from 'react'

type IconComponent = ComponentType<{ className?: string; strokeWidth?: number }>

/** Quick-info card: icon circle + label + value (Pool "information strip", Visit Us details). */
export function InfoCard({ icon: Icon, label, children }: { icon: IconComponent; label: string; children: ReactNode }) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <span className="icon-circle size-12" aria-hidden="true">
        <Icon className="size-[22px]" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-bold text-foreground">{label}</span>
        <div className="text-body text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}
