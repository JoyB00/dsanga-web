import { s3Storage } from '@payloadcms/storage-s3'

/**
 * Media and PDFs in Cloudflare R2 (spec §10: "Cloudflare R2 atau penyimpanan kompatibel S3").
 *
 * Off unless S3_BUCKET is set: local development keeps files on disk (./media, ./documents).
 * `alwaysInsertFields` keeps the database schema identical with and without R2, so switching
 * it on later needs no migration of its own.
 *
 * Files are served in one of two ways:
 *  - S3_PUBLIC_URL set (R2 custom domain or r2.dev URL): browsers load files straight from R2/CDN.
 *  - S3_PUBLIC_URL empty: files stream through Payload at /api/media/file/…, keeping access rules.
 */
const bucket = process.env.S3_BUCKET || ''
const publicUrl = (process.env.S3_PUBLIC_URL || '').replace(/\/$/, '')

const collection = (prefix: string) => ({
  prefix,
  ...(publicUrl
    ? {
        disablePayloadAccessControl: true as const,
        generateFileURL: ({ filename, prefix: docPrefix }: { filename: string; prefix?: string }) =>
          `${publicUrl}/${docPrefix || prefix}/${encodeURIComponent(filename)}`,
      }
    : {}),
})

export const storagePlugin = s3Storage({
  enabled: Boolean(bucket),
  alwaysInsertFields: true,
  bucket,
  collections: {
    media: collection('media'),
    documents: collection('documents'),
  },
  config: {
    // R2: https://<ACCOUNT_ID>.r2.cloudflarestorage.com, region "auto".
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION || 'auto',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
  },
})
