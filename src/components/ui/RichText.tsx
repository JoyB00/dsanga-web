import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { cn } from '@/lib/cn'

/** Renders Payload rich text with the site's body styles. */
export function RichText({ data, className }: { data?: unknown; className?: string }) {
  if (!data || typeof data !== 'object') return null
  return (
    <LexicalRichText
      data={data as SerializedEditorState}
      className={cn('flex flex-col gap-3 text-body text-muted-foreground [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc', className)}
    />
  )
}
