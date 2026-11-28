import { ArrowRight, Clock, MapPin, Sparkles, Ticket } from 'lucide-react'

import type { Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { priceText } from '@/lib/price'
import { temp } from '@/lib/verification'
import type { Experience, HomePage, SiteSetting } from '@/payload-types'
import { CmsImage } from '../ui/CmsImage'
import { FactsStrip, type Fact } from '../ui/FactsStrip'
import { Eyebrow } from '../ui/Section'
import { WaveEdge } from '../ui/WaveEdge'
import { WhatsAppButton } from '../ui/WhatsAppButton'

/** Splits the hero title so the accent words (CMS “Title accent”) get the accent colour. */
const splitTitle = (title: string, accent?: string | null): [string, string] => {
  const at = accent ? title.lastIndexOf(accent) : -1
  return at > 0 ? [title.slice(0, at).trimEnd(), title.slice(at)] : [title, '']
}

/** Facts come from Site settings and Experiences only; a fact without data is left out. */
function getFacts(locale: Locale, settings: SiteSetting | null, experiences: Experience[]): Fact[] {
  const t = getDictionary(locale)
  const facts: Fact[] = []
  const hours = settings?.openingHours?.[0]
  if (hours?.weekday)
    facts.push({
      icon: Clock,
      label: t.home.hours,
      value: hours.weekday,
      note:
        hours.weekend && hours.weekend !== hours.weekday
          ? `${hours.area} · ${t.experience.weekend}: ${hours.weekend}`
          : hours.area,
    })
  const ticket = experiences.find((e) => e.key === 'pool')?.prices?.[0]
  const ticketPrice = ticket && priceText(ticket, 'weekday', locale)
  if (ticketPrice)
    facts.push({
      icon: Ticket,
      label: t.home.factTicket,
      value: ticketPrice,
      note: `${ticket.label} · ${t.experience.weekday}`,
    })
  const available = experiences.filter((e) => e.availability === 'available').length
  if (available)
    facts.push({
      icon: Sparkles,
      label: t.home.factExperiences,
      value: String(available),
      note: t.home.factExperiencesNote,
    })
  const [place, ...rest] = (settings?.address ?? '').split(',').map((s) => s.trim())
  if (place)
    facts.push({ icon: MapPin, label: t.home.factLocation, value: place, note: rest.join(', ') })
  return facts
}

/**
 * Layout v3 hero: bright full-screen photo, the title over the calm bottom-left area, and a strip of
 * facts over the water-line edge. Only the text area is shaded, so the photo keeps its colours.
 */
export function HomeHero({
  locale,
  home,
  settings,
  experiences,
}: {
  locale: Locale
  home: HomePage | null
  settings: SiteSetting | null
  experiences: Experience[]
}) {
  const t = getDictionary(locale)
  const [titleMain, titleAccent] = splitTitle(
    home?.hero?.title || t.home.title,
    home?.hero ? home.hero.titleAccent : t.home.titleAccent,
  )
  const line =
    (home?.hero ? home.hero.tagline : t.home.tagline) || home?.hero?.intro || t.home.intro
  const facts = getFacts(locale, settings, experiences)

  return (
    <>
      <section
        {...temp(home)}
        className="on-dark relative isolate flex min-h-[92svh] items-end overflow-hidden bg-primary-hover text-background"
      >
        <div className="hero-settle absolute inset-x-0 -top-[14%] bottom-0 -z-10 md:top-0">
          <CmsImage
            media={home?.hero?.image}
            placeholder=""
            priority
            size="hero"
            sizes="100vw"
            className="size-full"
          />
        </div>
        <div aria-hidden="true" className="hero-shade absolute inset-0 -z-10" />
        <div className="hero-intro container-content flex flex-col items-start gap-4 pt-40 pb-24 md:gap-5 md:pb-40">
          <Eyebrow dark>{home?.hero?.eyebrow || t.home.eyebrow}</Eyebrow>
          <h1 className="max-w-4xl text-[clamp(1.9rem,8.2vw,2.6rem)] leading-none text-white [text-shadow:0_2px_18px_rgb(0_0_0/0.35)] md:text-[64px] lg:text-[76px]">
            {titleMain}{' '}
            {titleAccent && <span className="block text-accent-on-dark">{titleAccent}</span>}
          </h1>
          <p className="font-display-italic max-w-xl text-[21px] leading-snug text-white [text-shadow:0_1px_10px_rgb(0_0_0/0.45)] md:text-[26px]">
            {line}
          </p>
          <div className="mt-1 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <a href="#packages" className="btn-gold">
              {t.home.seePackages}
              <ArrowRight className="size-5" aria-hidden="true" />
            </a>
            <a href="#experiences" className="btn-glass max-sm:hidden">
              {t.cta.explore}
            </a>
            <WhatsAppButton
              number={settings?.whatsappNumber}
              locale={locale}
              label={t.home.chatWhatsApp}
              variant="glass"
            />
          </div>
        </div>
        <WaveEdge className="h-10 md:h-20" line={false} />
      </section>
      {/* Covers the sub-pixel seam under the wave. */}
      <div aria-hidden="true" className="relative -mt-0.5 -mb-0.5 h-1 bg-background" />

      <FactsStrip {...temp(settings)} facts={facts} label={t.home.factsLabel} />
    </>
  )
}
