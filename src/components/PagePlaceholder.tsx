import type { Locale, RouteKey } from '../i18n/config'
import { getDictionary } from '../i18n/dictionaries'

/** Temporary page body until each page from the wireframes is built. */
export function PagePlaceholder({ locale, routeKey }: { locale: Locale; routeKey: RouteKey }) {
  const t = getDictionary(locale)
  return (
    <section className="section">
      <div className="container-content flex flex-col gap-4">
        <span className="eyebrow">D’Sanga</span>
        <h1>{t.nav[routeKey]}</h1>
        <p className="max-w-prose text-body-lg text-muted-foreground">{t.comingNext}</p>
      </div>
    </section>
  )
}
