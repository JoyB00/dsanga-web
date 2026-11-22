import { describe, expect, it, vi } from 'vitest'

import { notifyInquiry } from '@/hooks/notifyInquiry'

/** Unit test with a fake Payload: checks the email the PIC receives (F-14). */
const run = async (settings: Record<string, unknown>, doc: Record<string, unknown>, sendEmail = vi.fn()) => {
  const logger = { warn: vi.fn(), error: vi.fn() }
  const req = {
    payload: {
      config: { serverURL: 'https://dsanga.test' },
      findGlobal: vi.fn().mockResolvedValue(settings),
      sendEmail,
      logger,
    },
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await notifyInquiry({ doc, operation: 'create', req } as any)
  return { sendEmail, logger, result }
}

const doc = {
  id: 7,
  name: 'Made <b>Test</b>\r\nBcc: x@example.com',
  email: 'visitor@example.com',
  topic: 'pool',
  people: 2,
  message: 'Hi <script>alert(1)</script>',
  locale: 'id',
}

describe('notifyInquiry', () => {
  it('sends a bilingual, escaped email to the PIC with Reply-To set to the visitor', async () => {
    const { sendEmail, result } = await run({ inquiryRecipients: 'a@example.com, b@example.com' }, doc)
    expect(result).toBe(doc)
    const mail = sendEmail.mock.calls[0][0]
    expect(mail.to).toEqual(['a@example.com', 'b@example.com'])
    expect(mail.replyTo).toBe('visitor@example.com')
    expect(mail.subject).toBe('New inquiry / Pertanyaan baru: Pool — Made <b>Test</b> Bcc: x@example.com')
    expect(mail.subject).not.toMatch(/[\r\n]/)
    expect(mail.html).toContain('Name / Nama')
    expect(mail.html).toContain('Bahasa Indonesia')
    expect(mail.html).toContain('&lt;script&gt;')
    expect(mail.html).not.toContain('<script>')
    expect(mail.html).toContain('https://dsanga.test/admin/collections/inquiries/7')
    expect(mail.text).toContain('Message / Pesan:')
  })

  it('falls back to the contact email', async () => {
    const { sendEmail } = await run({ email: 'info@example.com' }, doc)
    expect(sendEmail.mock.calls[0][0].to).toEqual(['info@example.com'])
  })

  it('only warns when no address is set', async () => {
    const { sendEmail, logger } = await run({}, doc)
    expect(sendEmail).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalled()
  })

  it('never fails the submission when sending fails', async () => {
    const { logger, result } = await run({ email: 'info@example.com' }, doc, vi.fn().mockRejectedValue(new Error('SMTP down')))
    expect(result).toBe(doc)
    expect(logger.error).toHaveBeenCalled()
  })
})
