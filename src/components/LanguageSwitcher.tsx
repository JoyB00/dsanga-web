'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { href, routeKeyFromPathname, type Locale } from '../i18n/config'

/** Switches to the same page in the other language (spec §3.2). Remembers the choice in a cookie. */
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() ?? '/'
  const target: Locale = locale === 'en' ? 'id' : 'en'
  const to = href(routeKeyFromPathname(pathname), target)

  return (
    <div className="flex items-center gap-1 text-small">
      <span aria-current="true" className="inline-flex min-h-touch min-w-touch items-center justify-center font-bold">
        {locale.toUpperCase()}
      </span>
      <span aria-hidden="true" className="text-muted-foreground">
        |
      </span>
      <Link
        href={to}
        hrefLang={target}
        // No prefetch: the cookie must be set (on click) before the target page is requested.
        prefetch={false}
        lang={target}
        onClick={() => {
          document.cookie = `NEXT_LOCALE=${target}; path=/; max-age=31536000; samesite=lax`
        }}
        className="inline-flex min-h-touch min-w-touch items-center justify-center font-semibold text-muted-foreground no-underline hover:text-primary"
      >
        {/* Visible code + full language name for screen readers: "ID, Bahasa Indonesia" (WCAG 2.5.3). */}
        {target.toUpperCase()}
        <span className="sr-only">, {label}</span>
      </Link>
    </div>
  )
}
