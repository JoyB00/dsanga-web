import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Free stock photos (Unsplash License: free for commercial use, no attribution required)
 * used as temporary photos until the client's own, approved photos arrive (spec §14, F-15).
 * They stay verified = false. The credit is kept in each photo's "Usage rights" field.
 *
 * Files are downloaded once into .cache/stock/ (gitignored). A slot without an entry here,
 * or whose download fails, falls back to the generated illustration in tempImages.ts.
 */
export type StockPhoto = {
  /** images.unsplash.com CDN URL, without query string */
  url: string
  /** Photo page on unsplash.com */
  page: string
  photographer: string
  /** Alt text when the photo differs from the slot's default description */
  en?: string
  id?: string
  /** Focal point in percent, for photos that are cropped a lot (e.g. a portrait photo in the wide hero). */
  focal?: { x: number; y: number }
}

export const STOCK: Record<string, StockPhoto> = {
  'pool-main': {
    url: 'https://images.unsplash.com/photo-1643161801010-d8848d1991fd',
    page: 'https://unsplash.com/photos/z1-BS2TH91I',
    photographer: 'yongzheng xu',
  },
  'pool-kids': {
    url: 'https://images.unsplash.com/photo-1633683789314-5d6f9e0e1fc4',
    page: 'https://unsplash.com/photos/aqZWOUY2JiY',
    photographer: 'Kostiantyn Li',
    en: 'A child swimming in a pool with palm trees',
    id: 'Anak berenang di kolam dengan pohon kelapa',
  },
  'pool-loungers': {
    url: 'https://images.unsplash.com/photo-1504665972199-8e1eeab59fc3',
    page: 'https://unsplash.com/photos/-HTTS0vxkVU',
    photographer: 'Bryan Agua',
  },
  'pool-evening': {
    url: 'https://images.unsplash.com/photo-1783696137750-9c658a8dd256',
    page: 'https://unsplash.com/photos/hy-ZgAHbYB0',
    photographer: 'Tommaso Ubezio',
  },
  'home-hero': {
    url: 'https://images.unsplash.com/photo-1752769041956-1af511b2a225',
    page: 'https://unsplash.com/photos/lvrBUWYaiOI',
    photographer: 'Ari Kurniawan',
    en: 'A family relaxing by a tropical pool in Bali',
    id: 'Keluarga bersantai di tepi kolam tropis di Bali',
    focal: { x: 48, y: 64 },
  },
  'family-pool': {
    url: 'https://images.unsplash.com/photo-1721571389052-9f65bc5f24b0',
    page: 'https://unsplash.com/photos/wrQZd6xNOZY',
    photographer: 'MD Duran',
    en: 'A parent and child playing in the pool',
    id: 'Orang tua dan anak bermain di kolam',
  },
  'bistro': {
    url: 'https://images.unsplash.com/photo-1707529332935-bfa3925f15ac',
    page: 'https://unsplash.com/photos/c0JWj9qrAB4',
    photographer: 'Inna Safa',
    en: 'Indonesian rice dishes on a banana leaf',
    id: 'Hidangan nasi Indonesia di atas daun pisang',
  },
  'dining-indoor': {
    url: 'https://images.unsplash.com/photo-1667992403195-d2241a40ca2d',
    page: 'https://unsplash.com/photos/GiZtJ4juG44',
    photographer: 'Polina Kuzovkova',
    en: 'Open-air dining terrace',
    id: 'Teras makan terbuka',
  },
  'dining-garden': {
    url: 'https://images.unsplash.com/photo-1787239558913-4bdec8d4a11d',
    page: 'https://unsplash.com/photos/f3bXaeS2qEI',
    photographer: 'Thang Nguyen manh',
  },
  'poolside-snacks': {
    url: 'https://images.unsplash.com/photo-1786365056878-c3ed18e55d32',
    page: 'https://unsplash.com/photos/CkPBlXLwPJ8',
    photographer: 'Ben Tripp',
    en: 'Fresh young coconut',
    id: 'Kelapa muda segar',
  },
  'coffee': {
    url: 'https://images.unsplash.com/photo-1760163178873-7644a924519e',
    page: 'https://unsplash.com/photos/T3fFz5W0Foc',
    photographer: 'nameless 3791',
  },
  'barista-v60': {
    url: 'https://images.unsplash.com/photo-1541469406036-71229832e06e',
    page: 'https://unsplash.com/photos/XP5zW2ngk9w',
    photographer: 'Eiliv Aceron',
    en: 'Hand-poured coffee',
    id: 'Kopi seduh manual',
  },
  'work': {
    url: 'https://images.unsplash.com/photo-1771670050629-122322b3081a',
    page: 'https://unsplash.com/photos/6nPQ2bbmnrc',
    photographer: 'Hai Nguyen',
    en: 'Laptop on a wooden table among plants',
    id: 'Laptop di meja kayu di antara tanaman',
  },
  'work-pavilion': {
    url: 'https://images.unsplash.com/photo-1652553344265-22cef245efff',
    page: 'https://unsplash.com/photos/aL0Rv_O7wKY',
    photographer: 'Aleh Tsikhanau',
    en: 'Working on a laptop on an outdoor terrace',
    id: 'Bekerja dengan laptop di teras terbuka',
  },
  'work-daypass': {
    url: 'https://images.unsplash.com/photo-1453928582365-b6ad33cbcf64',
    page: 'https://unsplash.com/photos/aOC7TSLb1o8',
    photographer: 'Lauren Mancke',
  },
  'playground': {
    url: 'https://images.unsplash.com/photo-1529952773346-0c86dca12264',
    page: 'https://unsplash.com/photos/Npj_sWuRw68',
    photographer: 'Kelly Sikkema',
    en: 'Children on a tire swing',
    id: 'Anak-anak bermain ayunan ban',
  },
  'wellness': {
    url: 'https://images.unsplash.com/photo-1570559547560-fcba36b64fae',
    page: 'https://unsplash.com/photos/_m9uW0st7fg',
    photographer: 'Amy Syiek',
    en: 'Yoga in the garden',
    id: 'Yoga di taman',
  },
  'creative': {
    url: 'https://images.unsplash.com/photo-1587632467120-c79b296a5dda',
    page: 'https://unsplash.com/photos/wtJret3oAE8',
    photographer: 'Pier Francesco Grizi',
    en: 'Balinese flower offerings',
    id: 'Sesajen bunga Bali',
  },
  'gathering': {
    url: 'https://images.unsplash.com/photo-1574482211311-45a2169db57c',
    page: 'https://unsplash.com/photos/Xaz9hnAl7qg',
    photographer: 'Matthew Buchanan',
    en: 'Evening dinner under string lights',
    id: 'Makan malam di bawah lampu gantung',
  },
  'event-acoustic': {
    url: 'https://images.unsplash.com/photo-1793105175574-0bde44eb1f70',
    page: 'https://unsplash.com/photos/ytglo0A_fZ8',
    photographer: 'Sasha Lerkhbaum',
    en: 'Live acoustic performance',
    id: 'Pertunjukan musik akustik',
  },
  'event-market': {
    url: 'https://images.unsplash.com/photo-1769485016794-03c4834c02d9',
    page: 'https://unsplash.com/photos/vwxynYFo-CM',
    photographer: 'Galih Jelih',
    en: 'Carved wooden masks at a craft stall',
    id: 'Topeng kayu ukir di lapak kerajinan',
  },
  'village': {
    url: 'https://images.unsplash.com/photo-1761154919905-e5502eb76842',
    page: 'https://unsplash.com/photos/apBdI-Rs0FA',
    photographer: 'Santhosh Mocharla',
    en: 'Balinese buildings beside rice paddies',
    id: 'Bangunan Bali di tepi sawah',
  },
  'menu-chicken-bowl': {
    url: 'https://images.unsplash.com/photo-1788227372897-49ec292a9406',
    page: 'https://unsplash.com/photos/vbb3Pgi7XoQ',
    photographer: 'Bayu Syaits',
  },
  'menu-kids-pasta': {
    url: 'https://images.unsplash.com/photo-1713561058969-793049b01712',
    page: 'https://unsplash.com/photos/Htb3Neu9Tmg',
    photographer: 'Mandy Bourke',
    en: 'Spaghetti with tomato sauce',
    id: 'Spageti dengan saus tomat',
  },
  'menu-pisang-goreng': {
    url: 'https://images.unsplash.com/photo-1762941904142-9d91ca413e66',
    page: 'https://unsplash.com/photos/4oGKCdrBDzE',
    photographer: 'Bimo Agmi',
    en: 'Fried banana with brown sugar',
    id: 'Pisang goreng dengan gula merah',
  },
  'menu-kopi-bali': {
    url: 'https://images.unsplash.com/photo-1615222836531-83bde3599aa4',
    page: 'https://unsplash.com/photos/fOpxfHDX3Ek',
    photographer: 'Nuril Ahsan',
    en: 'Black coffee in a ceramic mug',
    id: 'Kopi hitam di cangkir keramik',
  },
  'menu-mie-goreng': {
    url: 'https://images.unsplash.com/photo-1712926742786-c77530757ee3',
    page: 'https://unsplash.com/photos/jE3HzhXwOQE',
    photographer: 'Uncle Lim',
    en: 'Fried noodles with a fried egg',
    id: 'Mie goreng dengan telur ceplok',
  },
  'menu-bubur-injin': {
    url: 'https://images.unsplash.com/photo-1520319888085-12744c760434',
    page: 'https://unsplash.com/photos/_iQTlvnbYug',
    photographer: 'Eiliv Aceron',
    en: 'Rice porridge with cream',
    id: 'Bubur nasi dengan krim',
  },
}

/** Slots that reuse another slot's photo (same dish / drink). */
export const STOCK_SAME_AS: Record<string, string> = {
  'menu-nasi-campur': 'bistro',
  'menu-v60': 'barista-v60',
  'menu-latte': 'coffee',
  'menu-coconut': 'poolside-snacks',
  // No free photo of people making canang sari (the matches are Unsplash+).
  'creative-family': 'creative',
}

export const stockFor = (key: string): { key: string; photo: StockPhoto } | null => {
  const source = STOCK_SAME_AS[key] ?? key
  return STOCK[source] ? { key: source, photo: STOCK[source] } : null
}

export const stockUsage = (p: StockPhoto) =>
  `Unsplash License (free, no attribution required). Photo: ${p.photographer}, ${p.page}. Temporary: replace or approve before go-live.`

const CACHE = path.resolve(process.cwd(), '.cache/stock')

/** The photo as a 1800 px wide JPEG, downloaded on first use. */
export async function loadStock(key: string, p: StockPhoto): Promise<Buffer> {
  const file = path.join(CACHE, `${key}.jpg`)
  try {
    return await readFile(file)
  } catch {
    // not cached yet
  }
  const res = await fetch(`${p.url}?w=2000&q=82&fm=jpg`, { signal: AbortSignal.timeout(30_000) })
  const type = res.headers.get('content-type') ?? ''
  if (!res.ok || !type.startsWith('image/')) throw new Error(`${key}: HTTP ${res.status} ${type}`)
  const sharp = (await import('sharp')).default
  const data = await sharp(Buffer.from(await res.arrayBuffer()))
    .rotate()
    .resize({ width: 1800, withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toBuffer()
  await mkdir(CACHE, { recursive: true })
  await writeFile(file, data)
  return data
}
