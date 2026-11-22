import { CircleCheck } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'

import { CmsImage } from '@/components/ui/CmsImage'
import { CtaBand } from '@/components/ui/CtaBand'
import { PageHero } from '@/components/ui/PageHero'
import { RichText } from '@/components/ui/RichText'
import { Section } from '@/components/ui/Section'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { iconFor } from '@/lib/icons'
import { getSiteSettings } from '@/lib/payload'
import { getAboutPage, getGalleryMedia } from '@/lib/queries'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const about = await getAboutPage(locale)
  return { title: about?.hero?.title || t.about.title, description: about?.hero?.intro || t.about.intro }
}

export default async function AboutPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const [about, settings, photos] = await Promise.all([
    getAboutPage(locale),
    getSiteSettings(locale).catch(() => null),
    getGalleryMedia(locale, 4),
  ])
  const wa = settings?.whatsappNumber

  // Copy is edited in the CMS (About page global); built-in text only fills empty fields.
  const title = about?.hero?.title || t.about.title
  const purpose = about?.purpose?.items?.length ? about.purpose.items.map((i) => i.text) : t.about.purpose
  const values = about?.values?.items?.length
    ? about.values.items.map((v) => ({ title: v.title, text: v.text, Icon: iconFor(v.icon) }))
    : t.about.values.map((v) => ({ ...v, Icon: iconFor('leaf') }))

  return (
    <>
      <PageHero
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: title }]}
        title={title}
        tagline={about?.hero?.tagline || t.about.tagline}
        intro={about?.hero?.intro || t.about.intro}
        image={about?.hero?.image}
        imagePlaceholder={t.about.heroPlaceholder}
        actions={
          <>
            <a href="#story" className="btn-primary">
              {about?.story?.eyebrow || t.about.storyEyebrow}
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
            <span className="eyebrow">{about?.story?.eyebrow || t.about.storyEyebrow}</span>
            <h2>{about?.story?.title || t.about.storyTitle}</h2>
          </div>
          {about?.story?.body ? (
            <RichText data={about.story.body} className="text-body-lg" />
          ) : (
            <div className="flex flex-col gap-4 text-body-lg text-muted-foreground">
              {t.about.story.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          )}
        </div>
      </Section>

      <section className="section">
        <div className="container-content grid gap-6 lg:grid-cols-2">
          <div className="card flex flex-col gap-3 p-8">
            <span className="eyebrow">{about?.managed?.eyebrow || t.about.managedEyebrow}</span>
            <h2 className="text-display-lg lg:text-display-lg">{about?.managed?.title || t.about.managedTitle}</h2>
            <p className="text-muted-foreground">{about?.managed?.text || t.about.managedText}</p>
          </div>
          <div className="card flex flex-col gap-3 p-8">
            <span className="eyebrow">{about?.purpose?.eyebrow || t.about.purposeEyebrow}</span>
            <h2 className="text-display-lg lg:text-display-lg">{about?.purpose?.title || t.about.purposeTitle}</h2>
            <ul className="flex flex-col gap-2">
              {purpose.map((item) => (
                <li key={item} className="flex items-start gap-2 text-muted-foreground">
                  <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <Section alt eyebrow={about?.values?.eyebrow || t.about.valuesEyebrow} title={about?.values?.title || t.about.valuesTitle}>
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(14rem,1fr))] gap-5">
          {values.map(({ title: valueTitle, text, Icon }) => (
            <li key={valueTitle} className="card flex flex-col gap-3 p-6">
              <span className="icon-circle" aria-hidden="true">
                <Icon className="size-6" strokeWidth={1.75} />
              </span>
              <h3>{valueTitle}</h3>
              {text && <p className="text-muted-foreground">{text}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <div className="pt-section-mobile md:pt-section">
        <CtaBand title={about?.cta?.title || t.about.ctaTitle} text={about?.cta?.text || t.about.ctaText} locale={locale} showNotice={false}>
          <WhatsAppButton number={wa} locale={locale} label={t.cta.contactUs} />
          <Link href={href('visit', locale)} className="btn-outline">
            {t.about.planVisit}
          </Link>
        </CtaBand>
      </div>
    </>
  )
}
