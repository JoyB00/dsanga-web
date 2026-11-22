/**
 * Payload returns absolute media URLs (prefixed with serverURL). next/image only allows our own
 * files as site-relative paths (images.localPatterns in next.config), so strip our own origin.
 * URLs on other hosts (e.g. object storage later) are returned unchanged and must be allowed
 * via images.remotePatterns.
 */
export function mediaSrc(url?: string | null): string | undefined {
  if (!url) return undefined
  if (url.startsWith('/')) return url
  try {
    const parsed = new URL(url)
    const own = new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000')
    return parsed.host === own.host ? `${parsed.pathname}${parsed.search}` : url
  } catch {
    return url
  }
}
