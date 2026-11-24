import { Download } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { cn } from '@/lib/cn'
import { getInvoiceByToken, invoiceView } from '@/lib/invoice/view'

type Props = { params: Promise<{ token: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const invoice = await getInvoiceByToken((await params).token)
  return invoice ? { title: `${invoice.invoiceNumber} — D’Sanga` } : {}
}

const CHIP = {
  unpaid: 'bg-[#FBEBD2] text-[#7A4B00]',
  paid: 'bg-[#DCEFE2] text-[#14532D]',
  void: 'bg-[#F6DADA] text-[#8A1C1C]',
} as const

/** What the customer sees from the WhatsApp link. Same content as the PDF. */
export default async function InvoicePage({ params }: Props) {
  const { token } = await params
  const invoice = await getInvoiceByToken(token)
  if (!invoice) notFound()
  const v = invoiceView(invoice)

  return (
    <main lang={v.locale} className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6 md:py-12">
      <article className="overflow-hidden rounded-card bg-surface shadow-raised">
        <header className="flex flex-wrap items-end justify-between gap-4 bg-primary px-5 py-6 md:px-10 md:py-8">
          <div>
            <p className="font-display text-[34px] leading-none font-bold text-white">D’Sanga</p>
            <p className="text-small text-accent-on-dark">Pool, Bistro &amp; Space</p>
          </div>
          <div className="sm:text-right">
            <h1 className="text-[28px] leading-none text-white lg:text-[28px]">{v.t.title}</h1>
            <p className="font-bold text-accent-on-dark tabular-nums">{v.number}</p>
          </div>
        </header>

        <div className="flex flex-col gap-7 px-5 py-6 md:px-10 md:py-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <address className="text-small text-muted-foreground not-italic">
              <strong className="block text-body text-foreground">{v.seller.name}</strong>
              {v.seller.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <div className="flex flex-col items-start gap-1 sm:items-end">
              <span className={cn('rounded-full px-4 py-1 font-bold', CHIP[v.status])}>
                {v.statusLabel}
              </span>
              {v.statusNote && (
                <span className="text-small text-muted-foreground">{v.statusNote}</span>
              )}
            </div>
          </div>

          <div className="grid gap-6 border-t border-border pt-6 sm:grid-cols-2">
            <div>
              <h2 className="font-sans text-caption font-bold tracking-[0.08em] text-muted-foreground uppercase lg:text-caption">
                {v.t.billTo}
              </h2>
              <strong className="block text-body-lg">{v.customer.name}</strong>
              {v.customer.lines.map((line) => (
                <span key={line} className="block text-small text-muted-foreground">
                  {line}
                </span>
              ))}
            </div>
            <dl className="flex flex-col gap-1 text-small">
              {v.details.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-bold">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <table className="w-full border-collapse text-left tabular-nums">
            <thead className="text-small text-primary max-sm:sr-only">
              <tr className="bg-background">
                <th scope="col" className="rounded-l-lg px-3 py-2.5">
                  {v.t.item}
                </th>
                <th scope="col" className="px-3 py-2.5">
                  {v.t.quantity}
                </th>
                <th scope="col" className="px-3 py-2.5 text-right">
                  {v.t.unitPrice}
                </th>
                <th scope="col" className="rounded-r-lg px-3 py-2.5 text-right">
                  {v.t.amount}
                </th>
              </tr>
            </thead>
            <tbody>
              {v.items.map((item) => (
                <tr key={item.id} className="border-b border-border align-top">
                  <td className="py-3 pr-3 font-bold sm:px-3">
                    {item.description}
                    <span className="block text-small font-normal text-muted-foreground sm:hidden">
                      {item.quantity} × {item.unitPrice}
                    </span>
                  </td>
                  <td className="px-3 py-3 max-sm:hidden">{item.quantity}</td>
                  <td className="px-3 py-3 text-right whitespace-nowrap max-sm:hidden">
                    {item.unitPrice}
                  </td>
                  <td className="py-3 text-right font-bold whitespace-nowrap sm:px-3">
                    {item.amount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="flex w-full flex-col gap-2 self-end sm:max-w-80">
            {v.sums.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 px-4">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="tabular-nums">{value}</dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 rounded-xl bg-primary px-4 py-3 text-white">
              <dt className="font-bold">{v.t.total}</dt>
              <dd className="text-[24px] leading-tight font-bold tabular-nums">{v.total}</dd>
            </div>
          </dl>

          {v.status === 'unpaid' && (
            <section className="flex flex-col gap-2">
              <h2 className="font-sans text-body-lg font-extrabold lg:text-body-lg">
                {v.t.payment}
              </h2>
              {v.seller.bankAccounts.length === 0 && (
                <p className="text-muted-foreground">{v.t.paymentAsk}</p>
              )}
              {v.seller.bankAccounts.map((account) => (
                <p key={`${account.bank}-${account.number}`}>
                  <strong className="block tabular-nums">
                    {account.bank} · {account.number}
                  </strong>
                  <span className="text-small text-muted-foreground">
                    {v.t.holder}: {account.holder}
                  </span>
                </p>
              ))}
            </section>
          )}
          {v.seller.terms && (
            <p className="text-small whitespace-pre-line text-muted-foreground">{v.seller.terms}</p>
          )}
        </div>
      </article>

      <a href={`/invoice/${token}/pdf`} className="btn-primary self-center">
        <Download className="size-5" aria-hidden="true" />
        {v.t.download}
      </a>
      <p className="text-center text-small text-muted-foreground">{v.t.thanks}</p>
    </main>
  )
}
