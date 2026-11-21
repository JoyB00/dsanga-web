/** Simple line glyphs for social networks (Lucide 1.x no longer ships brand icons). */
export function SocialIcon({ network, className = 'size-5' }: { network: 'instagram' | 'facebook' | 'tiktok'; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
  if (network === 'instagram') {
    return (
      <svg {...common}>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" />
      </svg>
    )
  }
  if (network === 'facebook') {
    return (
      <svg {...common}>
        <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v3h2v9h3v-9h2.5l.5-3h-3V6.8c0-.5.4-.8.8-.8H15z" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" />
      <path d="M14 3c.5 2.6 2.3 4.4 5 4.8" />
    </svg>
  )
}
