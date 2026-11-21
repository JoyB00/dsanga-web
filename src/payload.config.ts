import { postgresAdapter } from '@payloadcms/db-postgres'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { AuditLogs } from './collections/AuditLogs'
import { Events } from './collections/Events'
import { Experiences } from './collections/Experiences'
import { Faqs } from './collections/Faqs'
import { Inquiries } from './collections/Inquiries'
import { Media } from './collections/Media'
import { MenuItems } from './collections/MenuItems'
import { Offers } from './collections/Offers'
import { Users } from './collections/Users'
import { VenuePackages } from './collections/VenuePackages'
import { SiteSettings } from './globals/SiteSettings'

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
  collections: [Experiences, MenuItems, Events, Offers, VenuePackages, Faqs, Media, Inquiries, Users, AuditLogs],
  globals: [SiteSettings],
  editor: lexicalEditor(),
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
    seoPlugin({
      collections: ['experiences', 'events', 'offers'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }) => `${(doc as { title?: string })?.title ?? 'D’Sanga'} — D’Sanga`,
    }),
  ],
})
