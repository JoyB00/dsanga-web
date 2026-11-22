import type { Metadata } from 'next'

import { PageHeader } from '@/components/ui/PageHero'
import { RichText } from '@/components/ui/RichText'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { formatDate } from '@/lib/format'
import { getPrivacyPage } from '@/lib/queries'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const privacy = await getPrivacyPage(locale)
  return { title: privacy?.title || getDictionary(locale).privacy.title }
}

/** Policy text is edited in the CMS (Privacy policy global, approver only). */
export default async function PrivacyPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const privacy = await getPrivacyPage(locale)
  const title = privacy?.title || t.privacy.title
  const sections = privacy?.sections?.length
    ? privacy.sections.map((s) => ({ id: s.anchor, title: s.title, body: <RichText data={s.body} className="text-body-lg" /> }))
    : t.privacy.sections.map((s) => ({
        id: s.id,
        title: s.title,
        body: (
          <div className="flex flex-col gap-2 text-body-lg text-muted-foreground">
            {s.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ),
      }))

  return (
    <>
      <PageHeader
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: title }]}
        title={title}
        intro={privacy?.lastUpdated ? `${t.privacy.updated}: ${formatDate(privacy.lastUpdated, locale, { month: 'long' })}` : undefined}
      />
      <section className="pb-section-mobile md:pb-section">
        <div className="container-content flex flex-col gap-10 lg:flex-row lg:items-start">
          <nav aria-label={t.privacy.toc} className="card flex flex-col p-5 lg:sticky lg:top-6 lg:w-72 lg:shrink-0">
            <span className="eyebrow mb-2">{t.privacy.toc}</span>
            <ol className="flex flex-col">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex min-h-touch items-center text-small text-foreground no-underline hover:text-primary">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="min-w-0 max-w-3xl flex-1">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 border-b border-border py-6 first:pt-0 last:border-0">
                <h2 className="mb-3 text-display-lg lg:text-display-lg">
                  {i + 1}. {s.title}
                </h2>
                {s.body}
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
