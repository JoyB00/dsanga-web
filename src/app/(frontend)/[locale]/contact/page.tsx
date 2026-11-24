import type { Metadata } from 'next'
import { ArrowRight, Clock, Mail } from 'lucide-react'

import { InquiryForm } from '@/components/ui/InquiryForm'
import { SocialIcon } from '@/components/ui/SocialIcon'
import { WhatsAppIcon } from '@/components/WhatsAppIcon'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getPageHead } from '@/lib/pageHead'
import { getSiteSettings } from '@/lib/payload'
import { whatsappUrl } from '@/lib/whatsapp'

const displayNumber = (digits: string) =>
  `+${digits.replace(/^(\d{2})(\d{3})(\d{4})(\d+)$/, '$1 $2-$3-$4')}`
import { PageHero } from '@/components/ui/PageHero'
import { Section, SectionHeader } from '@/components/ui/Section'
import { Panel } from '@/components/ui/InfoCard'
import { WhatsAppNotice } from '@/components/ui/WhatsAppButton'
import { pageMetadata } from '@/lib/seo'
import { temp } from '@/lib/verification'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const head = await getPageHead('contact', locale)
  return pageMetadata({
    key: 'contact',
    locale,
    title: head.title,
    description: head.intro || head.tagline,
    image: head.image,
  })
}

/** Contact (spec-layout-v2 §6.2): short gradient header (no photo), contact cards, enquiry form (F-14). */
export default async function ContactPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const head = await getPageHead('contact', locale)
  const settings = await getSiteSettings(locale).catch(() => null)

  const waDigits = (settings?.whatsappNumber ?? '').replace(/\D/g, '')
  const wa = whatsappUrl(waDigits, locale)
  const socials = (['instagram', 'facebook', 'tiktok'] as const)
    .map((network) => ({ network, url: settings?.social?.[network] }))
    .filter((s): s is { network: typeof s.network; url: string } => Boolean(s.url))
  const card = 'flex h-full flex-col gap-3 rounded-card bg-surface p-6 shadow-card'
  const icon =
    'inline-flex size-12 items-center justify-center rounded-xl bg-highlight text-primary'

  return (
    <>
      <PageHero
        {...temp(head)}
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: head.title }]}
        title={head.title}
        tagline={head.tagline}
        intro={head.intro}
      />

      <Section tone="cream">
        <ul {...temp(settings)} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {wa && (
            <li>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                data-track="whatsapp_click"
                className={`${card} border-2 border-primary no-underline hover:shadow-raised`}
              >
                <span className={icon} aria-hidden="true">
                  <WhatsAppIcon className="size-6" />
                </span>
                <strong className="font-display text-[26px] text-foreground">
                  {t.contact.whatsapp}
                </strong>
                <span className="text-muted-foreground">{displayNumber(waDigits)}</span>
                <span className="mt-auto inline-flex items-center gap-1 font-bold text-primary">
                  {t.contact.chatNow} <ArrowRight className="size-4" aria-hidden="true" />
                </span>
              </a>
            </li>
          )}
          {settings?.email && (
            <li>
              <a
                href={`mailto:${settings.email}`}
                className={`${card} no-underline hover:shadow-raised`}
              >
                <span className={icon} aria-hidden="true">
                  <Mail className="size-6" strokeWidth={1.75} />
                </span>
                <strong className="font-display text-[26px] text-foreground">
                  {t.contact.email}
                </strong>
                <span className="break-all text-muted-foreground">{settings.email}</span>
                <span className="mt-auto text-small text-muted-foreground">
                  {t.contact.emailNote}
                </span>
              </a>
            </li>
          )}
          {socials.length > 0 && (
            <li className={card}>
              <strong className="font-display text-[26px] text-foreground">
                {t.contact.social}
              </strong>
              <div className="flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a
                    key={s.network}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.network}
                    className={`${icon} hover:bg-primary hover:text-on-primary`}
                  >
                    <SocialIcon network={s.network} />
                  </a>
                ))}
              </div>
            </li>
          )}
          {settings?.serviceHours && (
            <li className={card}>
              <span className={icon} aria-hidden="true">
                <Clock className="size-6" strokeWidth={1.75} />
              </span>
              <strong className="font-display text-[26px] text-foreground">
                {t.contact.serviceHours}
              </strong>
              <span className="text-muted-foreground">{settings.serviceHours}</span>
            </li>
          )}
        </ul>
      </Section>

      <Section tone="alt">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col items-start gap-5">
            <SectionHeader
              center={false}
              eyebrow={t.contact.formEyebrow}
              title={t.contact.formTitle}
              intro={t.contact.formText}
            />
            <WhatsAppNotice locale={locale} />
          </div>
          <Panel>
            {settings?.contactFormEnabled ? (
              <InquiryForm
                locale={locale}
                t={t.form}
                privacyHref={href('privacy', locale)}
              />
            ) : (
              <p className="text-muted-foreground">{t.contact.formOff}</p>
            )}
          </Panel>
        </div>
      </Section>
    </>
  )
}
