import { getPayload, type Payload } from 'payload'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'

import config from '@/payload.config'
import { expiryReminderTask, getExpiringOffers } from '@/lib/reminders'
import type { User } from '@/payload-types'

/**
 * Acceptance rules from the spec, checked through Payload's Local API as real users would hit them
 * (overrideAccess: false). Runs against the dev database; every record it creates starts with
 * "QA " or uses a @qa.test address and is removed afterwards.
 */
let payload: Payload
let contentAdmin: User
let approver: User

const day = 24 * 60 * 60 * 1000
const iso = (offsetDays: number) => new Date(Date.now() + offsetDays * day).toISOString()
const as = (user: User) => ({ user, overrideAccess: false })

const createUser = async (email: string, role: User['role']) => {
  await payload.delete({ collection: 'users', where: { email: { equals: email } } })
  return payload.create({ collection: 'users', data: { email, password: 'qa-test-password', name: email, role } })
}

beforeAll(async () => {
  payload = await getPayload({ config: await config })
  contentAdmin = await createUser('content@qa.test', 'content-admin')
  approver = await createUser('approver@qa.test', 'approver')
})

afterAll(async () => {
  const offers = await payload.find({ collection: 'offers', where: { title: { like: 'QA ' } }, draft: true, limit: 50, depth: 0 })
  for (const doc of offers.docs) await payload.delete({ collection: 'offers', id: doc.id })
  const faqs = await payload.find({ collection: 'faqs', where: { question: { like: 'QA ' } }, draft: true, limit: 50, depth: 0 })
  for (const doc of faqs.docs) await payload.delete({ collection: 'faqs', id: doc.id })
  await payload.delete({ collection: 'inquiries', where: { email: { like: '@qa.test' } } })
  await payload.delete({ collection: 'payload-jobs', where: { taskSlug: { equals: 'schedulePublish' }, 'input.user.value': { in: [contentAdmin.id, approver.id] } } as never }).catch(() => undefined)
  // Audit entries first: deleting the users would unlink them.
  await payload.delete({
    collection: 'audit-logs',
    where: { or: [{ user: { in: [contentAdmin.id, approver.id] } }, { summary: { like: '@qa.test' } }, { summary: { like: 'QA ' } }] },
  })
  await payload.delete({ collection: 'users', where: { email: { like: '@qa.test' } } })
})

describe('F-11 approval + F-13 expiry + F-15 verified flag + F-12 audit log (offers)', () => {
  let offerId: number

  it('content admin can save a draft offer', async () => {
    const offer = await payload.create({
      collection: 'offers',
      locale: 'en',
      draft: true,
      data: { title: 'QA Offer', validFrom: iso(-1), validUntil: iso(7), _status: 'draft' },
      ...as(contentAdmin),
    })
    offerId = offer.id
    expect(offer._status).toBe('draft')
  })

  it('content admin cannot publish it (F-11)', async () => {
    await expect(
      payload.update({ collection: 'offers', id: offerId, locale: 'en', data: { _status: 'published' }, ...as(contentAdmin) }),
    ).rejects.toThrow(/approval/i)
  })

  it('publishing needs both languages (F-08), then the approver can publish', async () => {
    await expect(
      payload.update({ collection: 'offers', id: offerId, locale: 'en', data: { _status: 'published' }, ...as(approver) }),
    ).rejects.toThrow(/Bahasa Indonesia/)
    await payload.update({ collection: 'offers', id: offerId, locale: 'id', draft: true, data: { title: 'QA Promo' }, ...as(approver) })
    const published = await payload.update({ collection: 'offers', id: offerId, locale: 'en', data: { _status: 'published' }, ...as(approver) })
    expect(published._status).toBe('published')
    const id = await payload.findByID({ collection: 'offers', id: offerId, locale: 'id', fallbackLocale: false })
    expect(id.title).toBe('QA Promo')
  })

  it('visitors see an active offer and stop seeing it once it expires (F-13)', async () => {
    const find = () =>
      payload.find({ collection: 'offers', where: { id: { equals: offerId } }, overrideAccess: false, depth: 0 })
    expect((await find()).totalDocs).toBe(1)
    await payload.update({ collection: 'offers', id: offerId, data: { validUntil: iso(-1) } })
    expect((await find()).totalDocs).toBe(0)
  })

  it('only an approver can tick Verified (F-15)', async () => {
    const byAdmin = await payload.update({ collection: 'offers', id: offerId, draft: true, data: { verified: true }, ...as(contentAdmin) })
    expect(byAdmin.verified).toBeFalsy()
    const byApprover = await payload.update({ collection: 'offers', id: offerId, draft: true, data: { verified: true }, ...as(approver) })
    expect(byApprover.verified).toBe(true)
  })

  it('changes are written to the audit log (F-12)', async () => {
    const logs = await payload.find({ collection: 'audit-logs', where: { documentId: { equals: String(offerId) } }, depth: 0 })
    expect(logs.totalDocs).toBeGreaterThan(0)
  })
})

describe('F-08 bilingual publish check (FAQ)', () => {
  it('refuses to publish with only English', async () => {
    await expect(
      payload.create({
        collection: 'faqs',
        locale: 'en',
        data: { question: 'QA English only?', answer: 'Yes.', topic: 'general', _status: 'published' },
        ...as(approver),
      }),
    ).rejects.toThrow(/Missing: .*Bahasa Indonesia/)
  })

  it('publishes once both languages are filled, each keeping its own text', async () => {
    const draft = await payload.create({
      collection: 'faqs',
      locale: 'en',
      draft: true,
      data: { question: 'QA Both languages?', answer: 'Yes.', topic: 'general', _status: 'draft' },
      ...as(approver),
    })
    await payload.update({ collection: 'faqs', id: draft.id, locale: 'id', draft: true, data: { question: 'QA Dua bahasa?', answer: 'Ya.' }, ...as(approver) })
    await payload.update({ collection: 'faqs', id: draft.id, locale: 'en', data: { _status: 'published' }, ...as(approver) })
    const en = await payload.findByID({ collection: 'faqs', id: draft.id, locale: 'en', fallbackLocale: false })
    const id = await payload.findByID({ collection: 'faqs', id: draft.id, locale: 'id', fallbackLocale: false })
    expect([en._status, en.question, id.question]).toEqual(['published', 'QA Both languages?', 'QA Dua bahasa?'])
  })
})

describe('F-14 contact form (public create)', () => {
  const base = { name: 'QA Visitor', email: 'visitor@qa.test', message: 'Hello', topic: 'general' as const, consent: true }

  it('accepts a valid message', async () => {
    const doc = await payload.create({ collection: 'inquiries', data: base, overrideAccess: false })
    expect(doc.status).toBe('new')
  })

  it('rejects missing consent and the honeypot', async () => {
    await expect(payload.create({ collection: 'inquiries', data: { ...base, consent: false }, overrideAccess: false })).rejects.toThrow()
    await expect(payload.create({ collection: 'inquiries', data: { ...base, website: 'spam.example' }, overrideAccess: false })).rejects.toThrow(/Invalid/)
  })

  it('rejects messages while the form is switched off', async () => {
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    await payload.updateGlobal({ slug: 'site-settings', data: { contactFormEnabled: false } })
    try {
      await expect(payload.create({ collection: 'inquiries', data: base, overrideAccess: false })).rejects.toThrow(/turned off/)
    } finally {
      await payload.updateGlobal({ slug: 'site-settings', data: { contactFormEnabled: settings.contactFormEnabled } })
    }
  })

  it('visitors cannot read messages', async () => {
    await expect(payload.find({ collection: 'inquiries', overrideAccess: false })).rejects.toThrow()
  })
})

describe('F-01 scheduled publishing (jobs queue)', () => {
  const queueAndRun = async (doc: { relationTo: 'faqs' | 'offers'; value: number }, user: User) => {
    await payload.jobs.queue({
      task: 'schedulePublish',
      input: { type: 'publish', doc: { relationTo: doc.relationTo, value: String(doc.value) }, user: { relationTo: 'users', value: user.id } },
      waitUntil: new Date(Date.now() - 1000),
    } as never)
    await payload.jobs.run({ queue: 'default' })
  }

  it('publishes a draft at the scheduled time, as the approver who scheduled it', async () => {
    const draft = await payload.create({
      collection: 'faqs', locale: 'en', draft: true,
      data: { question: 'QA Scheduled?', answer: 'Yes.', topic: 'general', _status: 'draft' }, ...as(approver),
    })
    await payload.update({ collection: 'faqs', id: draft.id, locale: 'id', draft: true, data: { question: 'QA Terjadwal?', answer: 'Ya.' }, ...as(approver) })
    await queueAndRun({ relationTo: 'faqs', value: draft.id }, approver)
    expect((await payload.findByID({ collection: 'faqs', id: draft.id }))._status).toBe('published')
  })

  it('cannot bypass approval: a content admin’s scheduled offer stays a draft (F-11)', async () => {
    const offer = await payload.create({
      collection: 'offers', locale: 'en', draft: true,
      data: { title: 'QA Scheduled offer', validFrom: iso(-1), validUntil: iso(5), _status: 'draft' }, ...as(contentAdmin),
    })
    await queueAndRun({ relationTo: 'offers', value: offer.id }, contentAdmin)
    expect((await payload.findByID({ collection: 'offers', id: offer.id, draft: true }))._status).toBe('draft')
  })
})

describe('F-12 audit log covers accounts and settings', () => {
  it('logs account changes without the password', async () => {
    await payload.update({ collection: 'users', id: contentAdmin.id, data: { name: 'QA renamed' }, ...as(contentAdmin) })
    const logs = await payload.find({ collection: 'audit-logs', where: { collectionSlug: { equals: 'users' }, documentId: { equals: String(contentAdmin.id) } } })
    expect(logs.docs[0]?.summary).toBe('content@qa.test · content-admin')
  })

  it('logs Site settings changes', async () => {
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0 })
    await payload.updateGlobal({ slug: 'site-settings', data: { contactFormEnabled: settings.contactFormEnabled }, ...as(approver) })
    const logs = await payload.find({ collection: 'audit-logs', where: { collectionSlug: { equals: 'global:site-settings' }, user: { equals: approver.id } } })
    expect(logs.totalDocs).toBeGreaterThan(0)
  })
})

describe('F-13 reminder for offers ending soon', () => {
  it('lists published offers ending within 7 days and emails them', async () => {
    const offer = await payload.create({
      collection: 'offers', locale: 'en',
      data: { title: 'QA Ending soon', validFrom: iso(-1), validUntil: iso(3), _status: 'published' },
    })
    await payload.update({ collection: 'offers', id: offer.id, locale: 'id', data: { title: 'QA Segera berakhir' } })
    expect((await getExpiringOffers(payload)).map((o) => o.title)).toContain('QA Ending soon')

    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 0, overrideAccess: true })
    await payload.updateGlobal({ slug: 'site-settings', data: { reminderRecipients: 'pic@qa.test' } })
    const send = vi.spyOn(payload, 'sendEmail').mockResolvedValue(undefined as never)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (expiryReminderTask.handler as any)({ req: { payload }, input: {} })
      const mail = send.mock.calls[0]?.[0] as { to: string[]; html: string; subject: string }
      expect(mail.to).toEqual(['pic@qa.test'])
      expect(mail.subject).toMatch(/end within 7 days \/ .* promo berakhir/)
      expect(mail.html).toContain('QA Ending soon')
    } finally {
      send.mockRestore()
      await payload.updateGlobal({ slug: 'site-settings', data: { reminderRecipients: settings.reminderRecipients ?? null } })
    }
  })
})
