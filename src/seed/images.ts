/** pnpm seed:images [--force] — generate temporary photos and attach them (see tempImages.ts). */
import { getPayload } from 'payload'

import config from '../payload.config'
import { seedTempImages } from './tempImages'

try {
  const payload = await getPayload({ config })
  await seedTempImages(payload, (m) => console.log(`✓ ${m}`), process.argv.includes('--force'))
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}
