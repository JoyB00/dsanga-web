import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

// Media served straight from R2 / CDN (src/integrations/storage.ts). Read at build time.
const storagePublicUrl = process.env.S3_PUBLIC_URL ? new URL(process.env.S3_PUBLIC_URL) : null

const nextConfig: NextConfig = {
  // Invoice PDFs (src/lib/invoice/pdf.ts): loads its font files with Node's fs.
  serverExternalPackages: ['pdfkit'],
  images: {
    // AVIF first (smaller hero photos on mobile data), WebP for older browsers.
    formats: ['image/avif', 'image/webp'],
    // Photo URLs carry ?v=<updatedAt>, so an optimised file can be kept for a month.
    minimumCacheTTL: 2678400,
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    remotePatterns: storagePublicUrl
      ? [
          {
            protocol: storagePublicUrl.protocol.replace(':', '') as 'https' | 'http',
            hostname: storagePublicUrl.hostname,
            pathname: `${storagePublicUrl.pathname.replace(/\/$/, '')}/**`,
          },
        ]
      : [],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
