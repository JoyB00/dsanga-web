'use client'

import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { href, routeKeyFromPathname, type Locale, type RouteKey } from '../i18n/config'
import { cn } from '../lib/cn'
import { LanguageSwitcher } from './LanguageSwitcher'

const MAIN_NAV: RouteKey[] = [
  'home',
  'about',
  'pool',
  'dining',
  'workSpace',
  'activities',
  'events',
  'visit',
]
/** The mobile panel adds Gallery, Offers and Contact (spec §3.2). */
const MOBILE_EXTRA: RouteKey[] = ['gallery', 'offers', 'contact']

type Props = {
  locale: Locale
  navLabels: Record<RouteKey, string>
  brandTagline: string
  switchToLabel: string
  menuLabels: { open: string; close: string }
  /** F-15 staging banner (SHOW_TEMP_MARKERS), shown above the pill. */
  stagingNotice?: string
}

/**
 * Layout v2 §4.1: floating pill header, frosted over the hero, sticky with a stronger shadow once
 * scrolled. On phones a menu button opens a panel; Escape closes it and returns focus to the button.
 */
export function SiteHeader({
  locale,
  navLabels,
  brandTagline,
  switchToLabel,
  menuLabels,
  stagingNotice,
}: Props) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const current = routeKeyFromPathname(usePathname() ?? '/')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        button.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const link = (key: RouteKey, variant: 'desktop' | 'mobile') => (
    <Link
      key={key}
      href={href(key, locale)}
      onClick={variant === 'mobile' ? () => setOpen(false) : undefined}
      aria-current={key === current ? 'page' : undefined}
      className={cn(
        'no-underline transition-colors',
        variant === 'desktop'
          ? 'rounded-full px-3 py-2 text-small font-bold'
          : 'flex min-h-touch items-center rounded-2xl px-4 text-body font-bold',
        key === current
          ? 'bg-highlight text-primary'
          : 'text-foreground hover:bg-highlight/70 hover:text-primary',
      )}
    >
      {navLabels[key]}
    </Link>
  )

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-3 md:pt-4">
      {stagingNotice && (
        <p className="-mx-4 -mt-3 mb-2 bg-warm px-4 py-1.5 text-center text-caption font-bold text-on-warm md:-mt-4">
          {stagingNotice}
        </p>
      )}
      <div
        className={cn(
          'glass mx-auto flex max-w-content items-center gap-6 rounded-[28px] py-2 pr-2 pl-5 transition-shadow md:pl-6',
          scrolled || open
            ? 'shadow-[0_10px_30px_rgb(31_42_36/0.16)]'
            : 'shadow-[0_4px_16px_rgb(31_42_36/0.08)]',
        )}
      >
        <Link href={href('home', locale)} className="flex flex-col py-1 leading-tight no-underline">
          <span className="text-lg font-extrabold tracking-[0.08em] text-primary">D’SANGA</span>
          <span className="text-[10px] font-bold tracking-[0.16em] whitespace-nowrap text-accent-text uppercase">
            {brandTagline}
          </span>
        </Link>

        <nav aria-label="Main" className="hidden flex-1 justify-center gap-1 lg:flex">
          {MAIN_NAV.map((key) => link(key, 'desktop'))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitcher locale={locale} label={switchToLabel} />
          <button
            ref={button}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex size-11 items-center justify-center rounded-full bg-primary text-on-primary lg:hidden"
          >
            {open ? (
              <X className="size-5" aria-hidden="true" />
            ) : (
              <Menu className="size-5" aria-hidden="true" />
            )}
            <span className="sr-only">{open ? menuLabels.close : menuLabels.open}</span>
          </button>
        </div>
      </div>

      <nav
        id="mobile-menu"
        aria-label="Mobile"
        hidden={!open}
        className="glass mx-auto mt-2 max-h-[calc(100dvh-6rem)] max-w-content overflow-y-auto rounded-[24px] p-3 shadow-[0_10px_30px_rgb(31_42_36/0.16)] lg:hidden"
      >
        <ul className="grid gap-1 sm:grid-cols-2">
          {[...MAIN_NAV, ...MOBILE_EXTRA].map((key) => (
            <li key={key}>{link(key, 'mobile')}</li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
