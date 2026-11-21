import { Clock, Mail } from 'lucide-react'
import type { Metadata } from 'next'

import { WhatsAppIcon } from '@/components/WhatsAppIcon'
import { InquiryForm } from '@/components/ui/InquiryForm'
import { PageHeader } from '@/components/ui/PageHero'
import { Section } from '@/components/ui/Section'
import { SocialIcon } from '@/components/ui/SocialIcon'
import { WhatsAppNotice } from '@/components/ui/WhatsAppButton'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getSiteSettings } from '@/lib/payload'
import { whatsappUrl } from '@/lib/whatsapp'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary(await localeFromParams(params))
  return { title: t.contact.title, description: t.contact.intro }
}

const displayNumber = (digits: string) => `+${digits.replace(/^(\d{2})(\d{3})(\d{4})(\d+)$/, '$1 $2-$3-$4')}`

export default async function ContactPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const settings = await getSiteSettings(locale).catch(() => null)

  const waDigits = (settings?.whatsappNumber ?? '').replace(/\D/g, '')
  const wa = whatsappUrl(waDigits, locale)
  const socials = (['instagram', 'facebook', 'tiktok'] as const)
    .map((network) => ({ network, url: settings?.social?.[network] }))
    .filter((s): s is { network: typeof s.network; url: string } => Boolean(s.url))

  return (
    <>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: t.contact.title }]}
        title={t.contact.title}
        intro={t.contact.intro}
      />

      <section className="pb-section-mobile md:pb-section">
        <ul className="container-content grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {wa && (
            <li>
              <a href={wa} target="_blank" rel="noopener noreferrer" data-track="whatsapp_click" className="card-interactive flex h-full flex-col gap-3 border-2 border-primary p-6 no-underline">
                <span className="icon-circle" aria-hidden="true">
                  <WhatsAppIcon className="size-6" />
                </span>
                <strong className="text-h3 text-foreground">{t.contact.whatsapp}</strong>
                <span className="text-muted-foreground">{displayNumber(waDigits)}</span>
                <span className="mt-auto font-bold text-primary">{t.contact.chatNow} →</span>
              </a>
            </li>
          )}
          {settings?.email && (
            <li>
              <a href={`mailto:${settings.email}`} className="card-interactive flex h-full flex-col gap-3 p-6 no-underline">
                <span className="icon-circle" aria-hidden="true">
                  <Mail className="size-6" strokeWidth={1.75} />
                </span>
                <strong className="text-h3 text-foreground">{t.contact.email}</strong>
                <span className="break-all text-muted-foreground">{settings.email}</span>
                <span className="mt-auto text-small text-muted-foreground">{t.contact.emailNote}</span>
              </a>
            </li>
          )}
          {socials.length > 0 && (
            <li className="card flex flex-col gap-3 p-6">
              <strong className="text-h3 text-foreground">{t.contact.social}</strong>
              <div className="flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.network}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.network}
                    className="icon-circle hover:bg-primary hover:text-on-primary"
                  >
                    <SocialIcon network={s.network} />
                  </a>
                ))}
              </div>
            </li>
          )}
          {settings?.serviceHours && (
            <li className="card flex flex-col gap-3 p-6">
              <span className="icon-circle" aria-hidden="true">
                <Clock className="size-6" strokeWidth={1.75} />
              </span>
              <strong className="text-h3 text-foreground">{t.contact.serviceHours}</strong>
              <span className="text-muted-foreground">{settings.serviceHours}</span>
            </li>
          )}
        </ul>
      </section>

      <Section alt>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col gap-4">
            <span className="eyebrow">{t.contact.formEyebrow}</span>
            <h2>{t.contact.formTitle}</h2>
            <p className="text-body-lg text-muted-foreground">{t.contact.formText}</p>
            <WhatsAppNotice locale={locale} />
          </div>
          {settings?.contactFormEnabled ? (
            <InquiryForm variant="contact" locale={locale} t={t.form} privacyHref={href('privacy', locale)} />
          ) : (
            <p className="card p-6 text-muted-foreground">{t.contact.formOff}</p>
          )}
        </div>
      </Section>
    </>
  )
}
