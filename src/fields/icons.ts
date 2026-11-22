import type { Field } from 'payload'

/** Icon choices editors can pick for value/feature lists (rendered with Lucide on the site). */
export const ICON_OPTIONS = [
  { value: 'leaf', label: 'Leaf (nature)' },
  { value: 'users', label: 'People (community)' },
  { value: 'house', label: 'House (family / culture)' },
  { value: 'calendar', label: 'Calendar (events)' },
  { value: 'heart', label: 'Heart' },
  { value: 'waves', label: 'Waves (pool)' },
  { value: 'utensils', label: 'Utensils (food)' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'sparkles', label: 'Sparkles' },
] as const

export type IconName = (typeof ICON_OPTIONS)[number]['value']

export const iconField = (name = 'icon'): Field => ({
  name,
  type: 'select',
  defaultValue: 'leaf',
  options: [...ICON_OPTIONS],
})
