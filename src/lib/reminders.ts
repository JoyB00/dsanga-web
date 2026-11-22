import type { Payload, TaskConfig } from 'payload'

/**
 * F-13 "admin menerima pengingat konten yang akan berakhir": published offers that end soon.
 * Shown on the CMS dashboard and emailed once a day to the reminder recipients.
 */
export const REMINDER_DAYS = 7

export type ExpiringItem = { title: string; endsAt: string; adminPath: string }

export async function getExpiringOffers(payload: Payload, days = REMINDER_DAYS): Promise<ExpiringItem[]> {
  const now = new Date()
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
  const res = await payload.find({
    collection: 'offers',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { validUntil: { greater_than_equal: now.toISOString() } },
        { validUntil: { less_than_equal: until.toISOString() } },
      ],
    },
    sort: 'validUntil',
    limit: 50,
    depth: 0,
    locale: 'en',
    overrideAccess: true,
  })
  return res.docs.map((doc) => ({
    title: doc.title,
    endsAt: doc.validUntil,
    adminPath: `/admin/collections/offers/${doc.id}`,
  }))
}

const formatDate = (iso: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'Asia/Makassar' }).format(new Date(iso))

/** Daily job (Payload jobs queue "daily"): email the list when something ends within 7 days. */
export const expiryReminderTask: TaskConfig = {
  slug: 'expiryReminder',
  label: 'F-13: email offers that end within 7 days',
  // 08:00 WITA (UTC+8) = 00:00 UTC. Payload's cron has an optional seconds field first.
  schedule: [{ cron: '0 0 0 * * *', queue: 'daily' }],
  retries: 2,
  handler: async ({ req }) => {
    const { payload } = req
    const items = await getExpiringOffers(payload)
    if (!items.length) return { output: { sent: 0 } }

    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
    const to = (settings.reminderRecipients || settings.inquiryRecipients || settings.email || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (!to.length) {
      payload.logger.warn('F-13: offers end soon, but no reminder email is set (Site settings › Switches).')
      return { output: { sent: 0 } }
    }

    const base = payload.config.serverURL
    const rows = items.map(
      (i) =>
        `<li><a href="${base}${i.adminPath}">${i.title.replace(/</g, '&lt;')}</a> — ${formatDate(i.endsAt, 'en-GB')} / ${formatDate(i.endsAt, 'id-ID')}</li>`,
    )
    await payload.sendEmail({
      to,
      subject: `${items.length} offer(s) end within ${REMINDER_DAYS} days / ${items.length} promo berakhir dalam ${REMINDER_DAYS} hari`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1F2A24">
<p><strong>These offers end soon.</strong> Extend, replace or let them expire; expired offers disappear from the site automatically.<br>
<strong>Promo berikut segera berakhir.</strong> Perpanjang, ganti, atau biarkan berakhir; promo yang lewat tanggal otomatis hilang dari website.</p>
<ul>${rows.join('')}</ul></div>`,
      text: items.map((i) => `- ${i.title}: ${formatDate(i.endsAt, 'en-GB')} (${base}${i.adminPath})`).join('\n'),
    })
    return { output: { sent: items.length } }
  },
}
