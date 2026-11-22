import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { AuditLogs } from './collections/AuditLogs'
import { Documents } from './collections/Documents'
import { Events } from './collections/Events'
import { Experiences } from './collections/Experiences'
import { Faqs } from './collections/Faqs'
import { Inquiries } from './collections/Inquiries'
import { Media } from './collections/Media'
import { MenuItems } from './collections/MenuItems'
import { Offers } from './collections/Offers'
import { PageIntros } from './collections/PageIntros'
import { Users } from './collections/Users'
import { VenuePackages } from './collections/VenuePackages'
import { AboutPage } from './globals/AboutPage'
import { HomePage } from './globals/HomePage'
import { PrivacyPage } from './globals/PrivacyPage'
import { SiteSettings } from './globals/SiteSettings'
import { requireBothLocales, requireBothLocalesGlobal } from './hooks/requireBothLocales'
import { withRevalidate, withRevalidateGlobal } from './hooks/revalidate'
import { emailAdapter } from './integrations/email'
import { storagePlugin } from './integrations/storage'
import type { CollectionConfig, GlobalConfig } from 'payload'

/** F-08: required text that must exist in both languages before publishing. */
const withBilingualPublish = (config: CollectionConfig, fields: string[]): CollectionConfig => ({
  ...config,
  hooks: { ...config.hooks, beforeChange: [...(config.hooks?.beforeChange ?? []), requireBothLocales(fields)] },
})
const withBilingualGlobal = (config: GlobalConfig, fields: string[]): GlobalConfig => ({
  ...config,
  hooks: { ...config.hooks, beforeChange: [...(config.hooks?.beforeChange ?? []), requireBothLocalesGlobal(fields)] },
})

/** Public content: bilingual publish check (where not built in) + on-demand page refresh. */
const contentCollections = [
  withBilingualPublish(Experiences, ['title', 'facilities.*.label', 'prices.*.label']),
  withBilingualPublish(MenuItems, ['name']),
  withBilingualPublish(Events, ['title']),
  withBilingualPublish(Offers, ['title']),
  withBilingualPublish(VenuePackages, ['name', 'inclusions.*.label']),
  withBilingualPublish(Faqs, ['question', 'answer']),
  PageIntros,
  Media,
  Documents,
].map(withRevalidate)

const contentGlobals = [withBilingualGlobal(SiteSettings, ['address']), HomePage, AboutPage, PrivacyPage].map(withRevalidateGlobal)

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    meta: {
      titleSuffix: '— D’Sanga CMS',
    },
  },
  // F-08: English is the default language, Indonesian is a full second language. No silent fallback.
  localization: {
    locales: [
      { code: 'en', label: 'English' },
      { code: 'id', label: 'Bahasa Indonesia' },
    ],
    defaultLocale: 'en',
    fallback: false,
  },
  collections: [...contentCollections, Inquiries, Users, AuditLogs],
  globals: contentGlobals,
  editor: lexicalEditor(),
  email: emailAdapter,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [
    storagePlugin,
    seoPlugin({
      collections: ['experiences', 'events', 'offers'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => `${(doc as { title?: string })?.title ?? 'D’Sanga'} — D’Sanga`,
    }),
  ],
})
