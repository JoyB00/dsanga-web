import Link from 'next/link'

import type { SiteSetting } from '../payload-types'
import { href, type Locale, type RouteKey } from '../i18n/config'
import { getDictionary } from '../i18n/dictionaries'

const EXPLORE: RouteKey[] = ['pool', 'dining', 'workSpace', 'activities', 'events']
const INFO: RouteKey[] = ['about', 'gallery', 'offers', 'visit', 'contact', 'privacy']

export function SiteFooter({ locale, settings }: { locale: Locale; settings: SiteSetting | null }) {
  const t = getDictionary(locale)
  const year = new Date().getFullYear()

  return (
    <footer className="bg-primary text-background">
      <div className="container-content grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-2 text-small">
          <span className="text-xl font-extrabold tracking-[0.08em]">D’SANGA</span>
          <span className="text-[10px] font-bold tracking-[0.16em] text-accent-on-dark uppercase">{t.brandTagline}</span>
          {settings?.address && <p className="mt-2 whitespace-pre-line">{settings.address}</p>}
          <p>{t.footer.managedBy}</p>
        </div>
        {[
          { title: t.footer.explore, keys: EXPLORE },
          { title: t.footer.information, keys: INFO },
        ].map((group) => (
          <nav key={group.title} aria-label={group.title} className="flex flex-col text-body">
            <span className="mb-1 text-caption font-bold tracking-[0.14em] text-accent-on-dark uppercase">{group.title}</span>
            {group.keys.map((key) => (
              <Link key={key} href={href(key, locale)} className="block py-2 text-background no-underline hover:underline">
                {t.nav[key]}
              </Link>
            ))}
          </nav>
        ))}
        <div className="flex flex-col gap-2 text-small">
          <span className="mb-1 text-caption font-bold tracking-[0.14em] text-accent-on-dark uppercase">{t.footer.contact}</span>
          {settings?.email && <a className="text-background" href={`mailto:${settings.email}`}>{settings.email}</a>}
          {settings?.serviceHours && <p>{settings.serviceHours}</p>}
        </div>
      </div>
      <div className="border-t border-background/20">
        <p className="container-content py-5 text-caption">© {year} D’Sanga · Desa Sukawati</p>
      </div>
    </footer>
  )
}
