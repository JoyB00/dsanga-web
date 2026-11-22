'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useId, useRef, useState, useSyncExternalStore } from 'react'

import { routeKeyFromPathname, type Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { CONSENT_COOKIE, COOKIE_SETTINGS_EVENT } from '@/lib/analytics'

/**
 * GA4 + cookie consent (spec §9 analytics, §10 compliance).
 *
 * - Nothing from Google loads until the visitor presses "Accept analytics". Declining is one click,
 *   with the same weight as accepting. The choice is kept for 6 months in `dsanga_consent`.
 * - Page views are sent manually with a `site_language` parameter (en / id), so in GA4 turn off
 *   Enhanced measurement › "Page changes based on browser history events" and "Form interactions".
 * - Events: whatsapp_click (context = topic or page), map_click, cta_click, generate_lead (form).
 */
type Consent = 'granted' | 'denied' | 'unset'

const MAX_AGE = 60 * 60 * 24 * 180
const listeners = new Set<() => void>()

const readConsent = (): Consent => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${CONSENT_COOKIE}=(granted|denied)`))
  return (match?.[1] as Consent) ?? 'unset'
}

const writeConsent = (value: Exclude<Consent, 'unset'>) => {
  const secure = location.protocol === 'https:' ? '; secure' : ''
  document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${MAX_AGE}; samesite=lax${secure}`
  listeners.forEach((notify) => notify())
}

const subscribe = (notify: () => void) => {
  listeners.add(notify)
  return () => listeners.delete(notify)
}

/** Remove Google Analytics cookies after consent is withdrawn. */
const clearGaCookies = () => {
  const host = location.hostname
  const domains = ['', host, `.${host.replace(/^www\./, '')}`]
  document.cookie
    .split('; ')
    .map((c) => c.split('=')[0])
    .filter((name) => name === '_ga' || name.startsWith('_ga_'))
    .forEach((name) =>
      domains.forEach((domain) => {
        document.cookie = `${name}=; path=/; max-age=0${domain ? `; domain=${domain}` : ''}`
      }),
    )
}

const loadGtag = (gaId: string) => {
  if (window.gtag) {
    window.gtag('consent', 'update', { analytics_storage: 'granted' })
    return
  }
  window.dataLayer = window.dataLayer || []
  // gtag.js expects the Arguments object itself, not an array.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('consent', 'default', {
    analytics_storage: 'granted',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  })
  window.gtag('js', new Date())
  window.gtag('config', gaId, { send_page_view: false })
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`
  document.head.appendChild(script)
}

const WHATSAPP = /^https:\/\/(wa\.me|api\.whatsapp\.com)\//
const MAPS = /(google\.[a-z.]+\/maps|maps\.google\.|maps\.app\.goo\.gl|goo\.gl\/maps)/

type Props = { gaId: string; locale: Locale; t: Dictionary['cookies']; privacyHref: string }

export function Analytics({ gaId, locale, t, privacyHref }: Props) {
  // Server and first client render: "pending" (no banner), so hydration always matches.
  const consent = useSyncExternalStore<Consent | 'pending'>(subscribe, readConsent, () => 'pending')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const pathname = usePathname()
  const titleId = useId()
  const firstButton = useRef<HTMLButtonElement>(null)

  // Footer "Cookie settings" re-opens the banner.
  useEffect(() => {
    const open = () => {
      setSettingsOpen(true)
      requestAnimationFrame(() => firstButton.current?.focus())
    }
    window.addEventListener(COOKIE_SETTINGS_EVENT, open)
    return () => window.removeEventListener(COOKIE_SETTINGS_EVENT, open)
  }, [])

  useEffect(() => {
    if (consent === 'granted') loadGtag(gaId)
  }, [consent, gaId])

  // One page_view per visited URL, tagged with the site language. After a client-side navigation
  // Next.js sets the new <title> slightly later, and switching language re-renders twice, so wait
  // briefly for the title and skip a URL that was just sent.
  const lastSent = useRef<{ href: string; title: string } | null>(null)
  useEffect(() => {
    if (consent !== 'granted') return
    const started = Date.now()
    let timer: ReturnType<typeof setTimeout>
    const send = () => {
      if (lastSent.current?.href === location.href) return
      const titleReady = Boolean(document.title) && document.title !== lastSent.current?.title
      if (!titleReady && Date.now() - started < 2000) {
        timer = setTimeout(send, 100)
        return
      }
      lastSent.current = { href: location.href, title: document.title }
      window.gtag?.('event', 'page_view', {
        page_location: location.href,
        page_path: location.pathname,
        page_title: document.title,
        site_language: locale,
      })
    }
    timer = setTimeout(send, 50)
    return () => clearTimeout(timer)
  }, [consent, pathname, locale])

  // Click events from links anywhere on the page (no per-button wiring needed).
  useEffect(() => {
    if (consent !== 'granted') return
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest?.('a')
      if (!link || !window.gtag) return
      const url = link.getAttribute('href') ?? ''
      const page = routeKeyFromPathname(location.pathname)
      const placement = link.closest('header') ? 'header' : link.closest('footer') ? 'footer' : 'page'
      const base = { site_language: locale, page, placement }
      if (link.dataset.track === 'whatsapp_click' || WHATSAPP.test(url)) {
        window.gtag('event', 'whatsapp_click', { ...base, context: link.dataset.topic || page })
      } else if (link.dataset.track === 'map_click' || MAPS.test(url)) {
        window.gtag('event', 'map_click', base)
      } else if (link.matches('.btn-primary, .btn-outline, .btn-link, [data-track="cta_click"]')) {
        window.gtag('event', 'cta_click', {
          ...base,
          cta_label: (link.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 100),
          link_url: url,
        })
      }
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [consent, locale])

  const choose = (value: 'granted' | 'denied') => {
    if (value === 'denied') {
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' })
      clearGaCookies()
    }
    writeConsent(value)
    setSettingsOpen(false)
  }

  if (consent === 'pending' || (consent !== 'unset' && !settingsOpen)) return null

  return (
    <section
      aria-labelledby={titleId}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="card pointer-events-auto mx-auto flex max-w-3xl flex-col gap-4 p-5 shadow-raised sm:flex-row sm:items-center sm:gap-6">
        <div className="flex flex-1 flex-col gap-1">
          <p id={titleId} className="text-body font-bold">
            {t.title}
          </p>
          <p className="text-small text-muted-foreground">
            {t.text}{' '}
            <Link href={privacyHref} className="font-semibold">
              {t.more}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <button ref={firstButton} type="button" className="btn-outline" onClick={() => choose('denied')}>
            {t.decline}
          </button>
          <button type="button" className="btn-primary" onClick={() => choose('granted')}>
            {t.accept}
          </button>
        </div>
      </div>
    </section>
  )
}

/** Footer link that re-opens the cookie banner. */
export function CookieSettingsButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))}
      className="min-h-touch text-caption text-background underline underline-offset-2"
    >
      {label}
    </button>
  )
}
