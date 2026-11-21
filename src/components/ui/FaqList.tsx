import { ChevronDown } from 'lucide-react'

import type { Faq } from '@/payload-types'

/** F-10 accordion using native <details>: keyboard and screen-reader friendly without JS. */
export function FaqList({ faqs }: { faqs: Pick<Faq, 'id' | 'question' | 'answer'>[] }) {
  if (!faqs.length) return null
  return (
    <div className="flex flex-col border-t border-border">
      {faqs.map((faq, i) => (
        <details key={faq.id} className="group border-b border-border" open={i === 0}>
          <summary className="flex min-h-[3.25rem] cursor-pointer list-none items-center justify-between gap-4 py-3 text-body-lg font-bold text-foreground [&::-webkit-details-marker]:hidden">
            {faq.question}
            <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180" />
          </summary>
          <p className="pb-5 text-body text-muted-foreground">{faq.answer}</p>
        </details>
      ))}
    </div>
  )
}
