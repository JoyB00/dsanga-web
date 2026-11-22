import { revalidatePath } from 'next/cache'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionConfig,
  GlobalAfterChangeHook,
  GlobalConfig,
} from 'payload'

/**
 * On-demand revalidation: when published content changes, refresh every public page
 * (all locales) on its next visit, instead of waiting for the time-based fallback.
 * Outside Next.js (seed scripts) there is no cache to clear, so errors are ignored.
 */
const refreshSite = () => {
  try {
    // Route pattern must include the route group: the pages live in app/(frontend)/[locale].
    revalidatePath('/(frontend)/[locale]', 'layout')
  } catch {
    // Not running inside a Next.js request (e.g. `pnpm seed`): nothing to refresh.
  }
}

const afterChange: CollectionAfterChangeHook = ({ doc }) => {
  if (doc?._status !== 'draft') refreshSite()
  return doc
}
const afterDelete: CollectionAfterDeleteHook = ({ doc }) => {
  refreshSite()
  return doc
}
const afterGlobalChange: GlobalAfterChangeHook = ({ doc }) => {
  if (doc?._status !== 'draft') refreshSite()
  return doc
}

export const withRevalidate = (config: CollectionConfig): CollectionConfig => ({
  ...config,
  hooks: {
    ...config.hooks,
    afterChange: [...(config.hooks?.afterChange ?? []), afterChange],
    afterDelete: [...(config.hooks?.afterDelete ?? []), afterDelete],
  },
})

export const withRevalidateGlobal = (config: GlobalConfig): GlobalConfig => ({
  ...config,
  hooks: { ...config.hooks, afterChange: [...(config.hooks?.afterChange ?? []), afterGlobalChange] },
})
