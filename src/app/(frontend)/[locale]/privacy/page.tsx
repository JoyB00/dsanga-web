import type { Metadata } from 'next'

import { PageHeader } from '@/components/ui/PageHero'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = getDictionary(await localeFromParams(params))
  return { title: t.privacy.title }
}

/** Temporary policy text (spec §14): final wording comes from the pengelola before go-live. */
export default async function PrivacyPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)

  return (
    <>
      <PageHeader crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: t.privacy.title }]} title={t.privacy.title} />
      <section className="pb-section-mobile md:pb-section">
        <div className="container-content flex flex-col gap-10 lg:flex-row lg:items-start">
          <nav aria-label={t.privacy.toc} className="card flex flex-col p-5 lg:sticky lg:top-6 lg:w-72 lg:shrink-0">
            <span className="eyebrow mb-2">{t.privacy.toc}</span>
            <ol className="flex flex-col">
              {t.privacy.sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex min-h-touch items-center text-small text-foreground no-underline hover:text-primary">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="min-w-0 max-w-3xl flex-1">
            {t.privacy.sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-24 border-b border-border py-6 first:pt-0 last:border-0">
                <h2 className="mb-3 text-display-lg lg:text-display-lg">
                  {i + 1}. {s.title}
                </h2>
                {s.body.length > 1 ? (
                  <ul className="flex list-disc flex-col gap-2 pl-5 text-body-lg text-muted-foreground">
                    {s.body.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-body-lg text-muted-foreground">{s.body[0]}</p>
                )}
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
