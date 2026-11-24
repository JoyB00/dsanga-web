import { ArrowRight, CalendarDays, ChevronDown, CircleCheck, Users } from 'lucide-react'
import Link from 'next/link'

import { href, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { cn } from '@/lib/cn'
import { formatDate, formatRupiah } from '@/lib/format'
import { temp } from '@/lib/verification'
import type { Offer, VenuePackage } from '@/payload-types'
import { CmsImage } from './CmsImage'
import { RichText } from './RichText'
import { WaveEdge } from './WaveEdge'
import { WhatsAppButton } from './WhatsAppButton'

type Shared = { locale: Locale; whatsapp?: string | null }

/** Offer as a package: price, saving and validity up front. Expired offers never reach this card (F-13). */
export function OfferPackageCard({
  offer,
  locale,
  whatsapp,
  full,
}: Shared & {
  offer: Offer
  /** Offers page: h2 title, full validity and terms, no "View Details" link to itself. */
  full?: boolean
}) {
  const Title = full ? 'h2' : 'h3'
  const t = getDictionary(locale)
  const saving =
    offer.price != null && offer.originalPrice != null && offer.originalPrice > offer.price
      ? offer.originalPrice - offer.price
      : null
  return (
    <article
      {...temp(offer)}
      className="group flex h-full flex-col overflow-hidden rounded-media bg-surface shadow-raised"
    >
      <div className="zoom-media relative overflow-hidden text-surface">
        <CmsImage
          media={offer.image}
          placeholder={offer.title}
          size="hero"
          sizes="(min-width: 768px) 50vw, 100vw"
          className="aspect-[2/1] w-full md:aspect-[16/9]"
        />
        <WaveEdge className="h-8 md:h-14" />
        {saving && (
          <span className="absolute top-4 right-4 rounded-full bg-accent-on-dark px-4 py-1.5 text-small font-extrabold text-foreground shadow-raised">
            {t.home.packageSave.replace('{n}', formatRupiah(saving))}
          </span>
        )}
      </div>
      <div className="relative -mt-px flex flex-1 flex-col gap-3 bg-surface px-5 pt-2 pb-6 md:px-8 md:pb-8">
        {offer.category && (
          <span className="text-[12px] font-bold tracking-[0.16em] text-accent-text uppercase">
            {offer.category}
          </span>
        )}
        <Title className="text-[28px] leading-[1.1] md:text-[34px]">{offer.title}</Title>
        {offer.summary && <p className="text-muted-foreground">{offer.summary}</p>}
        <p className="flex items-center gap-2 text-small text-muted-foreground">
          <CalendarDays className="size-4 shrink-0 text-accent-text" aria-hidden="true" />
          {full
            ? `${t.offers.valid} ${formatDate(offer.validFrom, locale)} – ${formatDate(offer.validUntil, locale)}`
            : `${t.home.validUntil} ${formatDate(offer.validUntil, locale)}`}
        </p>
        {full && offer.terms && (
          <details className="group/terms rounded-xl bg-surface-alt px-4">
            <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-2 font-bold [&::-webkit-details-marker]:hidden">
              {t.offers.terms}
              <ChevronDown
                className="size-4 transition-transform group-open/terms:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <RichText data={offer.terms} className="pb-4 text-small" />
          </details>
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-3">
          {offer.price != null && (
            <p className="flex flex-col">
              {saving && (
                <s className="text-small text-muted-foreground">
                  {formatRupiah(offer.originalPrice)}
                </s>
              )}
              <span className="flex items-baseline gap-1.5">
                <strong className="font-display text-[38px] leading-none text-primary lining-nums md:text-[44px]">
                  {formatRupiah(offer.price)}
                </strong>
                {offer.priceUnit && (
                  <span className="text-small text-muted-foreground">{offer.priceUnit}</span>
                )}
              </span>
            </p>
          )}
          <div className="flex flex-wrap gap-2 max-sm:w-full [&>*]:max-sm:flex-1">
            <WhatsAppButton
              number={whatsapp}
              locale={locale}
              topic={offer.title}
              intent="booking"
              askPrice={offer.price == null}
              context={offer.title}
              label={full ? t.cta.bookViaWhatsApp : t.home.packageAsk}
            />
            {!full && (
              <Link href={href('offers', locale)} className="btn-outline">
                {t.cta.viewDetails}
                <span className="sr-only">: {offer.title}</span>
                <ArrowRight className="size-5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

/** Venue package: photo card on tablet and up, compact row with a small photo on phones. One link. */
export function VenuePackageCard({
  pkg,
  locale,
  whatsapp,
  full,
}: Shared & {
  pkg: VenuePackage
  /** Events page: all details on phones too, and a WhatsApp button instead of a link to itself. */
  full?: boolean
}) {
  const t = getDictionary(locale)
  const body = (
    <>
      <div className="zoom-media relative overflow-hidden text-surface">
        <CmsImage
          media={pkg.image}
          placeholder={pkg.name}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 120px"
          className={
            full ? 'aspect-[16/10] w-full' : 'size-full min-h-32 sm:aspect-[16/10] sm:h-auto'
          }
        />
        <WaveEdge className={cn('h-9', !full && 'max-sm:hidden')} />
      </div>
      <div
        className={cn(
          'relative flex flex-1 flex-col gap-2 bg-surface sm:-mt-px sm:px-6 sm:pt-2 sm:pb-6',
          full ? '-mt-px px-5 pt-2 pb-5' : 'p-4',
        )}
      >
        <span className="flex items-center gap-1.5 text-[12px] font-bold tracking-[0.08em] text-accent-text uppercase">
          <Users className="size-3.5 shrink-0" aria-hidden="true" />
          {t.events.upTo.replace('{n}', String(pkg.capacity))}
        </span>
        <h3 className="text-[22px] leading-tight sm:text-[26px]">{pkg.name}</h3>
        {!!pkg.inclusions?.length && (
          <ul
            aria-label={t.home.packageIncludes}
            className={cn(
              'flex-col gap-1.5 text-small text-muted-foreground sm:flex',
              full ? 'flex' : 'hidden',
            )}
          >
            {pkg.inclusions.map((inc) => (
              <li key={inc.id ?? inc.label} className="flex items-start gap-2">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-secondary" aria-hidden="true" />
                {inc.label}
              </li>
            ))}
          </ul>
        )}
        <span className="mt-auto flex items-center justify-between gap-2 pt-1 font-bold text-primary sm:border-t sm:border-border sm:pt-4">
          {pkg.priceFrom != null
            ? `${t.events.from} ${formatRupiah(pkg.priceFrom)}`
            : t.events.onRequest}
          {!full && (
            <ArrowRight
              className="size-5 shrink-0 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          )}
        </span>
        {full && (
          <WhatsAppButton
            number={whatsapp}
            locale={locale}
            topic={pkg.name}
            intent="quote"
            label={t.cta.planEvent}
            context={pkg.name}
            className="mt-2 w-full"
          />
        )}
      </div>
    </>
  )
  const box = cn(
    'group h-full overflow-hidden rounded-card bg-surface text-foreground shadow-card',
    full ? 'flex flex-col' : 'grid grid-cols-[7.5rem_1fr] sm:flex sm:flex-col',
  )
  return full ? (
    <article {...temp(pkg)} className={box}>
      {body}
    </article>
  ) : (
    <Link
      {...temp(pkg)}
      href={href('events', locale, 'private')}
      className={cn(
        box,
        'no-underline transition-shadow hover:text-foreground hover:shadow-raised',
      )}
    >
      {body}
    </Link>
  )
}
