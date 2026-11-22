import type { Payload } from 'payload'

import { getUnverifiedReport } from '@/lib/verification'

/**
 * CMS dashboard panel (F-15): how much temporary data is still published, with direct links.
 * Shown above the collection cards for every role; approvers tick "Verified" on each record.
 */
export async function VerificationStatus({ payload }: { payload: Payload }) {
  const groups = await getUnverifiedReport(payload, 5)
  const total = groups.reduce((sum, g) => sum + g.total, 0)
  const ok = total === 0

  return (
    <section
      aria-labelledby="f15-title"
      style={{
        border: `1px solid ${ok ? 'var(--theme-success-500)' : 'var(--theme-warning-500)'}`,
        background: ok ? 'var(--theme-success-50)' : 'var(--theme-warning-50)',
        borderRadius: 'var(--style-radius-m)',
        padding: 'calc(var(--base) * 1.25)',
        marginBottom: 'calc(var(--base) * 2)',
      }}
    >
      <h2 id="f15-title" style={{ margin: 0, fontSize: '1.15rem' }}>
        {ok ? 'All published content is verified' : `Temporary data: ${total} published item${total === 1 ? '' : 's'} not verified yet`}
      </h2>
      <p style={{ margin: 'calc(var(--base) * 0.5) 0 0', color: 'var(--theme-elevation-650)' }}>
        {ok
          ? 'Go-live check F-15 passes.'
          : 'Go-live is blocked until an approver replaces the temporary data (spec §14) and ticks “Verified (final data)” on each item.'}
      </p>
      {!ok && (
        <div
          style={{
            display: 'grid',
            gap: 'calc(var(--base) * 1)',
            gridTemplateColumns: 'repeat(auto-fill, minmax(15rem, 1fr))',
            marginTop: 'calc(var(--base) * 1)',
          }}
        >
          {groups.map((group) => (
            <div key={group.label}>
              <a href={group.listPath} style={{ fontWeight: 700 }}>
                {group.label} ({group.total})
              </a>
              <ul style={{ margin: '4px 0 0', paddingLeft: '1.1rem' }}>
                {group.items.map((item) => (
                  <li key={item.adminPath}>
                    <a href={item.adminPath}>{item.title}</a>
                  </li>
                ))}
                {group.total > group.items.length && <li>… {group.total - group.items.length} more</li>}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
