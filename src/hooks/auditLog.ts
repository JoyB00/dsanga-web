import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

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
      summary: typeof doc?.title === 'string' ? doc.title : typeof doc?.name === 'string' ? doc.name : undefined,
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
    },
    req,
  })
  return doc
}

export const auditHooks = {
  afterChange: [auditAfterChange],
  afterDelete: [auditAfterDelete],
}
