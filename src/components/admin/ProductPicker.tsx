'use client'

import { FieldLabel, useForm, useFormFields } from '@payloadcms/ui'
import { useEffect, useId, useState } from 'react'

import type { PriceListItem } from '@/endpoints/orders'
import { formatRupiah } from '@/lib/format'

const CATEGORY: Record<string, string> = {
  pool: 'Pool',
  work: 'Work & Space',
  activity: 'Aktivitas',
  event: 'Event',
  venue: 'Paket tempat acara',
  offer: 'Promo',
}

/** One request per language, shared by all rows. */
const cache = new Map<string, Promise<PriceListItem[]>>()
const load = (locale: string) => {
  if (!cache.has(locale)) {
    const request = fetch(`/api/orders/price-list?locale=${locale}`, { credentials: 'include' }).then(async (res) => {
      if (!res.ok) throw new Error(String(res.status))
      return ((await res.json()) as { items: PriceListItem[] }).items
    })
    request.catch(() => cache.delete(locale))
    cache.set(locale, request)
    setTimeout(() => cache.delete(locale), 60_000) // prices may change while the admin panel stays open
  }
  return cache.get(locale)!
}

/** Fills description, unit and price of an order row from the product list. Everything stays editable. */
export function ProductPicker({ path }: { path: string }) {
  const id = useId()
  const row = path.replace(/\.[^.]+$/, '')
  const { dispatchFields, setModified } = useForm()
  const language = useFormFields(([fields]) => fields.language?.value as string | undefined) ?? 'id'
  const [items, setItems] = useState<PriceListItem[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    load(language).then(
      (list) => active && (setItems(list), setFailed(false)),
      () => active && setFailed(true),
    )
    return () => {
      active = false
    }
  }, [language])

  const pick = (key: string) => {
    const item = items?.find((i) => i.key === key)
    if (!item) return
    const set = (name: string, value: unknown) =>
      dispatchFields({ type: 'UPDATE', path: `${row}.${name}`, value, valid: true })
    set('description', item.description)
    set('unit', item.unit)
    set('category', item.category)
    if (item.unitPrice != null) set('unitPrice', item.unitPrice)
    setModified(true)
  }

  const groups = [...new Set((items ?? []).map((i) => i.category))]
  return (
    <div className="field-type" style={{ marginBottom: 'var(--base)' }}>
      <FieldLabel htmlFor={id} label="Pilih dari daftar produk" />
      <select
        id={id}
        value=""
        disabled={!items}
        onChange={(e) => pick(e.target.value)}
        style={{
          width: '100%',
          minHeight: 40,
          padding: '0 12px',
          borderRadius: 'var(--style-radius-s)',
          border: '1px solid var(--theme-elevation-150)',
          background: 'var(--theme-input-bg)',
          color: 'var(--theme-elevation-800)',
        }}
      >
        <option value="">
          {failed ? 'Daftar produk gagal dimuat. Isi keterangan dan harga secara manual.' : items ? 'Pilih produk…' : 'Memuat…'}
        </option>
        {groups.map((group) => (
          <optgroup key={group} label={CATEGORY[group] ?? group}>
            {items!
              .filter((i) => i.category === group)
              .map((i) => (
                <option key={i.key} value={i.key}>
                  {i.label}
                  {i.unitPrice == null ? ' — isi harga' : ` — ${formatRupiah(i.unitPrice)}`}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </div>
  )
}
