import Link from 'next/link'

import { href, type Locale, type RouteKey } from '../i18n/config'
import { getDictionary } from '../i18n/dictionaries'
import { whatsappUrl } from '../lib/whatsapp'
import { LanguageSwitcher } from './LanguageSwitcher'
import { NavLinks } from './NavLinks'
import { WhatsAppIcon } from './WhatsAppIcon'

const MAIN_NAV: RouteKey[] = ['home', 'about', 'pool', 'dining', 'workSpace', 'activities', 'events', 'visit']
/** Mobile drawer adds Gallery, Offers and Contact (spec §3.2). */
const MOBILE_EXTRA: RouteKey[] = ['gallery', 'offers', 'contact']

export function SiteHeader({ locale, whatsappNumber }: { locale: Locale; whatsappNumber?: string | null }) {
  const t = getDictionary(locale)
  const wa = whatsappUrl(whatsappNumber, locale)

  return (
    <header className="border-b border-border bg-surface">
      <div className="container-content flex flex-wrap items-center gap-x-8 gap-y-3 py-4">
        <Link href={href('home', locale)} className="flex flex-col leading-tight no-underline">
          <span className="text-xl font-extrabold tracking-[0.08em] text-primary">D’SANGA</span>
          <span className="text-[10px] font-bold tracking-[0.16em] text-accent-text uppercase">{t.brandTagline}</span>
        </Link>

        <nav aria-label="Main" className="hidden flex-1 flex-wrap justify-center gap-x-6 lg:flex">
          <NavLinks variant="desktop" items={MAIN_NAV.map((key) => ({ key, label: t.nav[key], href: href(key, locale) }))} />
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <LanguageSwitcher locale={locale} label={t.language.switchTo} />
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-primary">
              <WhatsAppIcon />
              <span className="hidden sm:inline">{t.cta.contactUs}</span>
              <span className="sr-only sm:hidden">{t.cta.contactUs}</span>
            </a>
          )}
        </div>

        <details className="w-full lg:hidden">
          <summary className="btn-outline w-full cursor-pointer list-none">{t.menu}</summary>
          <nav aria-label="Mobile" className="mt-2 flex flex-col">
            <NavLinks
              variant="mobile"
              items={[...MAIN_NAV, ...MOBILE_EXTRA].map((key) => ({ key, label: t.nav[key], href: href(key, locale) }))}
            />
          </nav>
        </details>
      </div>
    </header>
  )
}
