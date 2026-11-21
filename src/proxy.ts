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
  // Skip Payload admin/API, Next internals, uploaded media and any file with an extension.
  matcher: ['/((?!admin|api|_next|media|.*\\..*).*)'],
}
