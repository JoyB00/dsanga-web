import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, GlobalAfterChangeHook, GlobalConfig } from 'payload'

/** Short label for the log: title, name, FAQ question, or (for accounts) email + role. Never passwords. */
const summarize = (doc: Record<string, unknown> | undefined): string | undefined => {
  if (!doc) return undefined
  if (typeof doc.email === 'string') return `${doc.email}${doc.role ? ` · ${String(doc.role)}` : ''}`
  for (const key of ['title', 'name', 'question', 'filename', 'orderNumber', 'invoiceNumber']) if (typeof doc[key] === 'string') return doc[key] as string
  return undefined
}

/** F-12: record who changed what and when for important collections. */
export const auditAfterChange: CollectionAfterChangeHook = async ({ doc, operation, req, collection }) => {
  if (!req.user) return doc
  await req.payload.create({
    collection: 'audit-logs',
    data: {
      action: operation === 'create' ? 'create' : doc?._status === 'published' ? 'publish' : 'update',
      collectionSlug: collection.slug,
      documentId: String(doc.id),
      user: req.user.id,
      summary: summarize(doc),
    },
    req,
  })
  return doc
}

export const auditAfterDelete: CollectionAfterDeleteHook = async ({ doc, req, collection }) => {
  if (!req.user) return doc
  await req.payload.create({
    collection: 'audit-logs',
    data: {
      action: 'delete',
      collectionSlug: collection.slug,
      documentId: String(doc.id),
      user: req.user.id,
      summary: summarize(doc),
    },
    req,
  })
  return doc
}

/** Globals (Site settings, Home / About / Privacy pages): logged as "global:<slug>". */
export const auditGlobalAfterChange: GlobalAfterChangeHook = async ({ doc, req, global }) => {
  if (!req.user) return doc
  await req.payload.create({
    collection: 'audit-logs',
    data: {
      action: doc?._status === 'published' ? 'publish' : 'update',
      collectionSlug: `global:${global.slug}`,
      documentId: global.slug,
      user: req.user.id,
      summary: typeof global.label === 'string' ? global.label : global.slug,
    },
    req,
  })
  return doc
}

export const withAuditGlobal = (config: GlobalConfig): GlobalConfig => ({
  ...config,
  hooks: { ...config.hooks, afterChange: [...(config.hooks?.afterChange ?? []), auditGlobalAfterChange] },
})

export const auditHooks = {
  afterChange: [auditAfterChange],
  afterDelete: [auditAfterDelete],
}
