import type { Experience } from '@/payload-types'

type Row = NonNullable<Experience['prices']>[number]

/** Ticket / rate table. Scrolls inside its own box on small screens (spec §8). */
export function PriceTable({
  rows,
  labels,
}: {
  rows: Row[]
  labels: { item: string; weekday: string; weekend: string }
}) {
  if (!rows.length) return null
  const hasWeekend = rows.some((r) => r.weekend)
  return (
    <div className="overflow-x-auto rounded-card bg-surface shadow-card">
      <table className="w-full min-w-[22rem] border-collapse text-left text-body">
        <thead>
          <tr className="border-b-2 border-primary">
            <th scope="col" className="px-4 py-3 font-bold">{labels.item}</th>
            <th scope="col" className="px-4 py-3 font-bold">{labels.weekday}</th>
            {hasWeekend && <th scope="col" className="px-4 py-3 font-bold">{labels.weekend}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id ?? row.label} className="border-b border-border last:border-0">
              <th scope="row" className="px-4 py-3 font-semibold">{row.label}</th>
              <td className="px-4 py-3">
                {row.weekday}
                {row.unit && row.weekday && <span className="text-small text-muted-foreground"> {row.unit}</span>}
              </td>
              {hasWeekend && <td className="px-4 py-3">{row.weekend ?? '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
