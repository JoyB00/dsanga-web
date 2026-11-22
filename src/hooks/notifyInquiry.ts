import type { CollectionAfterChangeHook } from 'payload'

import type { Inquiry } from '../payload-types'

/**
 * F-14: email the PIC when a visitor sends the contact / availability form.
 * The message is bilingual (spec F-08: notification emails in both languages), and
 * Reply-To is the visitor, so the PIC can answer straight from their inbox.
 * A failed email never fails the submission: the message is already saved in the CMS Inbox.
 */
const TOPICS: Record<string, [string, string]> = {
  general: ['General question', 'Pertanyaan umum'],
  pool: ['Pool', 'Pool'],
  dining: ['Bistro & Coffee', 'Bistro & Coffee'],
  work: ['Work & Space', 'Work & Space'],
  events: ['Events', 'Events'],
  other: ['Other', 'Lainnya'],
}

const escapeHtml = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Strip line breaks so visitor input can never add email headers. */
const oneLine = (value: unknown) => String(value ?? '').replace(/[\r\n]+/g, ' ').trim()

const formatDate = (value?: string | null) => (value ? new Date(value).toISOString().slice(0, 10) : '')

export const notifyInquiry: CollectionAfterChangeHook<Inquiry> = async ({ doc, operation, req }) => {
  if (operation !== 'create') return doc
  try {
    const settings = await req.payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
    const to = (settings.inquiryRecipients || settings.email || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    if (!to.length) {
      req.payload.logger.warn('Inquiry saved, but no notification email is set (Site settings › Switches).')
      return doc
    }

    const [topicEn, topicId] = TOPICS[doc.topic ?? 'general'] ?? TOPICS.general
    const adminUrl = `${req.payload.config.serverURL}/admin/collections/inquiries/${doc.id}`
    const rows: [string, string, unknown][] = [
      ['Name', 'Nama', doc.name],
      ['Email', 'Email', doc.email],
      ['WhatsApp', 'WhatsApp', doc.whatsapp],
      ['Topic', 'Topik', `${topicEn} / ${topicId}`],
      ['Visit date', 'Tanggal kunjungan', formatDate(doc.visitDate)],
      ['People', 'Jumlah orang', doc.people],
      ['Website language', 'Bahasa situs', doc.locale === 'id' ? 'Bahasa Indonesia' : 'English'],
    ]
    const filled = rows.filter(([, , value]) => value !== undefined && value !== null && value !== '')

    const html = `
<div style="font-family:Arial,sans-serif;font-size:15px;color:#1F2A24;line-height:1.5">
  <p><strong>New message from the website</strong><br>Pesan baru dari website</p>
  <table cellpadding="6" style="border-collapse:collapse">
    ${filled
      .map(
        ([en, id, value]) =>
          `<tr><td style="color:#5B6358;vertical-align:top">${en} / ${id}</td><td><strong>${escapeHtml(value)}</strong></td></tr>`,
      )
      .join('')}
  </table>
  <p style="color:#5B6358;margin-bottom:4px">Message / Pesan</p>
  <p style="white-space:pre-wrap;margin-top:0">${escapeHtml(doc.message)}</p>
  <p><a href="${escapeHtml(adminUrl)}">Open in the CMS / Buka di CMS</a></p>
  <p style="color:#5B6358;font-size:13px">Reply to this email to answer the visitor directly.<br>Balas email ini untuk menjawab pengunjung secara langsung.</p>
</div>`
    const text = [
      'New message from the website / Pesan baru dari website',
      '',
      ...filled.map(([en, id, value]) => `${en} / ${id}: ${value}`),
      '',
      'Message / Pesan:',
      String(doc.message ?? ''),
      '',
      `Open in the CMS / Buka di CMS: ${adminUrl}`,
    ].join('\n')

    await req.payload.sendEmail({
      to,
      replyTo: oneLine(doc.email),
      subject: oneLine(`New inquiry / Pertanyaan baru: ${topicEn} — ${doc.name}`).slice(0, 180),
      html,
      text,
    })
  } catch (error) {
    req.payload.logger.error({ err: error, msg: `Inquiry ${doc.id}: notification email failed` })
  }
  return doc
}
