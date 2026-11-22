import { nodemailerAdapter } from '@payloadcms/email-nodemailer'

/**
 * Outgoing email over SMTP (works with Resend, Brevo, Mailgun, Google Workspace, …).
 *
 * Without SMTP_HOST, Payload writes emails to the server log instead of sending them,
 * which is what local development uses.
 */
export const emailAdapter = process.env.SMTP_HOST
  ? nodemailerAdapter({
      defaultFromAddress: process.env.EMAIL_FROM || 'no-reply@localhost',
      defaultFromName: process.env.EMAIL_FROM_NAME || 'D’Sanga website',
      transportOptions: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      },
    })
  : undefined
