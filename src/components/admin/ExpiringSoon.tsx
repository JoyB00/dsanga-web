import type { Payload } from 'payload'

import { getExpiringOffers, REMINDER_DAYS } from '@/lib/reminders'

/** CMS dashboard reminder (F-13): offers that end within the next 7 days. Hidden when there are none. */
export async function ExpiringSoon({ payload }: { payload: Payload }) {
  const items = await getExpiringOffers(payload)
  if (!items.length) return null
  const date = (iso: string) => new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'Asia/Makassar' }).format(new Date(iso))

  return (
    <section
      aria-labelledby="f13-title"
      style={{
        border: '1px solid var(--theme-elevation-150)',
        borderRadius: 'var(--style-radius-m)',
        padding: 'calc(var(--base) * 1.25)',
        marginBottom: 'calc(var(--base) * 2)',
      }}
    >
      <h2 id="f13-title" style={{ margin: 0, fontSize: '1.15rem' }}>
        Ending within {REMINDER_DAYS} days ({items.length})
      </h2>
      <p style={{ margin: 'calc(var(--base) * 0.5) 0', color: 'var(--theme-elevation-650)' }}>
        Expired offers disappear from the site automatically. Extend or replace them if they should stay.
      </p>
      <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
        {items.map((item) => (
          <li key={item.adminPath}>
            <a href={item.adminPath}>{item.title}</a> — ends {date(item.endsAt)}
          </li>
        ))}
      </ul>
    </section>
  )
}
