/**
 * GA4 helpers for client components. `window.gtag` only exists after the visitor has accepted
 * analytics cookies (components/Analytics.tsx), so calls before that are silently dropped.
 */
type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

export const CONSENT_COOKIE = 'dsanga_consent'
export const COOKIE_SETTINGS_EVENT = 'dsanga:cookie-settings'

export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window !== 'undefined') window.gtag?.('event', name, params)
}
