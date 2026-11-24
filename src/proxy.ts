import { NextResponse, type NextRequest } from 'next/server'

import { routeKeyForSlug, routes } from './i18n/config'

/**
 * Language routing (spec §3.1 / §3.2, F-08):
 *  - English is the default and has no prefix:  /pool      → app/(frontend)/[locale=en]/pool
 *  - Indonesian lives under /id with its own slugs: /id/bistro-coffee → [locale=id]/dining
 *  - /en/... redirects to the unprefixed URL, and /id/<english-slug> redirects to the Indonesian slug.
 *  - No automatic redirect based on browser language or location, so both versions stay indexable.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const segments = pathname.split('/').filter(Boolean)
  const [first, slug = '', ...rest] = segments
  const tail = rest.length ? `/${rest.join('/')}` : ''

  const redirect = (to: string) => NextResponse.redirect(new URL(`${to}${search}`, request.url), 308)
  const rewrite = (to: string) => NextResponse.rewrite(new URL(`${to}${search}`, request.url))

  // Spec §3.2: the language switcher stores the visitor's choice in NEXT_LOCALE. Someone who chose
  // Indonesian and comes back to the home page lands on /id. Only real page loads are redirected
  // (not Next.js prefetch/RSC requests), and crawlers send no cookie, so both versions stay indexable.
  // (Next.js strips its own RSC headers before the proxy runs, so use the browser's fetch metadata.)
  const dest = request.headers.get('sec-fetch-dest')
  const isPageLoad = dest ? dest === 'document' : (request.headers.get('accept') ?? '').includes('text/html')
  if (segments.length === 0 && isPageLoad && request.cookies.get('NEXT_LOCALE')?.value === 'id') {
    return NextResponse.redirect(new URL(`/id${search}`, request.url), 307)
  }

  if (first === 'en') {
    return redirect(`/${segments.slice(1).join('/')}`)
  }

  if (first === 'id') {
    const idKey = routeKeyForSlug('id', slug)
    if (idKey) return rewrite(`/id/${routes[idKey].en}${tail}`.replace(/\/$/, '') || '/id')
    const enKey = routeKeyForSlug('en', slug)
    if (enKey) return redirect(`/id/${routes[enKey].id}${tail}`)
    return NextResponse.next()
  }

  return rewrite(`/en${pathname === '/' ? '' : pathname}`)
}

export const config = {
  // Skip Payload admin/API, private invoice links, Next internals, uploaded media and any file with an extension.
  matcher: ['/((?!admin|api|invoice/|_next|media|.*\\..*).*)'],
}
