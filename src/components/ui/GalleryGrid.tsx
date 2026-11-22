'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'

import { cn } from '@/lib/cn'

export type GalleryItem = {
  id: number | string
  src: string
  thumb: string
  alt: string
  caption?: string | null
  category?: string | null
  /** F-15 staging marker, computed on the server. */
  marker?: { 'data-unverified'?: '' }
}

type Strings = {
  filterLabel: string
  all: string
  categories: Record<string, string>
  open: string
  close: string
  previous: string
  next: string
  of: string
}

/**
 * F-04 gallery: category filter + lightbox. The lightbox is a native <dialog>, which traps focus
 * and closes on Esc; ← / → move between photos.
 */
export function GalleryGrid({ items, t }: { items: GalleryItem[]; t: Strings }) {
  const [filter, setFilter] = useState<string>('all')
  const [index, setIndex] = useState<number | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  const categories = useMemo(
    () => Object.keys(t.categories).filter((key) => items.some((item) => item.category === key)),
    [items, t.categories],
  )
  const visible = useMemo(() => (filter === 'all' ? items : items.filter((i) => i.category === filter)), [items, filter])
  const current = index === null ? null : visible[index]

  const open = (i: number) => {
    setIndex(i)
    dialog.current?.showModal()
  }
  const close = useCallback(() => dialog.current?.close(), [])
  const step = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + visible.length) % visible.length)),
    [visible.length],
  )

  useEffect(() => {
    const el = dialog.current
    if (!el) return
    const onClose = () => setIndex(null)
    el.addEventListener('close', onClose)
    return () => el.removeEventListener('close', onClose)
  }, [])

  const onDialogKey = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'ArrowRight') step(1)
    else if (e.key === 'ArrowLeft') step(-1)
  }

  return (
    <div className="flex flex-col gap-6">
      {categories.length > 1 && (
        <div role="group" aria-label={t.filterLabel} className="flex flex-wrap gap-2">
          {['all', ...categories].map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={cn(
                'min-h-touch cursor-pointer rounded-full border-2 px-5 text-small font-bold transition-colors',
                filter === key
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-input-border bg-surface text-foreground hover:border-primary',
              )}
            >
              {key === 'all' ? t.all : t.categories[key]}
            </button>
          ))}
        </div>
      )}

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {visible.map((item, i) => (
          <li key={item.id} {...item.marker}>
            <button
              type="button"
              onClick={() => open(i)}
              aria-label={`${t.open}: ${item.alt}`}
              className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-card bg-placeholder"
            >
              <Image
                src={item.thumb}
                alt=""
                fill
                loading={i < 4 ? 'eager' : 'lazy'}
                sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none"
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onKeyDown={onDialogKey}
        onClick={(e) => e.target === dialog.current && close()}
        aria-label={current?.alt}
        className="m-auto h-[min(92dvh,56rem)] w-[min(96vw,80rem)] max-w-none rounded-card bg-foreground/95 p-0 text-white backdrop:bg-black/70"
      >
        {current && (
          <div className="flex h-full flex-col gap-3 p-4 md:p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="text-small">
                {(index ?? 0) + 1} {t.of} {visible.length}
                {current.category ? ` · ${t.categories[current.category] ?? ''}` : ''}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label={t.close}
                className="inline-flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/40 hover:bg-white/10"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 items-center gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={t.previous}
                className="hidden size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/40 hover:bg-white/10 sm:inline-flex"
              >
                <ChevronLeft className="size-6" aria-hidden="true" />
              </button>
              <div className="relative h-full flex-1">
                {/* key: remount per photo so the previous image never shows under a new caption */}
                <Image key={current.src} src={current.src} alt={current.alt} fill sizes="90vw" className="object-contain" />
              </div>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={t.next}
                className="hidden size-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/40 hover:bg-white/10 sm:inline-flex"
              >
                <ChevronRight className="size-6" aria-hidden="true" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-small text-white/85">{current.caption || current.alt}</p>
              <div className="flex gap-2 sm:hidden">
                <button type="button" onClick={() => step(-1)} aria-label={t.previous} className="inline-flex size-11 items-center justify-center rounded-full border border-white/40">
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </button>
                <button type="button" onClick={() => step(1)} aria-label={t.next} className="inline-flex size-11 items-center justify-center rounded-full border border-white/40">
                  <ChevronRight className="size-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </div>
  )
}
