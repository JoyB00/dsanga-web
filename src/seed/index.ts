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

import { getDictionary } from '../i18n/dictionaries'
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

/** Rich text with one paragraph per line. */
const richParagraphs = (lines: string[]) => {
  const doc = rich(lines[0] ?? '')
  doc.root.children = lines.map((line) => ({ ...rich(line).root.children[0] }))
  return doc
}

/** Page copy: English first (creates array rows), then Indonesian into the same rows. */
async function seedPages(payload: Payload, log: (m: string) => void) {
  const en = getDictionary('en')
  const id = getDictionary('id')
  const valueIcons = ['leaf', 'users', 'calendar', 'house']

  // Home page
  const home = (await payload.updateGlobal({
    slug: 'home-page',
    locale: 'en',
    data: {
      _status: 'published',
      hero: { eyebrow: en.home.eyebrow, title: en.home.title, intro: en.home.intro },
      experiences: { eyebrow: en.home.experiencesEyebrow, title: en.home.experiencesTitle, intro: en.home.experiencesIntro },
      highlights: { eyebrow: en.home.offersEyebrow, title: en.home.offersTitle },
      about: {
        eyebrow: en.home.aboutEyebrow,
        title: en.home.aboutTitle,
        text: en.home.aboutText,
        values: Object.values(en.home.values).map((label, i) => ({ label, icon: valueIcons[i] })),
      },
      gallery: { eyebrow: en.home.galleryEyebrow, title: en.home.galleryTitle },
      visit: { eyebrow: en.home.visitEyebrow, title: en.home.visitTitle },
    } as never,
  })) as unknown as { about: Data }
  await payload.updateGlobal({
    slug: 'home-page',
    locale: 'id',
    data: {
      _status: 'published',
      hero: { eyebrow: id.home.eyebrow, title: id.home.title, intro: id.home.intro },
      experiences: { eyebrow: id.home.experiencesEyebrow, title: id.home.experiencesTitle, intro: id.home.experiencesIntro },
      highlights: { eyebrow: id.home.offersEyebrow, title: id.home.offersTitle },
      about: {
        eyebrow: id.home.aboutEyebrow,
        title: id.home.aboutTitle,
        text: id.home.aboutText,
        values: rows(home.about, 'values', Object.values(id.home.values).map((label) => ({ label }))),
      },
      gallery: { eyebrow: id.home.galleryEyebrow, title: id.home.galleryTitle },
      visit: { eyebrow: id.home.visitEyebrow, title: id.home.visitTitle },
    } as never,
  })

  // About page
  const aboutData = (t: typeof en) => ({
    _status: 'published',
    hero: { title: t.about.title, tagline: t.about.tagline, intro: t.about.intro },
    story: { eyebrow: t.about.storyEyebrow, title: t.about.storyTitle, body: richParagraphs(t.about.story) },
    managed: { eyebrow: t.about.managedEyebrow, title: t.about.managedTitle, text: t.about.managedText },
    cta: { title: t.about.ctaTitle, text: t.about.ctaText },
  })
  const about = (await payload.updateGlobal({
    slug: 'about-page',
    locale: 'en',
    data: {
      ...aboutData(en),
      purpose: { eyebrow: en.about.purposeEyebrow, title: en.about.purposeTitle, items: en.about.purpose.map((text) => ({ text })) },
      values: {
        eyebrow: en.about.valuesEyebrow,
        title: en.about.valuesTitle,
        items: en.about.values.map((v, i) => ({ title: v.title, text: v.text, icon: ['leaf', 'users', 'house', 'calendar'][i] })),
      },
    } as never,
  })) as unknown as { purpose: Data; values: Data }
  await payload.updateGlobal({
    slug: 'about-page',
    locale: 'id',
    data: {
      ...aboutData(id),
      purpose: { eyebrow: id.about.purposeEyebrow, title: id.about.purposeTitle, items: rows(about.purpose, 'items', id.about.purpose.map((text) => ({ text }))) },
      values: {
        eyebrow: id.about.valuesEyebrow,
        title: id.about.valuesTitle,
        items: rows(about.values, 'items', id.about.values.map((v) => ({ title: v.title, text: v.text }))),
      },
    } as never,
  })

  // Privacy policy (temporary text, spec §14)
  const privacy = (await payload.updateGlobal({
    slug: 'privacy-page',
    locale: 'en',
    data: {
      _status: 'published',
      title: en.privacy.title,
      lastUpdated: new Date().toISOString(),
      sections: en.privacy.sections.map((s) => ({ anchor: s.id, title: s.title, body: richParagraphs(s.body) })),
    } as never,
  })) as unknown as Data
  await payload.updateGlobal({
    slug: 'privacy-page',
    locale: 'id',
    data: {
      _status: 'published',
      title: id.privacy.title,
      sections: rows(privacy, 'sections', id.privacy.sections.map((s) => ({ title: s.title, body: richParagraphs(s.body) }))),
    } as never,
  })

  // Page headers
  const intros = [
    { page: 'activities', en: { title: en.activities.title, tagline: en.activities.tagline, intro: en.activities.intro }, id: { title: id.activities.title, tagline: id.activities.tagline, intro: id.activities.intro } },
    { page: 'events', en: { title: en.events.title, tagline: en.events.tagline, intro: en.events.intro }, id: { title: id.events.title, tagline: id.events.tagline, intro: id.events.intro } },
    { page: 'offers', en: { title: en.offers.title, intro: en.offers.intro }, id: { title: id.offers.title, intro: id.offers.intro } },
    { page: 'gallery', en: { title: en.gallery.title, intro: en.gallery.intro }, id: { title: id.gallery.title, intro: id.gallery.intro } },
    { page: 'visit', en: { title: en.visit.title, tagline: en.visit.tagline }, id: { title: id.visit.title, tagline: id.visit.tagline } },
    { page: 'contact', en: { title: en.contact.title, intro: en.contact.intro }, id: { title: id.contact.title, intro: id.contact.intro } },
  ]
  for (const intro of intros) {
    await upsert(payload, 'page-intros', { page: { equals: intro.page } }, { page: intro.page, ...intro.en, verified: false, _status: 'published' }, () => ({ ...intro.id, _status: 'published' }))
  }
  log(`page copy: home, about, privacy + ${intros.length} page headers`)
}

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
      transport: 'About 60 minutes by car or ride-hailing from the airport.\nAbout 25 minutes from Ubud, near Sukawati Art Market.',
      accessibility: 'Step-free path to the bistro and pool deck. Accessible toilet available.',
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
      transport: 'Sekitar 60 menit dari bandara dengan mobil atau ojek/taksi online.\nSekitar 25 menit dari Ubud, dekat Pasar Seni Sukawati.',
      accessibility: 'Jalur tanpa tangga ke bistro dan dek kolam. Tersedia toilet ramah disabilitas.',
    },
  })
  log('site settings')

  await seedPages(payload, log)

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
      en: {
        key: 'dining', type: 'dining', availability: 'available', order: 2, title: 'Bistro', tagline: 'Good Food for Everyone', whatsappContext: 'Bistro',
        summary: 'Local and international dishes, specialty and classic coffee, served indoors or in the garden. Open to pool guests and walk-in visitors.',
        hours: { weekday: '08.00–21.00', weekend: '08.00–21.00' },
        facilities: [{ label: 'Indoor pavilion · 40 seats' }, { label: 'Garden tables · 60 seats' }, { label: 'Poolside snacks & drinks' }],
      },
      id: (d) => ({
        title: 'Bistro', tagline: 'Makan Enak untuk Semua', whatsappContext: 'Bistro',
        summary: 'Hidangan lokal dan internasional, kopi specialty dan klasik, disajikan di dalam ruangan atau di taman. Terbuka untuk tamu kolam dan pengunjung umum.',
        facilities: rows(d, 'facilities', [{ label: 'Pavilion dalam · 40 kursi' }, { label: 'Meja taman · 60 kursi' }, { label: 'Camilan & minuman tepi kolam' }]),
      }),
    },
    {
      en: { key: 'coffee', type: 'dining', availability: 'available', order: 3, title: 'Coffee', tagline: 'Specialty & Classic', whatsappContext: 'Coffee', summary: 'Single-origin Bali beans for manual brew, classic espresso drinks and traditional kopi Bali.' },
      id: () => ({ title: 'Coffee', tagline: 'Specialty & Klasik', whatsappContext: 'Coffee', summary: 'Biji kopi single-origin Bali untuk manual brew, espresso klasik, dan kopi Bali tradisional.' }),
    },
    {
      en: {
        key: 'work-space', type: 'work', availability: 'available', order: 4, title: 'Work & Space', tagline: 'Be More Productive, Surrounded by Nature', whatsappContext: 'Work & Space',
        capacity: '24 desks · 1 meeting room (8)',
        summary: 'Open-air pavilion desks with fast Wi-Fi, power at every table, coffee and food from the bistro, and a meeting room for small teams.',
        facilities: [{ label: 'Fast Wi-Fi' }, { label: 'Comfortable desks' }, { label: 'Meeting room (optional)' }, { label: 'Coffee & food' }, { label: 'Calm atmosphere' }],
        terms: rich('Desk passes are first come, first served. The meeting room needs confirmation by our staff.'),
        prices: [
          { label: 'Day pass', weekday: 'Rp75.000', unit: '/ day' },
          { label: 'Hourly (min. 2 hours)', weekday: 'Rp20.000', unit: '/ hour' },
          { label: 'Meeting room', weekday: 'Rp150.000', unit: '/ 2 hours' },
        ],
      },
      id: (d) => ({
        title: 'Work & Space', tagline: 'Kerja Lebih Produktif di Tengah Alam', whatsappContext: 'Work & Space',
        capacity: '24 meja · 1 ruang meeting (8)',
        summary: 'Meja di pavilion terbuka dengan Wi-Fi cepat, colokan di setiap meja, kopi dan makanan dari bistro, serta ruang meeting untuk tim kecil.',
        facilities: rows(d, 'facilities', [{ label: 'Wi-Fi cepat' }, { label: 'Meja nyaman' }, { label: 'Ruang meeting (opsional)' }, { label: 'Kopi & makanan' }, { label: 'Suasana tenang' }]),
        terms: rich('Meja harian berlaku siapa cepat dia dapat. Ruang meeting perlu dikonfirmasi oleh petugas kami.'),
        prices: rows(d, 'prices', [{ label: 'Harian', unit: '/ hari' }, { label: 'Per jam (min. 2 jam)', unit: '/ jam' }, { label: 'Ruang meeting', unit: '/ 2 jam' }]),
      }),
    },
    {
      en: {
        key: 'playground', type: 'activity', availability: 'available', order: 5, title: 'Swing & Playground', tagline: 'Fun for All Ages', whatsappContext: 'Playground',
        summary: 'Wooden swings, slides and a sand area in the shade, next to the bistro garden so parents can watch from their table.',
        hours: { weekday: '08.00–18.00', weekend: '08.00–18.00' },
        prices: [{ label: 'Entry', weekday: 'Free with entry' }],
        rules: rich('One child per swing. Shoes off in the sand area. Closed during heavy rain.'),
        childPolicy: rich('For ages 2–12. An adult must stay nearby at all times.'),
      },
      id: (d) => ({
        title: 'Swing & Playground', tagline: 'Seru untuk Semua Usia', whatsappContext: 'Playground',
        summary: 'Ayunan kayu, perosotan, dan area pasir yang teduh, di samping taman bistro sehingga orang tua bisa mengawasi dari meja.',
        prices: rows(d, 'prices', [{ label: 'Masuk', weekday: 'Gratis dengan tiket masuk' }]),
        rules: rich('Satu anak per ayunan. Lepas alas kaki di area pasir. Tutup saat hujan deras.'),
        childPolicy: rich('Untuk usia 2–12 tahun. Orang dewasa wajib berada di dekat anak.'),
      }),
    },
    {
      en: { key: 'wellness', type: 'activity', availability: 'coming-soon', order: 6, title: 'Wellness', tagline: 'Yoga & Pilates', whatsappContext: 'Wellness', summary: 'Morning yoga and pilates sessions on the lawn.' },
      id: () => ({ title: 'Wellness', tagline: 'Yoga & Pilates', whatsappContext: 'Wellness', summary: 'Sesi yoga dan pilates pagi di halaman rumput.' }),
    },
    {
      en: {
        key: 'creative-classes', type: 'activity', availability: 'available', order: 7, title: 'Creative Classes', tagline: 'Painting, crafts & Balinese offerings', whatsappContext: 'Creative Classes',
        summary: 'Small hands-on classes for families and groups. See the Events page for the schedule.',
        prices: [{ label: 'Class', weekday: 'From Rp75.000', unit: '/ person' }],
      },
      id: (d) => ({
        title: 'Kelas Kreatif', tagline: 'Melukis, kerajinan & canang sari', whatsappContext: 'Kelas Kreatif',
        summary: 'Kelas praktik kecil untuk keluarga dan rombongan. Lihat jadwal di halaman Events.',
        prices: rows(d, 'prices', [{ label: 'Kelas', weekday: 'Mulai Rp75.000', unit: '/ orang' }]),
      }),
    },
    {
      en: {
        key: 'gathering', type: 'activity', availability: 'available', order: 8, title: 'Gathering & Outing', tagline: 'For schools, offices and communities', whatsappContext: 'Gathering & Outing',
        summary: 'Packages for school trips, office outings and community meetings, combining pool, playground and lunch.',
      },
      id: () => ({
        title: 'Gathering & Outing', tagline: 'Untuk sekolah, kantor, dan komunitas', whatsappContext: 'Gathering & Outing',
        summary: 'Paket untuk kunjungan sekolah, outing kantor, dan pertemuan komunitas, termasuk kolam, taman bermain, dan makan siang.',
      }),
    },
  ]
  for (const exp of experiences) {
    await upsert(payload, 'experiences', { key: { equals: exp.en.key } }, { ...exp.en, verified: false, _status: 'published' }, exp.id)
  }
  log(`${experiences.length} experiences`)

  // ── Gallery placeholder photos (generated, clearly labelled TEMP) ─────────────
  const galleryPhotos: [string, string, string][] = [
    ['pool', 'Pool with umbrellas', 'Kolam dengan payung'],
    ['pool', 'Children’s pool', 'Kolam anak'],
    ['dining', 'Signature dishes on the table', 'Hidangan unggulan di meja'],
    ['dining', 'Barista pouring a V60', 'Barista menuang V60'],
    ['work', 'Pavilion desks', 'Meja di pavilion'],
    ['activities', 'Kids on the swing', 'Anak-anak bermain ayunan'],
    ['events', 'Live acoustic night', 'Malam akustik'],
    ['ambience', 'Garden path at dusk', 'Jalan taman saat senja'],
  ]
  const { totalDocs: existingPhotos } = await payload.count({ collection: 'media', where: { filename: { like: 'temp-gallery' } } })
  if (!existingPhotos) {
    const sharp = (await import('sharp')).default
    for (const [i, [category, altEn, altId]] of galleryPhotos.entries()) {
      const hue = [150, 140, 35, 30, 95, 45, 20, 120][i]
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200">
        <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="hsl(${hue},28%,72%)"/><stop offset="1" stop-color="hsl(${hue},32%,42%)"/>
        </linearGradient></defs>
        <rect width="1600" height="1200" fill="url(#g)"/>
        <text x="800" y="560" font-family="Helvetica, Arial, sans-serif" font-size="64" font-weight="700" fill="#fff" text-anchor="middle">TEMP PHOTO</text>
        <text x="800" y="650" font-family="Helvetica, Arial, sans-serif" font-size="44" fill="#fff" text-anchor="middle">${altEn}</text>
      </svg>`
      const data = await sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer()
      const doc = await payload.create({
        collection: 'media',
        locale: 'en',
        data: { alt: `${altEn} (temporary photo)`, showInGallery: true, galleryCategory: category as never, usageRights: 'Generated placeholder — replace before go-live' },
        file: { data, mimetype: 'image/jpeg', name: `temp-gallery-${i + 1}.jpg`, size: data.length },
      })
      await payload.update({ collection: 'media', id: doc.id, locale: 'id', data: { alt: `${altId} (foto sementara)` } })
    }
    log(`${galleryPhotos.length} gallery placeholder photos`)
  }

  // ── Menu ─────────────────────────────────────────────────────────────────────
  const menu: [Data, Data][] = [
    [{ name: 'Nasi Campur Bali', description: 'Rice with mixed Balinese sides', category: 'mains', price: 55000, featured: true, dietaryNote: 'Spicy · Contains peanuts' }, { name: 'Nasi Campur Bali', description: 'Nasi dengan aneka lauk khas Bali', dietaryNote: 'Pedas · Mengandung kacang' }],
    [{ name: 'Grilled Chicken Bowl', description: 'Greens, sambal matah', category: 'mains', price: 65000, featured: true }, { name: 'Grilled Chicken Bowl', description: 'Sayuran, sambal matah' }],
    [{ name: 'Kids Pasta', description: 'Mild tomato sauce', category: 'kids', price: 40000, featured: true }, { name: 'Pasta Anak', description: 'Saus tomat tidak pedas' }],
    [{ name: 'Pisang Goreng', description: 'Palm sugar, coconut', category: 'snacks', price: 30000, featured: true }, { name: 'Pisang Goreng', description: 'Gula aren, kelapa' }],
    [{ name: 'Kopi Bali', description: 'Traditional brew', category: 'coffee', price: 15000 }, { name: 'Kopi Bali', description: 'Seduhan tradisional' }],
    [{ name: 'V60 Manual Brew', description: 'Single-origin Kintamani', category: 'coffee', price: 35000 }, { name: 'V60 Manual Brew', description: 'Single-origin Kintamani' }],
    [{ name: 'Café Latte', description: 'Espresso, steamed milk', category: 'coffee', price: 28000 }, { name: 'Café Latte', description: 'Espresso, susu' }],
    [{ name: 'Mie Goreng', description: 'Fried noodles, egg, vegetables', category: 'mains', price: 45000 }, { name: 'Mie Goreng', description: 'Mi goreng, telur, sayuran' }],
    [{ name: 'Bubur Injin', description: 'Black rice pudding', category: 'desserts', price: 30000 }, { name: 'Bubur Injin', description: 'Bubur ketan hitam' }],
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
    [{ topic: 'work', question: 'Can I make video calls here?', answer: 'Yes. The meeting room is best for calls; the pavilion has a quiet zone until 17.00.' }, { question: 'Apakah bisa video call di sini?', answer: 'Bisa. Ruang meeting paling nyaman untuk panggilan; pavilion punya zona tenang hingga pukul 17.00.' }],
    [{ topic: 'work', question: 'Can I reserve a desk in advance?', answer: 'Desks are first come, first served. The meeting room can be reserved via WhatsApp.' }, { question: 'Apakah meja bisa dipesan lebih dulu?', answer: 'Meja berlaku siapa cepat dia dapat. Ruang meeting bisa dipesan lewat WhatsApp.' }],
    [{ topic: 'dining', question: 'Do you have vegetarian options?', answer: 'Yes, several dishes are vegetarian. Ask our staff about allergies.' }, { question: 'Apakah ada pilihan vegetarian?', answer: 'Ada, beberapa hidangan vegetarian. Tanyakan alergi kepada petugas kami.' }],
  ]
  for (const [i, [en, id]] of faqs.entries()) {
    await upsert(payload, 'faqs', { question: { equals: en.question } }, { ...en, order: i, verified: false, _status: 'published' }, () => id)
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
