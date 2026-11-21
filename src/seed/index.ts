/**
 * Seeds the CMS with the temporary data from spec §14 (data sementara).
 * Every record is created with verified = false (F-15) so it is easy to find and replace before go-live.
 *
 *   pnpm seed
 *
 * Safe to run more than once: records are matched by a stable key and updated.
 */
import 'dotenv/config'
import { getPayload, type CollectionSlug, type Payload, type Where } from 'payload'

import config from '../payload.config'

type Data = Record<string, unknown>

const rich = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [{ type: 'text', text, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
      },
    ],
  },
})

const days = (n: number) => new Date(Date.now() + n * 86_400_000).toISOString()

/** n days from today at a fixed local Bali time (WITA, UTC+8), e.g. at(14, '16:00'). */
const at = (n: number, time: string) => {
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Makassar' }).format(new Date(Date.now() + n * 86_400_000))
  return new Date(`${day}T${time}:00+08:00`).toISOString()
}

async function upsert(
  payload: Payload,
  collection: CollectionSlug,
  where: Where,
  en: Data,
  id?: (doc: Data) => Data,
) {
  const found = await payload.find({ collection, where, limit: 1, locale: 'en', depth: 0 })
  const existing = found.docs[0] as unknown as Data | undefined
  const doc = (
    existing
      ? await payload.update({ collection, id: existing.id as number, data: en as never, locale: 'en', depth: 0 })
      : await payload.create({ collection, data: en as never, locale: 'en', depth: 0 })
  ) as unknown as Data
  if (id) {
    await payload.update({ collection, id: doc.id as number, data: id(doc) as never, locale: 'id', depth: 0 })
  }
  return doc
}

/** Re-use array row ids so the Indonesian update fills the same rows. */
const rows = (doc: Data, field: string, values: Data[]) =>
  ((doc[field] as Data[] | undefined) ?? []).map((row, i) => ({ ...row, ...values[i] }))

async function seed() {
  const payload = await getPayload({ config })
  const log = (msg: string) => payload.logger.info(`[seed] ${msg}`)

  // ── Admin account ────────────────────────────────────────────────────────────
  const adminEmail = process.env.SEED_ADMIN_EMAIL
  const adminPassword = process.env.SEED_ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    const { totalDocs } = await payload.count({ collection: 'users', where: { email: { equals: adminEmail } } })
    if (!totalDocs) {
      await payload.create({
        collection: 'users',
        data: { email: adminEmail, password: adminPassword, name: 'Super Admin (dev)', role: 'super-admin' },
      })
      log(`created super admin ${adminEmail}`)
    }
  } else {
    log('SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD not set — skipping admin account (create it at /admin instead)')
  }

  // ── Site settings ────────────────────────────────────────────────────────────
  const waNumber = process.env.SEED_WHATSAPP_NUMBER ?? ''
  if (!waNumber) log('SEED_WHATSAPP_NUMBER not set — WhatsApp buttons stay hidden until a vendor test number is added')
  const settings = await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'en',
    data: {
      whatsappNumber: waNumber || '0',
      serviceHours: 'Daily 08.00–20.00 WITA',
      email: process.env.SEED_CONTACT_EMAIL || undefined,
      address: 'Desa Sukawati, Gianyar, Bali',
      mapsUrl: 'https://maps.google.com/?q=Desa+Sukawati+Gianyar+Bali',
      openingHours: [
        { area: 'General area', weekday: '08.00–21.00', weekend: '08.00–21.00' },
        { area: 'Pool', weekday: '08.00–18.00', weekend: '07.00–18.00' },
        { area: 'Bistro & Coffee', weekday: '08.00–21.00', weekend: '08.00–21.00' },
        { area: 'Work & Space', weekday: '08.00–18.00', weekend: 'Closed' },
      ],
      specialHours: 'Closed on Nyepi (Balinese Day of Silence).',
      parking: 'Free parking for cars and motorbikes on site.',
      contactFormEnabled: true,
      verified: false,
    },
  })
  await payload.updateGlobal({
    slug: 'site-settings',
    locale: 'id',
    data: {
      serviceHours: 'Setiap hari 08.00–20.00 WITA',
      address: 'Desa Sukawati, Gianyar, Bali',
      openingHours: rows(settings as unknown as Data, 'openingHours', [
        { area: 'Area umum' },
        { area: 'Pool' },
        { area: 'Bistro & Coffee' },
        { area: 'Work & Space', weekend: 'Tutup' },
      ]),
      specialHours: 'Tutup saat Hari Raya Nyepi.',
      parking: 'Parkir gratis untuk mobil dan motor di lokasi.',
    },
  })
  log('site settings')

  // ── Experiences ──────────────────────────────────────────────────────────────
  const experiences: { en: Data; id: (d: Data) => Data }[] = [
    {
      en: {
        key: 'pool', type: 'pool', availability: 'available', order: 1,
        title: 'Pool', tagline: 'Swim, Play and Relax Together', whatsappContext: 'Pool',
        summary: 'An adult and a children’s pool surrounded by palm trees, with shaded loungers, showers and lockers.',
        hours: { weekday: '08.00–18.00', weekend: '07.00–18.00' },
        facilities: [{ label: 'Adult pool' }, { label: 'Children’s pool' }, { label: 'Showers & changing rooms' }, { label: 'Lockers' }],
        prices: [
          { label: 'Adult', weekday: 'Rp50.000', weekend: 'Rp60.000', unit: '/ person' },
          { label: 'Child (3–12 years)', weekday: 'Rp30.000', weekend: 'Rp40.000', unit: '/ person' },
          { label: 'Under 3 years', weekday: 'Free', weekend: 'Free' },
        ],
        rules: rich('Shower before entering the pool. No running, diving or glass near the pool.'),
        childPolicy: rich('Children under 12 must be accompanied by an adult in the water.'),
      },
      id: (d) => ({
        title: 'Pool', tagline: 'Berenang, Bermain dan Bersantai', whatsappContext: 'Pool',
        summary: 'Kolam dewasa dan kolam anak dikelilingi pohon kelapa, dengan kursi santai, shower dan loker.',
        facilities: rows(d, 'facilities', [{ label: 'Kolam dewasa' }, { label: 'Kolam anak' }, { label: 'Shower & ruang ganti' }, { label: 'Loker' }]),
        prices: rows(d, 'prices', [
          { label: 'Dewasa', unit: '/ orang' },
          { label: 'Anak (3–12 tahun)', unit: '/ orang' },
          { label: 'Di bawah 3 tahun', weekday: 'Gratis', weekend: 'Gratis' },
        ]),
        rules: rich('Bilas badan sebelum masuk kolam. Dilarang berlari, melompat, atau membawa gelas kaca di area kolam.'),
        childPolicy: rich('Anak di bawah 12 tahun wajib didampingi orang dewasa di dalam air.'),
      }),
    },
    {
      en: { key: 'dining', type: 'dining', availability: 'available', order: 2, title: 'Bistro', tagline: 'Good Food for Everyone', whatsappContext: 'Bistro', hours: { weekday: '08.00–21.00', weekend: '08.00–21.00' } },
      id: () => ({ title: 'Bistro', tagline: 'Makan Enak untuk Semua', whatsappContext: 'Bistro' }),
    },
    {
      en: { key: 'coffee', type: 'dining', availability: 'available', order: 3, title: 'Coffee', tagline: 'Specialty & Classic', whatsappContext: 'Coffee' },
      id: () => ({ title: 'Coffee', tagline: 'Specialty & Klasik', whatsappContext: 'Coffee' }),
    },
    {
      en: {
        key: 'work-space', type: 'work', availability: 'available', order: 4, title: 'Work & Space', tagline: 'Be More Productive, Surrounded by Nature', whatsappContext: 'Work & Space',
        capacity: '24 desks · 1 meeting room (8)',
        prices: [
          { label: 'Day pass', weekday: 'Rp75.000', unit: '/ day' },
          { label: 'Hourly (min. 2 hours)', weekday: 'Rp20.000', unit: '/ hour' },
          { label: 'Meeting room', weekday: 'Rp150.000', unit: '/ 2 hours' },
        ],
      },
      id: (d) => ({
        title: 'Work & Space', tagline: 'Kerja Lebih Produktif di Tengah Alam', whatsappContext: 'Work & Space',
        capacity: '24 meja · 1 ruang meeting (8)',
        prices: rows(d, 'prices', [{ label: 'Harian', unit: '/ hari' }, { label: 'Per jam (min. 2 jam)', unit: '/ jam' }, { label: 'Ruang meeting', unit: '/ 2 jam' }]),
      }),
    },
    {
      en: { key: 'playground', type: 'activity', availability: 'available', order: 5, title: 'Swing & Playground', tagline: 'Fun for All Ages', whatsappContext: 'Playground' },
      id: () => ({ title: 'Swing & Playground', tagline: 'Seru untuk Semua Usia', whatsappContext: 'Playground' }),
    },
    {
      en: { key: 'wellness', type: 'activity', availability: 'coming-soon', order: 6, title: 'Wellness', tagline: 'Yoga & Pilates', whatsappContext: 'Wellness' },
      id: () => ({ title: 'Wellness', tagline: 'Yoga & Pilates', whatsappContext: 'Wellness' }),
    },
  ]
  for (const exp of experiences) {
    await upsert(payload, 'experiences', { key: { equals: exp.en.key } }, { ...exp.en, verified: false, _status: 'published' }, exp.id)
  }
  log(`${experiences.length} experiences`)

  // ── Menu ─────────────────────────────────────────────────────────────────────
  const menu: [Data, Data][] = [
    [{ name: 'Nasi Campur Bali', description: 'Rice with mixed Balinese sides', category: 'mains', price: 55000, featured: true, dietaryNote: 'Spicy · Contains peanuts' }, { name: 'Nasi Campur Bali', description: 'Nasi dengan aneka lauk khas Bali', dietaryNote: 'Pedas · Mengandung kacang' }],
    [{ name: 'Grilled Chicken Bowl', description: 'Greens, sambal matah', category: 'mains', price: 65000, featured: true }, { name: 'Grilled Chicken Bowl', description: 'Sayuran, sambal matah' }],
    [{ name: 'Kids Pasta', description: 'Mild tomato sauce', category: 'kids', price: 40000, featured: true }, { name: 'Pasta Anak', description: 'Saus tomat tidak pedas' }],
    [{ name: 'Pisang Goreng', description: 'Palm sugar, coconut', category: 'snacks', price: 30000, featured: true }, { name: 'Pisang Goreng', description: 'Gula aren, kelapa' }],
    [{ name: 'Kopi Bali', description: 'Traditional brew', category: 'coffee', price: 15000 }, { name: 'Kopi Bali', description: 'Seduhan tradisional' }],
    [{ name: 'Fresh Coconut', description: 'Whole young coconut', category: 'drinks', price: 25000 }, { name: 'Kelapa Muda', description: 'Kelapa muda utuh' }],
  ]
  for (const [i, [en, id]] of menu.entries()) {
    await upsert(payload, 'menu-items', { name: { equals: en.name } }, { ...en, order: i, verified: false, _status: 'published' }, () => id)
  }
  log(`${menu.length} menu items`)

  // ── Events (one in the past, to show the archive) ───────────────────────────
  const events: [Data, Data][] = [
    [{ title: 'Live Acoustic Evening', category: 'music', startsAt: at(14, '16:00'), location: 'Bistro garden', capacity: 80, price: 'Free entry', summary: 'Local musicians, family-friendly.' }, { title: 'Malam Akustik', location: 'Taman bistro', price: 'Gratis', summary: 'Musisi lokal, ramah keluarga.' }],
    [{ title: 'Canang Sari Making for Families', category: 'workshop', startsAt: at(21, '09:00'), location: 'Pavilion', capacity: 20, price: 'Rp75.000', summary: 'Learn to make Balinese offerings.' }, { title: 'Membuat Canang Sari Bersama Keluarga', location: 'Pavilion', summary: 'Belajar membuat canang sari.' }],
    [{ title: 'Sukawati Creative Market #3', category: 'market', startsAt: at(-19, '10:00'), location: 'Whole site', summary: 'Local crafts, food stalls and music.' }, { title: 'Pasar Kreatif Sukawati #3', location: 'Seluruh area', summary: 'Kerajinan lokal, jajanan dan musik.' }],
  ]
  for (const [en, id] of events) {
    await upsert(payload, 'events', { title: { equals: en.title } }, { ...en, verified: false, _status: 'published' }, () => id)
  }
  log(`${events.length} events`)

  // ── Offers ───────────────────────────────────────────────────────────────────
  const offers: [Data, Data][] = [
    [{ title: 'Family Weekend Package', category: 'Pool + Dining', validFrom: days(-3), validUntil: days(40), price: 350000, originalPrice: 420000, summary: 'Pool entry for 2 adults + 2 children and a lunch set for four.', terms: rich('Saturdays and Sundays only. Cannot be combined with other offers.') }, { title: 'Paket Akhir Pekan Keluarga', summary: 'Tiket kolam untuk 2 dewasa + 2 anak dan paket makan siang berempat.', terms: rich('Hanya Sabtu dan Minggu. Tidak dapat digabung dengan promo lain.') }],
    [{ title: 'Work & Coffee Day Pass', category: 'Work & Space', validFrom: days(-1), validUntil: days(55), price: 65000, priceUnit: '/ day', summary: 'Full-day desk with Wi-Fi and two coffees.' }, { title: 'Paket Kerja & Kopi Harian', priceUnit: '/ hari', summary: 'Meja seharian dengan Wi-Fi dan dua kopi.' }],
  ]
  for (const [en, id] of offers) {
    await upsert(payload, 'offers', { title: { equals: en.title } }, { ...en, verified: false, _status: 'published' }, () => id)
  }
  log(`${offers.length} offers`)

  // ── Venue packages ───────────────────────────────────────────────────────────
  const packages: { en: Data; id: (d: Data) => Data }[] = [
    { en: { name: 'Garden Gathering', capacity: 30, order: 1, inclusions: [{ label: '3-hour garden area' }, { label: 'Snack & drink package' }] }, id: (d) => ({ name: 'Gathering di Taman', inclusions: rows(d, 'inclusions', [{ label: 'Area taman 3 jam' }, { label: 'Paket snack & minuman' }]) }) },
    { en: { name: 'Pavilion Event', capacity: 80, order: 2, inclusions: [{ label: 'Covered pavilion' }, { label: 'Lunch or dinner buffet' }] }, id: (d) => ({ name: 'Acara di Pavilion', inclusions: rows(d, 'inclusions', [{ label: 'Pavilion beratap' }, { label: 'Prasmanan makan siang atau malam' }]) }) },
    { en: { name: 'Full Venue', capacity: 150, order: 3, inclusions: [{ label: 'Pool + garden + pavilion' }, { label: 'Event coordinator' }] }, id: (d) => ({ name: 'Seluruh Area', inclusions: rows(d, 'inclusions', [{ label: 'Kolam + taman + pavilion' }, { label: 'Koordinator acara' }]) }) },
  ]
  for (const pkg of packages) {
    await upsert(payload, 'venue-packages', { name: { equals: pkg.en.name } }, { ...pkg.en, verified: false, _status: 'published' }, pkg.id)
  }
  log(`${packages.length} venue packages`)

  // ── FAQ ──────────────────────────────────────────────────────────────────────
  const faqs: [Data, Data][] = [
    [{ topic: 'general', question: 'Do I need to book before visiting?', answer: 'Walk-ins are welcome. For groups of 10 or more, contact us on WhatsApp first.' }, { question: 'Apakah harus reservasi sebelum datang?', answer: 'Pengunjung boleh langsung datang. Untuk rombongan 10 orang atau lebih, hubungi kami lewat WhatsApp terlebih dahulu.' }],
    [{ topic: 'pool', question: 'Can children swim without an adult?', answer: 'Children under 12 must be accompanied by an adult in the water.' }, { question: 'Apakah anak boleh berenang tanpa pendamping?', answer: 'Anak di bawah 12 tahun wajib didampingi orang dewasa di dalam air.' }],
    [{ topic: 'general', question: 'Which payment methods are accepted?', answer: 'Cash, QRIS and debit/credit cards.' }, { question: 'Metode pembayaran apa saja yang diterima?', answer: 'Tunai, QRIS, dan kartu debit/kredit.' }],
    [{ topic: 'visit', question: 'Is there parking on site?', answer: 'Yes, free parking for cars and motorbikes.' }, { question: 'Apakah tersedia parkir?', answer: 'Ya, parkir gratis untuk mobil dan motor.' }],
  ]
  for (const [i, [en, id]] of faqs.entries()) {
    await upsert(payload, 'faqs', { question: { equals: en.question } }, { ...en, order: i, verified: false }, () => id)
  }
  log(`${faqs.length} FAQs`)

  log('done — all records are marked as unverified temporary data (F-15)')
}

// `payload run` exits as soon as this module finishes importing, so await at top level.
try {
  await seed()
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}
