import { CalendarDays, CircleCheck, House, Leaf, Users } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { CmsImage } from '@/components/ui/CmsImage'
import { CtaBand } from '@/components/ui/CtaBand'
import { PageHero } from '@/components/ui/PageHero'
import { Section } from '@/components/ui/Section'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { getSiteSettings } from '@/lib/payload'
import { getGalleryMedia } from '@/lib/queries'

type Props = { params: Promise<{ locale: string }> }

const VALUE_ICONS = [Leaf, Users, House, CalendarDays]

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary(await localeFromParams(params))
  return { title: t.about.title, description: t.about.intro }
}

export default async function AboutPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const [settings, photos] = await Promise.all([getSiteSettings(locale).catch(() => null), getGalleryMedia(locale, 4)])
  const wa = settings?.whatsappNumber

  return (
    <>
      <PageHero
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: t.about.title }]}
        title={t.about.title}
        tagline={t.about.tagline}
        intro={t.about.intro}
        imagePlaceholder={t.about.heroPlaceholder}
        actions={
          <>
            <a href="#story" className="btn-primary">
              {t.about.storyEyebrow}
            </a>
            <WhatsAppButton number={wa} locale={locale} label={t.cta.contactUs} variant="outline" />
          </>
        }
      />

      {photos.length > 0 && (
        <div className="container-content -mt-4 pb-4">
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {photos.map((m) => (
              <li key={m.id}>
                <Link href={href('gallery', locale)} aria-label={`${t.nav.gallery}: ${m.alt}`} className="block">
                  <CmsImage media={m} placeholder="" size="thumb" sizes="(min-width: 768px) 25vw, 50vw" className="aspect-[16/10] w-full rounded-card" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Section id="story" alt>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col gap-3">
            <span className="eyebrow">{t.about.storyEyebrow}</span>
            <h2>{t.about.storyTitle}</h2>
          </div>
          <div className="flex flex-col gap-4 text-body-lg text-muted-foreground">
            {t.about.story.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </Section>

      <section className="section">
        <div className="container-content grid gap-6 lg:grid-cols-2">
          <div className="card flex flex-col gap-3 p-8">
            <span className="eyebrow">{t.about.managedEyebrow}</span>
            <h2 className="text-display-lg lg:text-display-lg">{t.about.managedTitle}</h2>
            <p className="text-muted-foreground">{t.about.managedText}</p>
          </div>
          <div className="card flex flex-col gap-3 p-8">
            <span className="eyebrow">{t.about.purposeEyebrow}</span>
            <h2 className="text-display-lg lg:text-display-lg">{t.about.purposeTitle}</h2>
            <ul className="flex flex-col gap-2">
              {t.about.purpose.map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted-foreground">
                  <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Section alt eyebrow={t.about.valuesEyebrow} title={t.about.valuesTitle}>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.about.values.map((value, i) => {
            const Icon = VALUE_ICONS[i] ?? Leaf
            return (
              <li key={value.title} className="card flex flex-col gap-3 p-6">
                <span className="icon-circle" aria-hidden="true">
                  <Icon className="size-6" strokeWidth={1.75} />
                </span>
                <h3>{value.title}</h3>
                <p className="text-muted-foreground">{value.text}</p>
              </li>
            )
          })}
        </ul>
      </Section>

      <div className="pt-section-mobile md:pt-section">
        <CtaBand title={t.about.ctaTitle} text={t.about.ctaText} locale={locale} showNotice={false}>
          <WhatsAppButton number={wa} locale={locale} label={t.cta.contactUs} />
          <Link href={href('visit', locale)} className="btn-outline">
            {t.about.planVisit}
          </Link>
        </CtaBand>
      </div>
    </>
  )
}
