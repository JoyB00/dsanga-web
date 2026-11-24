import type { Media } from '../payload-types'

/**
 * Payload returns absolute media URLs (prefixed with serverURL). next/image only allows our own
 * files as site-relative paths (images.localPatterns in next.config), so strip our own origin.
 * URLs on other hosts (e.g. object storage later) are returned unchanged and must be allowed
 * via images.remotePatterns.
 *
 * `version` (the media doc's updatedAt) is added as ?v=… so a replaced photo that keeps its
 * filename gets a new URL; otherwise next/image keeps serving the old one from its cache.
 */
export function mediaSrc(url?: string | null, version?: string | null): string | undefined {
  if (!url) return undefined
  const v = version ? Date.parse(version) : NaN
  const withVersion = (u: string) => (Number.isNaN(v) ? u : `${u}${u.includes('?') ? '&' : '?'}v=${v}`)
  if (url.startsWith('/')) return withVersion(url)
  try {
    const parsed = new URL(url)
    const own = new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000')
    return withVersion(parsed.host === own.host ? `${parsed.pathname}${parsed.search}` : url)
  } catch {
    return url
  }
}

/** Populated photos only (a deleted or unreadable photo comes back as an id). */
export const asMedia = (list?: (number | Media | null)[] | null) =>
  (list ?? []).filter((m): m is Media => typeof m === 'object' && m !== null)
