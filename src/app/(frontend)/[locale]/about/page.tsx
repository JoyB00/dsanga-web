import type { Metadata } from 'next'
import { ArrowRight, CircleCheck } from 'lucide-react'
import Link from 'next/link'

import { PhotoMosaic } from '@/components/ui/PhotoMosaic'
import { RichText } from '@/components/ui/RichText'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { iconFor } from '@/lib/icons'
import { asMedia } from '@/lib/media'
import { getSiteSettings } from '@/lib/payload'
import { getAboutPage, getGalleryMedia, getHomePage } from '@/lib/queries'
import { PageHero } from '@/components/ui/PageHero'
import { Eyebrow, Section, SectionHeader } from '@/components/ui/Section'
import { CtaBand } from '@/components/ui/CtaBand'
import { WhatsAppButton } from '@/components/ui/WhatsAppButton'
import { pageMetadata } from '@/lib/seo'
import { temp } from '@/lib/verification'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const about = await getAboutPage(locale)
  return pageMetadata({
    key: 'about',
    locale,
    title: about?.hero?.title || t.about.title,
    description: about?.hero?.intro || t.about.intro,
    image: about?.hero?.image,
  })
}

/** About (spec-layout-v2 §6.2): story with a "managed by" quote, purpose with photos, values on dark, CTA. */
export default async function AboutPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const [about, settings, home, gallery] = await Promise.all([
    getAboutPage(locale),
    getSiteSettings(locale).catch(() => null),
    getHomePage(locale),
    getGalleryMedia(locale, 8),
  ])
  const wa = settings?.whatsappNumber
  // Same hand-picked photos as the Home mosaic.
  const chosen = asMedia(home?.gallery?.photos)
  const photos = chosen.length >= 4 ? chosen : gallery

  const title = about?.hero?.title || t.about.title
  const storyEyebrow = about?.story?.eyebrow || t.about.storyEyebrow
  const purpose = about?.purpose?.items?.length
    ? about.purpose.items.map((i) => i.text)
    : t.about.purpose
  const values = about?.values?.items?.length
    ? about.values.items.map((v) => ({ title: v.title, text: v.text, Icon: iconFor(v.icon) }))
    : t.about.values.map((v) => ({ ...v, Icon: iconFor('leaf') }))

  return (
    <>
      <PageHero
        {...temp(about)}
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: title }]}
        title={title}
        tagline={about?.hero?.tagline || t.about.tagline}
        intro={about?.hero?.intro || t.about.intro}
        image={about?.hero?.image}
        actions={
          <>
            <a href="#story" className="btn-primary">
              {storyEyebrow}
            </a>
            <WhatsAppButton number={wa} locale={locale} label={t.cta.contactUs} variant="glass" />
          </>
        }
      />

      {/* Story: heading left, text right, "managed by" as a quote */}
      <Section id="story">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col items-start gap-4">
            <Eyebrow>{storyEyebrow}</Eyebrow>
            <h2 className="text-[34px] leading-[1.08] font-bold text-foreground md:text-[48px]">
              {about?.story?.title || t.about.storyTitle}
            </h2>
          </div>
          <div className="flex flex-col gap-6">
            {about?.story?.body ? (
              <RichText data={about.story.body} className="max-w-[54ch] text-body-lg" />
            ) : (
              <div className="flex max-w-[54ch] flex-col gap-4 text-body-lg text-muted-foreground">
                {t.about.story.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
            )}
            <blockquote className="border-l-4 border-accent pl-6">
              <span className="text-[12px] font-bold tracking-[0.18em] text-accent-text uppercase">
                {about?.managed?.eyebrow || t.about.managedEyebrow}
              </span>
              <p className="font-display-italic mt-2 text-[24px] leading-snug text-primary">
                {about?.managed?.title || t.about.managedTitle}
              </p>
              <p className="mt-2 text-muted-foreground">
                {about?.managed?.text || t.about.managedText}
              </p>
            </blockquote>
          </div>
        </div>
      </Section>

      {/* Purpose, next to a staggered photo wall */}
      <Section tone="white">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <PhotoMosaic photos={photos.slice(0, 4)} columns={2} />
          <div className="flex flex-col items-start gap-6">
            <SectionHeader
              center={false}
              eyebrow={about?.purpose?.eyebrow || t.about.purposeEyebrow}
              title={about?.purpose?.title || t.about.purposeTitle}
            />
            <ul className="flex flex-col gap-3">
              {purpose.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-body-lg text-muted-foreground"
                >
                  <CircleCheck className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href={href('gallery', locale)} className="btn-outline">
              {t.home.openGallery}
              <ArrowRight className="size-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Section>

      {/* Values: the page's one dark section */}
      <Section tone="dark" image={photos[4] ?? photos[0]}>
        <SectionHeader
          dark
          eyebrow={about?.values?.eyebrow || t.about.valuesEyebrow}
          title={about?.values?.title || t.about.valuesTitle}
        />
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {values.map(({ title: valueTitle, text, Icon }) => (
            <li
              key={valueTitle}
              className="flex flex-col gap-3 rounded-card border border-white/15 bg-primary/90 p-6"
            >
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-white/8 text-accent-on-dark">
                <Icon className="size-6" strokeWidth={1.75} aria-hidden="true" />
              </span>
              <h3 className="text-[22px] leading-tight font-bold text-white">{valueTitle}</h3>
              {text && <p className="text-small text-white/75">{text}</p>}
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand
        showNotice={false}
        locale={locale}
        title={about?.cta?.title || t.about.ctaTitle}
        text={about?.cta?.text || t.about.ctaText}
      >
        <WhatsAppButton number={wa} locale={locale} label={t.cta.contactUs} variant="gold" />
        <Link href={href('visit', locale)} className="btn-outline-light">
          {t.about.planVisit}
        </Link>
      </CtaBand>
    </>
  )
}
