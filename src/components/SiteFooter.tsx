import { Mail, MapPin } from 'lucide-react'
import Link from 'next/link'

import type { SiteSetting } from '../payload-types'
import { href, type Locale, type RouteKey } from '../i18n/config'
import { getDictionary } from '../i18n/dictionaries'
import { whatsappUrl } from '../lib/whatsapp'
import { CookieSettingsButton } from './Analytics'
import { WhatsAppIcon } from './WhatsAppIcon'
import { temp } from '@/lib/verification'

const COLUMNS: { key: 'explore' | 'information'; pages: RouteKey[] }[] = [
  { key: 'explore', pages: ['home', 'pool', 'dining', 'workSpace', 'activities', 'events'] },
  { key: 'information', pages: ['about', 'gallery', 'offers', 'visit', 'contact', 'privacy'] },
]

type Props = {
  locale: Locale
  settings: SiteSetting | null
  description?: string | null
  analyticsEnabled?: boolean
}

/** Layout v2 §4.7: dark footer, four columns on desktop (two link columns side by side on phones). */
export function SiteFooter({ locale, settings, description, analyticsEnabled }: Props) {
  const t = getDictionary(locale)
  const wa = whatsappUrl(settings?.whatsappNumber, locale)
  const iconWrap =
    'inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-accent-on-dark/15 text-accent-on-dark'

  return (
    <footer className="bg-foreground text-white/80">
      <div className="container-content grid grid-cols-2 gap-x-6 gap-y-10 py-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,2fr)_minmax(0,2fr)_minmax(0,3fr)]">
        <div {...temp(settings)} className="col-span-2 flex flex-col gap-4 lg:col-span-1">
          <div>
            <p className="text-2xl font-extrabold tracking-[0.08em] text-white">D’SANGA</p>
            <p className="text-[11px] font-bold tracking-[0.18em] text-accent-on-dark uppercase">
              {t.brandTagline}
            </p>
            {description && <p className="mt-3 max-w-md text-small">{description}</p>}
          </div>
          <ul className="flex flex-col gap-3 border-t border-white/10 pt-4 text-small">
            {wa && (
              <li>
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-track="whatsapp_click"
                  className="flex items-center gap-3 text-white no-underline hover:text-accent-on-dark"
                >
                  <span className={iconWrap}>
                    <WhatsAppIcon className="size-4" />
                  </span>
                  WhatsApp
                </a>
              </li>
            )}
            {settings?.email && (
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center gap-3 text-white no-underline hover:text-accent-on-dark"
                >
                  <span className={iconWrap}>
                    <Mail className="size-4" aria-hidden="true" />
                  </span>
                  {settings.email}
                </a>
              </li>
            )}
            {settings?.address && (
              <li className="flex items-start gap-3 text-white">
                <span className={iconWrap}>
                  <MapPin className="size-4" aria-hidden="true" />
                </span>
                <span className="pt-1.5 whitespace-pre-line">{settings.address}</span>
              </li>
            )}
            {settings?.serviceHours && <li className="pl-11">{settings.serviceHours}</li>}
          </ul>
        </div>
        {COLUMNS.map((col) => (
          <nav key={col.key} aria-label={t.footer[col.key]}>
            <h2 className="mb-4 font-sans text-small font-extrabold tracking-[0.14em] text-white uppercase">
              {t.footer[col.key]}
            </h2>
            <ul className="flex flex-col gap-1">
              {col.pages.map((key) => (
                <li key={key}>
                  <Link
                    href={href(key, locale)}
                    className="inline-flex min-h-9 items-center text-small text-white/80 no-underline hover:text-accent-on-dark"
                  >
                    {t.nav[key]}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="col-span-2 lg:col-span-1">
          <h2 className="mb-4 font-sans text-small font-extrabold tracking-[0.14em] text-white uppercase">
            {t.footer.motto}
          </h2>
          <p className="font-display-italic rounded-card border border-white/10 bg-white/5 p-5 text-[22px] leading-snug text-accent-on-dark">
            {t.footer.mottoText}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-content flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3 text-caption text-white/70">
          <p className="py-2">
            © {new Date().getFullYear()} D’Sanga · {t.footer.managedBy}
          </p>
          <div className="flex flex-wrap items-center gap-x-6">
            {analyticsEnabled && <CookieSettingsButton label={t.cookies.settings} />}
            <p className="py-2">{t.footer.partOf}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
