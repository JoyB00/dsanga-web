import { formatRupiah } from '@/lib/format'

/** Amounts in admin lists: Rp350.000 instead of 350000. */
export function RupiahCell({ cellData }: { cellData?: number | null }) {
  return <span>{cellData ? formatRupiah(cellData) : '–'}</span>
}
