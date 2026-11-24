import type { Locale } from '@/i18n/config'
import { priceText } from '@/lib/price'
import type { Experience } from '@/payload-types'

type Row = NonNullable<Experience['prices']>[number]

/** Ticket / rate table. Scrolls inside its own box on small screens (spec §8). */
export function PriceTable({
  rows: all,
  labels,
  locale,
}: {
  rows: Row[]
  locale: Locale
  labels: { item: string; weekday: string; weekend: string }
}) {
  const rows = all.map((row) => ({
    ...row,
    weekday: priceText(row, 'weekday', locale),
    weekend: priceText(row, 'weekend', locale),
  }))
  // Hidden prices (Show price off) never reach the page, so there is nothing to list.
  if (!rows.some((r) => r.weekday || r.weekend)) return null
  const hasWeekend = rows.some((r) => r.weekend)
  return (
    // Focusable so keyboard users can scroll it when it is wider than the screen (WCAG 2.1.1).
    <div
      tabIndex={0}
      role="region"
      aria-label={labels.item}
      className="overflow-x-auto rounded-card bg-surface shadow-card"
    >
      <table className="tabular-nums w-full min-w-[22rem] border-collapse text-left text-body">
        <thead>
          <tr className="border-b-2 border-primary">
            <th scope="col" className="px-4 py-3 font-bold">
              {labels.item}
            </th>
            <th scope="col" className="px-4 py-3 font-bold">
              {labels.weekday}
            </th>
            {hasWeekend && (
              <th scope="col" className="px-4 py-3 font-bold">
                {labels.weekend}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id ?? row.label} className="border-b border-border last:border-0">
              <th scope="row" className="px-4 py-3 font-semibold">
                {row.label}
              </th>
              <td className="px-4 py-3">
                {row.weekday}
                {row.unit && row.weekday && (
                  <span className="text-small text-muted-foreground"> {row.unit}</span>
                )}
              </td>
              {hasWeekend && <td className="px-4 py-3">{row.weekend || '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
