import { APIError, type CollectionBeforeChangeHook, type GlobalBeforeChangeHook, type PayloadRequest } from 'payload'

/**
 * F-08: content may only be published when the required text exists in BOTH languages,
 * so the site never shows an empty or mixed-language page. Drafts can be saved any time.
 *
 * `fields` are dotted paths to localized fields, e.g. ['title'] or ['hero.title', 'hero.intro'].
 * Server-side calls without a user (seed scripts) are skipped.
 */
const LOCALES = ['en', 'id'] as const
const LOCALE_LABEL: Record<(typeof LOCALES)[number], string> = { en: 'English', id: 'Bahasa Indonesia' }

/** Values at a dotted path; `*` walks every row of an array, e.g. 'sections.*.title'. */
const valuesAt = (doc: unknown, path: string): unknown[] => {
  const [head, ...rest] = path.split('.')
  if (doc == null || typeof doc !== 'object') return [undefined]
  if (head === '*') {
    const rows = Array.isArray(doc) ? doc : []
    // An empty optional list has nothing to translate (minRows rules handle required lists).
    return rows.flatMap((row) => (rest.length ? valuesAt(row, rest.join('.')) : [row]))
  }
  const next = (doc as Record<string, unknown>)[head]
  return rest.length ? valuesAt(next, rest.join('.')) : [next]
}

/** True when a Lexical node tree contains any non-blank text. */
const hasText = (node: unknown): boolean => {
  if (!node || typeof node !== 'object') return false
  const n = node as { text?: unknown; children?: unknown[]; root?: unknown }
  if (typeof n.text === 'string' && n.text.trim()) return true
  if (n.root) return hasText(n.root)
  return Array.isArray(n.children) && n.children.some(hasText)
}

const isFilled = (value: unknown) => {
  if (value == null) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (typeof value === 'object' && 'root' in (value as object)) return hasText(value)
  if (Array.isArray(value)) return value.length > 0
  return true
}

const isPublishing = (data: Record<string, unknown> | undefined) => data?._status === 'published'

function assertFilled(req: PayloadRequest, current: Record<string, unknown>, others: Record<string, Record<string, unknown>>, fields: string[]) {
  const missing: string[] = []
  const locale = (req.locale as (typeof LOCALES)[number]) || 'en'
  const label = (path: string) => path.replace(/\.\*\./g, ' › ').replace(/\./g, ' › ')
  for (const path of fields) {
    if (!valuesAt(current, path).every(isFilled)) missing.push(`“${label(path)}” (${LOCALE_LABEL[locale] ?? locale})`)
    for (const [other, doc] of Object.entries(others)) {
      if (!valuesAt(doc, path).every(isFilled)) missing.push(`“${label(path)}” (${LOCALE_LABEL[other as 'en' | 'id']})`)
    }
  }
  if (missing.length) {
    throw new APIError(
      `Cannot publish yet: fill in both languages first. Missing: ${missing.join(', ')}. You can save as draft in the meantime.`,
      400,
      undefined,
      true,
    )
  }
}

export const requireBothLocales =
  (fields: string[]): CollectionBeforeChangeHook =>
  async ({ data, req, operation, originalDoc, collection }) => {
    if (!req.user || !isPublishing(data)) return data
    const current = { ...(originalDoc ?? {}), ...data }
    const others: Record<string, Record<string, unknown>> = {}
    for (const other of LOCALES.filter((l) => l !== req.locale)) {
      // NOTE: do not pass `req` here. Payload sets req.locale to the requested locale, which
      // would make the rest of this save write into the *other* language.
      others[other] =
        operation === 'update' && originalDoc?.id
          ? ((await req.payload.findByID({
              collection: collection.slug,
              id: originalDoc.id,
              locale: other,
              fallbackLocale: false,
              draft: true,
              depth: 0,
              overrideAccess: true,
            })) as unknown as Record<string, unknown>)
          : {}
    }
    assertFilled(req, current, others, fields)
    return data
  }

export const requireBothLocalesGlobal =
  (fields: string[]): GlobalBeforeChangeHook =>
  async ({ data, req, global, originalDoc }) => {
    if (!req.user) return data
    // Globals without drafts are checked on every save; with drafts only on publish.
    if (global.versions && typeof global.versions === 'object' && global.versions.drafts && !isPublishing(data)) return data
    const current = { ...(originalDoc ?? {}), ...data }
    const others: Record<string, Record<string, unknown>> = {}
    for (const other of LOCALES.filter((l) => l !== req.locale)) {
      // NOTE: no `req` — see the collection hook above (it would switch req.locale).
      others[other] = (await req.payload.findGlobal({
        slug: global.slug,
        locale: other,
        fallbackLocale: false,
        draft: true,
        depth: 0,
        overrideAccess: true,
      })) as unknown as Record<string, unknown>
    }
    assertFilled(req, current, others, fields)
    return data
  }
