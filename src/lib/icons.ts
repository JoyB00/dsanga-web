import { CalendarDays, Coffee, Heart, House, Leaf, Sparkles, Users, UtensilsCrossed, Waves, type LucideIcon } from 'lucide-react'

import type { IconName } from '../fields/icons'

/** Maps the CMS icon choice (fields/icons.ts) to a Lucide icon. */
export const ICONS: Record<IconName, LucideIcon> = {
  leaf: Leaf,
  users: Users,
  house: House,
  calendar: CalendarDays,
  heart: Heart,
  waves: Waves,
  utensils: UtensilsCrossed,
  coffee: Coffee,
  sparkles: Sparkles,
}

export const iconFor = (name?: string | null): LucideIcon => ICONS[(name as IconName) ?? 'leaf'] ?? Leaf
