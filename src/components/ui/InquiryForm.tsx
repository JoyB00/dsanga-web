'use client'

import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react'
import Link from 'next/link'
import { useId, useRef, useState, type FormEvent } from 'react'

import type { Locale } from '@/i18n/config'
import type { Dictionary } from '@/i18n/dictionaries'
import { trackEvent } from '@/lib/analytics'

type Variant = 'contact' | 'work'
type Field = 'name' | 'email' | 'message' | 'consent' | 'visitDate' | 'people'
type Errors = Partial<Record<Field, string>>

type Props = {
  variant: Variant
  locale: Locale
  t: Dictionary['form']
  privacyHref: string
  /** Work & Space usage types from the CMS price rows, e.g. ["Day pass", "Meeting room"]. */
  usageOptions?: string[]
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * F-14 short form → POST /api/inquiries. Visible labels, errors under each field, focus moves to
 * the first invalid field, honeypot against spam. The server re-checks everything.
 */
export function InquiryForm({ variant, locale, t, privacyHref, usageOptions = [] }: Props) {
  const id = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

  const validate = (data: FormData): Errors => {
    const e: Errors = {}
    if (!String(data.get('name') ?? '').trim()) e.name = t.errors.required
    const email = String(data.get('email') ?? '').trim()
    if (!email) e.email = t.errors.required
    else if (!EMAIL.test(email)) e.email = t.errors.email
    if (variant === 'contact' && !String(data.get('message') ?? '').trim()) e.message = t.errors.required
    if (variant === 'work') {
      if (!data.get('visitDate')) e.visitDate = t.errors.required
      if (!Number(data.get('people'))) e.people = t.errors.required
    }
    if (!data.get('consent')) e.consent = t.errors.consent
    return e
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const found = validate(data)
    setErrors(found)
    const firstInvalid = Object.keys(found)[0]
    if (firstInvalid) {
      form.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus()
      return
    }

    const usage = String(data.get('usage') ?? '')
    const notes = String(data.get('message') ?? '').trim()
    const body = {
      name: String(data.get('name')).trim(),
      email: String(data.get('email')).trim(),
      whatsapp: String(data.get('whatsapp') ?? '').trim() || undefined,
      topic: variant === 'work' ? 'work' : String(data.get('topic') || 'general'),
      visitDate: data.get('visitDate') || undefined,
      people: data.get('people') ? Number(data.get('people')) : undefined,
      message: variant === 'work' ? [usage && `${t.usage}: ${usage}`, notes].filter(Boolean).join('\n') || usage || '-' : notes,
      consent: true,
      website: String(data.get('website') ?? ''),
      locale,
    }

    setStatus('sending')
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(String(res.status))
      trackEvent('generate_lead', { form: variant, topic: body.topic, site_language: locale })
      setStatus('sent')
      form.reset()
    } catch {
      setStatus('failed')
    }
  }

  if (status === 'sent') {
    return (
      <p role="status" className="card flex items-start gap-3 self-start border-2 border-primary p-6 text-body">
        <CircleCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        {t.success}
      </p>
    )
  }

  const fieldError = (field: Field) =>
    errors[field] ? (
      <span id={`${id}-${field}-error`} className="field-error">
        {errors[field]}
      </span>
    ) : null
  const describedBy = (field: Field) => (errors[field] ? `${id}-${field}-error` : undefined)

  return (
    <form ref={formRef} noValidate onSubmit={onSubmit} className="card flex flex-col gap-5 p-6 md:p-8">
      <p className="text-small text-muted-foreground">{t.requiredNote}</p>

      <label className="field-label">
        {t.name} *
        <input name="name" type="text" autoComplete="name" className="field-input" aria-invalid={!!errors.name} aria-describedby={describedBy('name')} />
        {fieldError('name')}
      </label>

      {variant === 'work' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="field-label">
            {t.date} *
            <input name="visitDate" type="date" className="field-input" aria-invalid={!!errors.visitDate} aria-describedby={describedBy('visitDate')} />
            {fieldError('visitDate')}
          </label>
          <label className="field-label">
            {t.people} *
            <input name="people" type="number" inputMode="numeric" min={1} defaultValue={1} className="field-input" aria-invalid={!!errors.people} aria-describedby={describedBy('people')} />
            {fieldError('people')}
          </label>
        </div>
      )}

      {variant === 'work' && usageOptions.length > 0 && (
        <label className="field-label">
          {t.usage}
          <select name="usage" className="field-input">
            {usageOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field-label">
          {t.email} *
          <input name="email" type="email" autoComplete="email" className="field-input" aria-invalid={!!errors.email} aria-describedby={describedBy('email')} />
          {fieldError('email')}
        </label>
        <label className="field-label">
          {t.whatsapp}
          <input name="whatsapp" type="tel" inputMode="tel" autoComplete="tel" className="field-input" />
        </label>
      </div>

      {variant === 'contact' && (
        <label className="field-label">
          {t.topic}
          <select name="topic" className="field-input" defaultValue="general">
            {Object.entries(t.topics).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="field-label">
        {variant === 'contact' ? `${t.message} *` : t.notes}
        <textarea
          name="message"
          rows={5}
          className="field-input min-h-32 py-3"
          aria-invalid={!!errors.message}
          aria-describedby={describedBy('message')}
        />
        {fieldError('message')}
      </label>

      {/* Honeypot: hidden from people and screen readers, bots fill it in (F-09). */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="flex items-start gap-3 text-small">
          <input
            name="consent"
            type="checkbox"
            className="mt-0.5 size-5 shrink-0 accent-[var(--ds-color-primary)]"
            aria-invalid={!!errors.consent}
            aria-describedby={describedBy('consent')}
          />
          <span>
            {t.consentBefore}{' '}
            <Link href={privacyHref} className="font-bold">
              {t.consentLink}
            </Link>
            .
          </span>
        </label>
        {fieldError('consent')}
      </div>

      {status === 'failed' && (
        <p role="alert" className="flex items-start gap-2 text-small font-semibold text-danger">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t.errorGeneric}
        </p>
      )}

      <button type="submit" className="btn-primary self-start" disabled={status === 'sending'}>
        {status === 'sending' && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
        {status === 'sending' ? t.sending : variant === 'work' ? t.submitWork : t.submit}
      </button>
    </form>
  )
}
