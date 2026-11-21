import type { Metadata } from 'next'

import { PagePlaceholder } from '@/components/PagePlaceholder'
import { isLocale, type Locale } from '@/i18n/config'
import { getDictionary } from '@/i18n/dictionaries'

type Props = { params: Promise<{ locale: string }> }

const resolve = async (params: Props['params']): Promise<Locale> => {
  const { locale } = await params
  return isLocale(locale) ? locale : 'en'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: getDictionary(await resolve(params)).nav.offers }
}

export default async function Page({ params }: Props) {
  return <PagePlaceholder locale={await resolve(params)} routeKey="offers" />
}
