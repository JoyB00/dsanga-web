import type { Metadata } from 'next'
import { RichText } from '@/components/ui/RichText'
import { href, localeFromParams } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'
import { formatDate } from '@/lib/format'
import { getPrivacyPage } from '@/lib/queries'
import { PageHero } from '@/components/ui/PageHero'
import { Section } from '@/components/ui/Section'
import { pageMetadata } from '@/lib/seo'
import { temp } from '@/lib/verification'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const privacy = await getPrivacyPage(locale)
  return pageMetadata({
    key: 'privacy',
    locale,
    title: privacy?.title || t.privacy.title,
    description: t.privacy.description,
  })
}

/** Privacy (spec-layout-v2 §6.2): short gradient header, sticky contents, long text at reading width. */
export default async function PrivacyPage({ params }: Props) {
  const locale = await localeFromParams(params)
  const t = getDictionary(locale)
  const privacy = await getPrivacyPage(locale)
  const title = privacy?.title || t.privacy.title
  const sections = privacy?.sections?.length
    ? privacy.sections.map((s) => ({
        id: s.anchor,
        title: s.title,
        body: <RichText data={s.body} className="text-body-lg" />,
      }))
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
      <PageHero
        {...temp(privacy)}
        crumbs={[{ label: t.nav.home, href: href('home', locale) }, { label: title }]}
        title={title}
        intro={
          privacy?.lastUpdated
            ? `${t.privacy.updated}: ${formatDate(privacy.lastUpdated, locale, { month: 'long' })}`
            : undefined
        }
      />
      <Section tone="cream">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
          <nav
            aria-label={t.privacy.toc}
            className="flex flex-col rounded-card border border-border bg-surface p-5 shadow-card lg:sticky lg:top-28 lg:w-72 lg:shrink-0"
          >
            <span className="mb-2 text-caption font-bold tracking-[0.16em] text-accent-text uppercase">
              {t.privacy.toc}
            </span>
            <ol className="flex flex-col">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex min-h-touch items-center rounded-lg px-2 text-small text-foreground no-underline hover:bg-highlight hover:text-primary"
                  >
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="min-w-0 max-w-[720px] flex-1 rounded-card border border-border bg-surface px-6 py-2 shadow-card md:px-10">
            {sections.map((s, i) => (
              <section
                key={s.id}
                id={s.id}
                className="scroll-mt-28 border-b border-border py-8 last:border-0"
              >
                <h2 className="mb-3 text-[30px] leading-tight font-bold text-foreground">
                  {i + 1}. {s.title}
                </h2>
                {s.body}
              </section>
            ))}
          </div>
        </div>
      </Section>
    </>
  )
}
