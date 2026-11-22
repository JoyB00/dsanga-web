import type { Payload } from 'payload'

import { loadStock, stockFor, stockUsage } from './stockPhotos'

const GENERATED_USAGE = 'Generated placeholder (spec §14). Replace with an approved photo before go-live.'

/**
 * Temporary photos (spec §14) so every image slot on the site shows something representative
 * until the real, approved photos arrive. Free stock photos where stockPhotos.ts lists one,
 * otherwise a generated illustration tagged "Temporary photo". All stay verified = false (F-15).
 *
 *   pnpm seed:images            create missing images (or replace ones whose source changed) and attach them
 *   pnpm seed:images --force    recreate every image
 */

const W = 1800
const H = 1350

// Brand palette (design system v1) + scene colours.
const C = {
  forest: '#1F4D3A',
  deep: '#163828',
  leaf: '#3F7D52',
  leafLight: '#6FA27A',
  tint: '#E4EEE3',
  gold: '#C8963E',
  terracotta: '#A4532F',
  cream: '#F7F3EA',
  sand: '#EFE7D6',
  ink: '#1F2A24',
  water: '#3F9AB8',
  waterDeep: '#256F8C',
  waterLight: '#9ED6E6',
  sky: '#BFE3F2',
  wood: '#8A5A3B',
  woodLight: '#B07A52',
  skin: ['#8D5A3B', '#B7835A', '#6E4429', '#C99A74'],
}

// ── Small drawing helpers ─────────────────────────────────────────────────────
const rect = (x: number, y: number, w: number, h: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`
const circle = (cx: number, cy: number, r: number, fill: string, extra = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${extra}/>`
const ellipse = (cx: number, cy: number, rx: number, ry: number, fill: string, extra = '') =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`
const path = (d: string, fill: string, extra = '') => `<path d="${d}" fill="${fill}" ${extra}/>`
const gradient = (id: string, stops: [number, string][], vertical = true) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join('')}</linearGradient>`
const radial = (id: string, inner: string, outer: string) =>
  `<radialGradient id="${id}" cx="0.5" cy="0.45" r="0.7"><stop offset="0" stop-color="${inner}"/><stop offset="1" stop-color="${outer}"/></radialGradient>`

const sky = (horizon: number, top = '#8EC9E6', bottom = '#E9F5F8') =>
  `<defs>${gradient('sky', [[0, top], [1, bottom]])}</defs>${rect(0, 0, W, horizon, 'url(#sky)')}`

const palm = (x: number, base: number, s = 1, lean = 0) => {
  const top = base - 520 * s
  const tx = x + lean * s
  const trunk = path(
    `M${x - 16 * s},${base} Q${x + lean * 0.4 * s},${base - 260 * s} ${tx - 8 * s},${top} L${tx + 8 * s},${top} Q${x + lean * 0.4 * s + 20 * s},${base - 260 * s} ${x + 16 * s},${base} Z`,
    '#7A5A3C',
  )
  const leaves = [-160, -120, -60, -20, 20, 70, 130, 170]
    .map((a) => {
      const r = (a * Math.PI) / 180
      const ex = tx + Math.cos(r) * 230 * s
      const ey = top + Math.sin(r) * 120 * s + 60 * s
      return path(`M${tx},${top} Q${(tx + ex) / 2},${top - 70 * s} ${ex},${ey} Q${(tx + ex) / 2},${top - 10 * s} ${tx},${top} Z`, a % 40 ? C.leaf : C.forest)
    })
    .join('')
  return trunk + leaves + circle(tx, top + 6 * s, 14 * s, '#6B4A2E')
}

const roundTree = (x: number, base: number, s = 1, color: string = C.leaf) =>
  rect(x - 12 * s, base - 160 * s, 24 * s, 160 * s, '#6B4A2E') +
  circle(x, base - 220 * s, 120 * s, color) +
  circle(x - 80 * s, base - 170 * s, 80 * s, color) +
  circle(x + 85 * s, base - 175 * s, 85 * s, color) +
  circle(x + 20 * s, base - 300 * s, 70 * s, color, 'opacity="0.9"')

const umbrella = (x: number, y: number, color: string, s = 1) =>
  rect(x - 5 * s, y, 10 * s, 230 * s, '#5B4630') +
  path(`M${x - 170 * s},${y + 40 * s} Q${x},${y - 90 * s} ${x + 170 * s},${y + 40 * s} Z`, color) +
  path(`M${x - 170 * s},${y + 40 * s} Q${x - 85 * s},${y + 10 * s} ${x},${y + 40 * s} Q${x + 85 * s},${y + 10 * s} ${x + 170 * s},${y + 40 * s}`, 'none', `stroke="${C.cream}" stroke-width="${6 * s}" opacity="0.6"`)

const lounger = (x: number, y: number, s = 1, towel: string = C.cream) =>
  path(`M${x},${y} L${x + 220 * s},${y} L${x + 300 * s},${y - 70 * s} L${x + 320 * s},${y - 60 * s} L${x + 235 * s},${y + 14 * s} L${x},${y + 14 * s} Z`, '#FFFFFF') +
  rect(x + 20 * s, y + 14 * s, 8 * s, 34 * s, '#9A9A9A') +
  rect(x + 200 * s, y + 14 * s, 8 * s, 34 * s, '#9A9A9A') +
  rect(x + 40 * s, y - 10 * s, 150 * s, 14 * s, towel, `rx="${6 * s}"`)

const person = (x: number, y: number, s = 1, shirt: string = C.terracotta, skin = C.skin[0]) =>
  circle(x, y - 150 * s, 30 * s, skin) + rect(x - 34 * s, y - 118 * s, 68 * s, 118 * s, shirt, `rx="${28 * s}"`)

const swimmer = (x: number, y: number, s = 1, skin = C.skin[1], cap: string = C.gold) =>
  circle(x, y, 26 * s, skin) + path(`M${x - 26 * s},${y - 6 * s} Q${x},${y - 40 * s} ${x + 26 * s},${y - 6 * s} Z`, cap) +
  ellipse(x, y + 26 * s, 70 * s, 12 * s, '#FFFFFF', 'opacity="0.35"')

const ripples = (y0: number, y1: number, color = '#FFFFFF', count = 14) =>
  Array.from({ length: count }, (_, i) => {
    const y = y0 + ((y1 - y0) * (i + 0.5)) / count
    const x = (i * 337) % (W - 300) + 60
    const w = 120 + ((i * 53) % 160)
    return path(`M${x},${y} q${w / 4},-14 ${w / 2},0 t${w / 2},0`, 'none', `stroke="${color}" stroke-width="5" stroke-linecap="round" opacity="0.45"`)
  }).join('')

const stringLights = (y: number, sag = 70, count = 16, x0 = 0, x1 = W) => {
  const pts = Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1)
    const x = x0 + (x1 - x0) * t
    return [x, y + Math.sin(Math.PI * ((t * 2) % 1)) * sag] as const
  })
  return (
    path(`M${pts.map(([x, yy]) => `${x},${yy}`).join(' L')}`, 'none', 'stroke="#3B3024" stroke-width="3"') +
    pts.map(([x, yy]) => circle(x, yy + 14, 11, '#FFD98A') + circle(x, yy + 14, 26, '#FFD98A', 'opacity="0.18"')).join('')
  )
}

const woodTable = (fill = C.woodLight) =>
  rect(0, 0, W, H, fill) +
  Array.from({ length: 9 }, (_, i) => rect(0, i * 150 + 148, W, 4, '#000000', 'opacity="0.12"')).join('') +
  Array.from({ length: 30 }, (_, i) => path(`M${(i * 211) % W},${(i * 97) % H} q60,6 140,0`, 'none', 'stroke="#5C3A22" stroke-width="3" opacity="0.18"')).join('')

const plate = (cx: number, cy: number, r: number, inner = '#FFFFFF') =>
  circle(cx + 10, cy + 16, r, '#000000', 'opacity="0.18"') + circle(cx, cy, r, '#F4F1EA') + circle(cx, cy, r * 0.78, inner)

const bowl = (cx: number, cy: number, r: number, fill: string) =>
  circle(cx + 10, cy + 16, r, '#000000', 'opacity="0.2"') + circle(cx, cy, r, '#E9E2D3') + circle(cx, cy, r * 0.84, fill)

const leafGarnish = (x: number, y: number, s = 1, rot = 0) =>
  `<g transform="translate(${x},${y}) rotate(${rot}) scale(${s})">${path('M0,0 Q40,-30 80,0 Q40,30 0,0 Z', '#4E9A52')}${path('M0,0 L80,0', 'none', 'stroke="#2F6B35" stroke-width="3"')}</g>`

const cupTop = (cx: number, cy: number, r: number, coffee: string, art = false) =>
  ellipse(cx + 14, cy + 20, r * 1.55, r * 1.55, '#000000', 'opacity="0.16"') +
  circle(cx, cy, r * 1.5, '#F2EEE6') +
  circle(cx, cy, r * 1.08, '#FFFFFF') +
  circle(cx, cy, r, coffee) +
  (art
    ? path(`M${cx},${cy + r * 0.55} C${cx - r * 0.9},${cy - r * 0.1} ${cx - r * 0.45},${cy - r * 0.75} ${cx},${cy - r * 0.3} C${cx + r * 0.45},${cy - r * 0.75} ${cx + r * 0.9},${cy - r * 0.1} ${cx},${cy + r * 0.55} Z`, '#F3E3CC')
    : '') +
  path(`M${cx + r * 1.08},${cy - 22} q${r * 0.6},0 ${r * 0.6},22 q0,22 ${-r * 0.6},22`, 'none', `stroke="#F2EEE6" stroke-width="${r * 0.22}"`)

const beans = (n: number, seed = 1) =>
  Array.from({ length: n }, (_, i) => {
    const x = (i * 263 * seed) % W
    const y = (i * 151 * seed + 90) % H
    return `<g transform="translate(${x},${y}) rotate(${(i * 47) % 180})">${ellipse(0, 0, 22, 15, '#4A2C1A')}${path('M-16,0 Q0,-6 16,0', 'none', 'stroke="#2A170C" stroke-width="3"')}</g>`
  }).join('')

const frangipani = (x: number, y: number, s = 1) =>
  [0, 72, 144, 216, 288].map((a) => `<g transform="translate(${x},${y}) rotate(${a}) scale(${s})">${ellipse(0, -26, 16, 28, '#FFFFFF')}</g>`).join('') +
  circle(x, y, 10 * s, '#F4C542')

// ── Scenes ────────────────────────────────────────────────────────────────────
type Scene = () => string

const loungersCloseUp: Scene = () => {
  let s = sky(380) + circle(1500, 140, 70, '#FFF6D6') + palm(220, 640, 0.9, 50) + palm(1620, 640, 0.8, -60)
  s += rect(0, 360, W, H, C.sand) + Array.from({ length: 10 }, (_, i) => rect(0, 380 + i * 100, W, 3, '#D8CBB0')).join('')
  s += `<defs>${gradient('w2', [[0, C.waterLight], [1, C.water]])}</defs>` + rect(0, 1080, W, 270, 'url(#w2)') + rect(0, 1072, W, 14, '#FFFFFF') + ripples(1110, 1330, '#FFFFFF', 6)
  s += umbrella(560, 330, C.terracotta, 1.6) + umbrella(1280, 340, C.forest, 1.6)
  s += lounger(240, 900, 1.6, C.gold) + lounger(980, 905, 1.6, C.cream)
  return s + circle(820, 980, 40, '#F2F0EB') + rect(760, 1000, 120, 16, '#E9E2D3', 'rx="8"')
}

const poolScene =
  (opts: { dusk?: boolean; kids?: boolean; family?: boolean; loungers?: boolean } = {}): Scene =>
  () => {
    const horizon = 560
    const top = opts.dusk ? '#E8916A' : '#8EC9E6'
    const bottom = opts.dusk ? '#F6D4A8' : '#E9F5F8'
    let s = sky(horizon, top, bottom)
    s += opts.dusk ? circle(1350, 420, 90, '#FBE3B0', 'opacity="0.9"') : circle(1450, 170, 80, '#FFF6D6')
    s += path(`M0,${horizon} Q450,${horizon - 120} 900,${horizon - 30} T1800,${horizon - 60} L1800,${horizon + 40} L0,${horizon + 40} Z`, C.leaf)
    s += roundTree(260, horizon + 30, 0.8, C.forest) + roundTree(1580, horizon + 30, 0.9, C.leaf)
    s += rect(0, horizon + 20, W, H - horizon, C.sand)
    s += `<defs>${gradient('water', [[0, opts.dusk ? '#5FA7BC' : C.waterLight], [1, opts.dusk ? '#2E6F87' : C.water]])}</defs>`
    s += path(`M140,${horizon + 150} L1660,${horizon + 150} L1800,${H} L0,${H} Z`, 'url(#water)')
    s += path(`M140,${horizon + 150} L1660,${horizon + 150}`, 'none', 'stroke="#FFFFFF" stroke-width="14"')
    s += ripples(horizon + 200, H - 40, '#FFFFFF', 12)
    s += palm(120, horizon + 140, 0.9, 60) + palm(1700, horizon + 130, 1, -70)
    if (opts.loungers !== false) {
      s += umbrella(520, horizon - 120, C.terracotta, 0.9) + umbrella(1180, horizon - 110, C.forest, 0.9)
      s += lounger(380, horizon + 110, 0.8, C.gold) + lounger(1050, horizon + 112, 0.8, C.cream)
    }
    if (opts.kids || opts.family) {
      s += swimmer(700, horizon + 380, 1.1, C.skin[1], C.gold) + swimmer(860, horizon + 470, 1, C.skin[3], C.terracotta)
      s += circle(1080, horizon + 420, 60, 'none', `stroke="${C.terracotta}" stroke-width="26"`) + swimmer(1080, horizon + 420, 0.8, C.skin[2], '#4FB0C6')
    }
    if (opts.family) {
      s += person(1400, horizon + 150, 1.1, C.forest, C.skin[0]) + person(1500, horizon + 150, 0.8, C.gold, C.skin[3])
      s += circle(560, horizon + 600, 54, '#FFFFFF') + path(`M506,${horizon + 600} A54,54 0 0 1 614,${horizon + 600}`, C.terracotta)
    }
    return s
  }

const nasiCampur: Scene = () =>
  woodTable() +
  plate(900, 680, 470) +
  ellipse(820, 640, 190, 160, '#FBFAF5') + ellipse(820, 600, 150, 110, '#FFFFFF') +
  ellipse(1090, 520, 120, 80, '#B5482A') + ellipse(1130, 740, 110, 90, '#C98A3A') + ellipse(980, 900, 120, 70, '#5E9A3C') +
  ellipse(700, 880, 100, 60, '#E2B04A') + circle(1060, 900, 40, '#D9372B') + leafGarnish(640, 470, 1.2, -30) +
  bowl(1520, 300, 120, '#C0392B') + cupTop(260, 1080, 90, '#6B3A1E') + beans(6, 3)

const chickenBowl: Scene = () =>
  woodTable('#C49A6C') +
  bowl(900, 670, 460, '#7DBA5B') +
  Array.from({ length: 14 }, (_, i) => ellipse(700 + (i % 5) * 100, 520 + Math.floor(i / 5) * 140, 60, 34, ['#5C9E3E', '#8CC266', '#4E8A34'][i % 3], `transform="rotate(${i * 25} ${700 + (i % 5) * 100} ${520 + Math.floor(i / 5) * 140})"`)).join('') +
  [0, 1, 2, 3].map((i) => `<rect x="${760 + i * 70}" y="${590 + i * 40}" width="200" height="70" rx="20" fill="#A8642E" transform="rotate(-20 ${860 + i * 70} ${625 + i * 40})"/>`).join('') +
  ellipse(1110, 820, 90, 60, '#D9472B') + circle(680, 860, 60, '#F2D16B') + leafGarnish(1180, 480, 1, 40)

const pasta: Scene = () =>
  woodTable('#D1A879') +
  plate(900, 680, 470) +
  Array.from({ length: 9 }, (_, i) => circle(900, 680, 60 + i * 30, 'none', `stroke="${i % 2 ? '#E2683C' : '#F2B35A'}" stroke-width="22"`)).join('') +
  circle(900, 680, 60, '#D8452B') + leafGarnish(1050, 520, 1, 30) + leafGarnish(740, 820, 0.8, -150) +
  cupTop(1560, 300, 80, '#F1A33A')

const pisangGoreng: Scene = () =>
  woodTable() +
  plate(900, 680, 470, '#F7EFE0') +
  [0, 1, 2, 3, 4].map((i) => `<ellipse cx="${700 + i * 100}" cy="${640 + (i % 2) * 60}" rx="70" ry="210" fill="${i % 2 ? '#D9963A' : '#E8AE4C'}" transform="rotate(${-30 + i * 14} ${700 + i * 100} ${640 + (i % 2) * 60})"/>`).join('') +
  path('M650,520 C800,600 900,480 1150,620', 'none', 'stroke="#6B3A1E" stroke-width="14" stroke-linecap="round" opacity="0.8"') +
  Array.from({ length: 40 }, (_, i) => circle(640 + ((i * 47) % 520), 460 + ((i * 83) % 460), 6, '#FFFFFF', 'opacity="0.85"')).join('') +
  cupTop(1540, 1060, 90, '#3B2112')

const noodles: Scene = () =>
  woodTable('#B98458') +
  plate(900, 680, 470) +
  Array.from({ length: 16 }, (_, i) => path(`M${560 + (i % 4) * 30},${480 + i * 26} q120,-40 240,0 t240,0`, 'none', `stroke="${i % 2 ? '#B7702E' : '#9A5A22'}" stroke-width="18" stroke-linecap="round"`)).join('') +
  circle(1020, 560, 110, '#FFFFFF') + circle(1030, 565, 50, '#F5B82E') +
  ellipse(760, 860, 70, 40, '#5E9A3C') + ellipse(1080, 860, 60, 34, '#D9472B') + circle(820, 520, 20, '#4E9A52')

const buburInjin: Scene = () =>
  woodTable('#C9A27A') +
  bowl(900, 680, 420, '#3B1F33') +
  path('M720,620 C840,520 980,760 1100,640 C1040,780 820,800 720,620 Z', '#F4EEE2') +
  frangipani(1150, 480, 1.2) + cupTop(300, 300, 80, '#7A4A2A')

const coconut: Scene = () =>
  rect(0, 0, W, H, '#BFE4EE') +
  Array.from({ length: 12 }, (_, i) => rect(0, i * 120, W, 4, '#FFFFFF', 'opacity="0.5"')).join('') +
  Array.from({ length: 16 }, (_, i) => rect(i * 120, 0, 4, H, '#FFFFFF', 'opacity="0.5"')).join('') +
  ellipse(920, 760, 380, 340, '#6E9F3A') + ellipse(880, 700, 330, 290, '#86B94A') + ellipse(950, 520, 140, 70, '#F3F1DD') +
  rect(1000, 160, 34, 420, '#E9573F', 'rx="17" transform="rotate(18 1017 370)"') + frangipani(560, 380, 1.4) + leafGarnish(1250, 960, 2, -20)

const latte: Scene = () => woodTable('#9C6A45') + cupTop(880, 660, 300, '#B97A47', true) + beans(18, 1) + leafGarnish(1480, 1080, 1.6, -30)
const kopiBali: Scene = () => woodTable('#A87650') + cupTop(880, 660, 300, '#2A160B') + beans(22, 2) + path('M1350,980 l220,-60 l40,150 l-220,60 Z', '#E8D9BE')

const v60: Scene = () => {
  let s = `<defs>${gradient('wall', [[0, '#EFE4D2'], [1, '#D8C6A8']])}</defs>` + rect(0, 0, W, H, 'url(#wall)')
  s += rect(0, 950, W, 400, '#8A5A3B') + rect(0, 950, W, 16, '#6E4429')
  s += path('M780,940 L1020,940 L1000,1000 L800,1000 Z', '#FFFFFF') + rect(760, 900, 280, 50, '#F2F0EB', 'rx="10"')
  s += path('M720,560 L1080,560 L960,860 L840,860 Z', '#F4F2EE') + path('M760,580 L1040,580 L950,840 L850,840 Z', '#E5D8C3')
  s += path('M1390,500 C1270,520 1150,470 1060,548', 'none', 'stroke="#2E2E2E" stroke-width="20" stroke-linecap="round"')
  s += path('M1040,540 q-10,60 -40,150', 'none', 'stroke="#C7843E" stroke-width="10" opacity="0.8"')
  s += path('M1380,560 L1640,560 L1600,300 Q1510,250 1420,300 Z', '#3A3A3A') + rect(1470, 250, 80, 40, '#2A2A2A', 'rx="16"')
  s += path('M1630,340 q90,20 70,120 q-10,50 -60,70', 'none', 'stroke="#2A2A2A" stroke-width="22"')
  s += ellipse(520, 930, 170, 30, '#000000', 'opacity="0.15"') + rect(380, 760, 280, 180, '#7A4A2A', 'rx="30"')
  return s + beans(6, 5)
}

const desk = (opts: { pavilion?: boolean; topDown?: boolean } = {}): Scene => () => {
  if (opts.topDown) {
    return (
      woodTable('#C8A47E') +
      rect(520, 300, 760, 500, '#3A3D42', 'rx="28"') + rect(550, 330, 700, 440, '#7FB7D6', 'rx="10"') +
      rect(470, 800, 860, 300, '#4A4E55', 'rx="30"') +
      Array.from({ length: 4 }, (_, r) => Array.from({ length: 12 }, (_, c) => rect(520 + c * 64, 840 + r * 56, 52, 42, '#5E636B', 'rx="8"')).join('')).join('') +
      cupTop(1500, 400, 110, '#B97A47', true) + leafGarnish(240, 300, 2.4, 20) + path('M200,980 l260,0 l0,300 l-260,0 Z', '#F5F1E6')
    )
  }
  let s = `<defs>${gradient('wall', [[0, opts.pavilion ? '#E7F0E6' : '#F3EDE2'], [1, opts.pavilion ? '#CFE0CC' : '#E4D8C5']])}</defs>` + rect(0, 0, W, H, 'url(#wall)')
  if (opts.pavilion) {
    s += path(`M-100,260 L900,40 L1900,260 Z`, C.terracotta) + rect(0, 250, W, 30, '#7A3D22')
    s += [120, 900, 1680].map((x) => rect(x - 20, 270, 40, 700, '#7A5A3C')).join('')
    s += roundTree(450, 900, 0.7, C.leafLight) + roundTree(1350, 900, 0.8, C.leaf) + rect(0, 900, W, 450, '#CDB894')
    s += stringLights(300, 50, 14, 140, 1660)
  } else {
    s += rect(1000, 160, 640, 560, '#FFFFFF') + rect(1020, 180, 600, 520, '#9FCB8F') + roundTree(1200, 700, 0.6, C.leaf) + roundTree(1480, 720, 0.7, C.forest)
    s += rect(1310, 180, 20, 520, '#FFFFFF') + rect(1020, 430, 600, 18, '#FFFFFF')
  }
  const deskY = 900
  const desks = opts.pavilion ? [[300, 0.75], [1100, 0.75]] : [[700, 1]]
  for (const [dx, sc] of desks) {
    s += rect(dx - 360 * sc, deskY, 720 * sc, 34 * sc, '#8A5A3B') + rect(dx - 330 * sc, deskY + 34 * sc, 26 * sc, 330 * sc, '#6E4429') + rect(dx + 300 * sc, deskY + 34 * sc, 26 * sc, 330 * sc, '#6E4429')
    s += path(`M${dx - 200 * sc},${deskY} L${dx + 200 * sc},${deskY} L${dx + 170 * sc},${deskY - 250 * sc} L${dx - 170 * sc},${deskY - 250 * sc} Z`, '#3A3D42')
    s += path(`M${dx - 185 * sc},${deskY - 14 * sc} L${dx + 185 * sc},${deskY - 14 * sc} L${dx + 158 * sc},${deskY - 236 * sc} L${dx - 158 * sc},${deskY - 236 * sc} Z`, '#86BFDB')
    s += rect(dx + 240 * sc, deskY - 90 * sc, 70 * sc, 90 * sc, '#FFFFFF', `rx="${12 * sc}"`)
    s += rect(dx - 330 * sc, deskY - 110 * sc, 80 * sc, 110 * sc, C.terracotta, `rx="${10 * sc}"`) + circle(dx - 290 * sc, deskY - 170 * sc, 70 * sc, C.leaf)
  }
  return s
}

const playground: Scene = () => {
  let s = sky(760) + circle(300, 200, 80, '#FFF6D6')
  s += rect(0, 740, W, 610, '#86B65E') + path('M0,760 Q600,700 1200,760 T1800,740 L1800,800 L0,800 Z', '#6FA24A')
  s += roundTree(420, 820, 1.4, C.forest) + roundTree(1400, 820, 1.4, C.leaf)
  s += rect(560, 260, 700, 30, '#6B4A2E', 'rx="14"')
  s += path('M760,290 L700,820 M940,290 L1000,820', 'none', 'stroke="#D8C7A6" stroke-width="10"')
  s += rect(640, 810, 420, 34, C.terracotta, 'rx="12" transform="rotate(-8 850 827)"')
  s += person(850, 810, 0.9, C.gold, C.skin[3])
  s += person(1250, 1100, 1.1, C.forest, C.skin[0]) + person(1360, 1110, 0.7, C.terracotta, C.skin[2])
  s += Array.from({ length: 18 }, (_, i) => circle((i * 167) % W, 1000 + ((i * 71) % 300), 12, ['#F4C542', '#FFFFFF', '#E7798A'][i % 3])).join('')
  return s
}

const wellness: Scene = () => {
  let s = `<defs>${gradient('morning', [[0, '#F6E3C4'], [1, '#E9F1E4']])}</defs>` + rect(0, 0, W, H, 'url(#morning)')
  s += roundTree(200, 900, 1.3, C.leaf) + roundTree(1650, 900, 1.2, C.forest) + palm(1400, 900, 0.8, -40)
  s += rect(0, 860, W, 490, '#CDB894') + Array.from({ length: 8 }, (_, i) => rect(0, 880 + i * 60, W, 4, '#B19C77')).join('')
  for (const [x, color, skin] of [[520, '#7FB3A3', C.skin[1]], [900, C.terracotta, C.skin[3]], [1280, '#C9A7D9', C.skin[0]]] as const) {
    s += path(`M${x - 170},1120 L${x + 170},1120 L${x + 230},1220 L${x - 230},1220 Z`, color)
    // Seated cross-legged, hands on knees.
    s += ellipse(x, 1095, 130, 36, '#4A4A5A') + path(`M${x - 62},1090 L${x - 46},930 Q${x},905 ${x + 46},930 L${x + 62},1090 Z`, '#FFFFFF')
    s += circle(x, 870, 40, skin) + path(`M${x - 46},940 L${x - 110},1070 M${x + 46},940 L${x + 110},1070`, 'none', `stroke="${skin}" stroke-width="20" stroke-linecap="round"`)
  }
  return s + frangipani(300, 1200, 1.6) + frangipani(1600, 1250, 1.3)
}

const canang = (family = false): Scene => () => {
  let s = woodTable('#B5885E')
  const tray = (x: number, y: number, sz: number) => {
    let t = rect(x - sz / 2 + 14, y - sz / 2 + 18, sz, sz, '#000000', 'opacity="0.18"') + rect(x - sz / 2, y - sz / 2, sz, sz, '#9BC26B', 'rx="10"')
    t += Array.from({ length: 7 }, (_, i) => rect(x - sz / 2, y - sz / 2 + (i * sz) / 7, sz, 6, '#7FA650')).join('')
    const r = sz * 0.17
    t += circle(x - r, y - r, r * 0.9, '#FFFFFF') + circle(x + r, y - r, r * 0.9, '#E2383F') + circle(x - r, y + r, r * 0.9, '#F4C542') + circle(x + r, y + r, r * 0.9, '#8E44AD')
    return t + frangipani(x, y, sz / 260)
  }
  s += tray(700, 660, 520) + tray(1300, 480, 300) + tray(1350, 950, 260)
  s += Array.from({ length: 24 }, (_, i) => circle((i * 191) % W, (i * 137) % H, 16, ['#F4C542', '#E2383F', '#FFFFFF'][i % 3], 'opacity="0.9"')).join('')
  if (family) s += tray(260, 300, 220) + tray(300, 1080, 240) + tray(1620, 260, 200)
  return s
}

const pavilion = (night = false): Scene => () => {
  let s = night ? `<defs>${gradient('n', [[0, '#14243A'], [1, '#3A3150']])}</defs>${rect(0, 0, W, H, 'url(#n)')}` : sky(700)
  if (night) s += Array.from({ length: 40 }, (_, i) => circle((i * 233) % W, (i * 97) % 500, 3, '#FFFFFF', 'opacity="0.7"')).join('')
  s += roundTree(160, 800, 1.2, night ? '#1E3A2A' : C.forest) + roundTree(1660, 800, 1.2, night ? '#24432F' : C.leaf)
  s += rect(0, 780, W, 570, night ? '#4A3A2E' : '#CDB894')
  s += path('M240,420 L900,160 L1560,420 Z', night ? '#6E3A24' : C.terracotta) + rect(240, 410, 1320, 40, night ? '#4A2616' : '#7A3D22')
  s += [300, 900, 1500].map((x) => rect(x - 18, 450, 36, 380, night ? '#4A3626' : '#7A5A3C')).join('')
  s += stringLights(470, 60, 18, 260, 1540)
  s += rect(420, 860, 960, 40, night ? '#6B4A34' : '#8A5A3B', 'rx="10"') + rect(450, 900, 24, 160, '#5A3A26') + rect(1330, 900, 24, 160, '#5A3A26')
  const guests = [520, 680, 840, 1000, 1160, 1300]
  s += guests.map((x, i) => person(x, 860, 0.75, [C.forest, C.gold, C.terracotta, '#4F7CAC', C.leaf, '#8E6C9A'][i], C.skin[i % 4])).join('')
  s += [600, 900, 1200].map((x) => circle(x, 850, 22, night ? '#FFD98A' : '#FFFFFF')).join('')
  return s
}

const acoustic: Scene = () => {
  let s = `<defs>${gradient('n', [[0, '#0F1C2E'], [1, '#2E2440']])}${radial('spot', '#FFE2A8', '#2E2440')}</defs>` + rect(0, 0, W, H, 'url(#n)')
  s += ellipse(900, 760, 700, 520, 'url(#spot)', 'opacity="0.55"')
  s += stringLights(120, 90, 20) + stringLights(260, 70, 16, 100, 1700)
  s += rect(300, 980, 1200, 80, '#5A3A26') + rect(300, 1060, 1200, 290, '#3A2618')
  s += person(780, 980, 1.6, C.forest, C.skin[0])
  s += `<g transform="rotate(-28 860 820)">${ellipse(860, 860, 120, 90, '#C8843E')}${ellipse(760, 860, 90, 70, '#C8843E')}${circle(840, 860, 30, '#3A2210')}${rect(940, 845, 330, 30, '#4A2E18')}${rect(1260, 830, 70, 60, '#4A2E18', 'rx="12"')}</g>`
  s += rect(1100, 700, 14, 290, '#9A9A9A') + circle(1107, 690, 26, '#2B2B2B')
  s += [200, 380, 1420, 1600].map((x, i) => person(x, 1350, 1.3, ['#2E4A3A', '#4A3A5A', '#3A4A6A', '#5A3A3A'][i], '#1B1B1B')).join('')
  return s
}

const market: Scene = () => {
  let s = sky(640, '#9ED0E8', '#F2F7F4') + roundTree(140, 700, 1.1, C.forest) + roundTree(1700, 700, 1.1, C.leaf)
  s += rect(0, 660, W, 690, '#D7C4A0')
  const stall = (x: number, color: string) => {
    let t = rect(x - 210, 520, 420, 50, color) + Array.from({ length: 6 }, (_, i) => (i % 2 ? rect(x - 210 + i * 70, 520, 70, 50, '#FFFFFF') : '')).join('')
    t += path(`M${x - 210},570 ${'q35,40 70,0 '.repeat(6).trim()}`, color)
    t += rect(x - 190, 600, 16, 260, '#7A5A3C') + rect(x + 174, 600, 16, 260, '#7A5A3C') + rect(x - 220, 820, 440, 40, '#8A5A3B')
    t += [0, 1, 2, 3].map((i) => rect(x - 180 + i * 95, 760, 70, 60, ['#E2683C', '#F4C542', '#7FB3A3', '#C9A7D9'][i], 'rx="10"')).join('')
    return t
  }
  s += stall(380, C.terracotta) + stall(900, C.forest) + stall(1420, C.gold)
  s += stringLights(430, 50, 18)
  s += [600, 760, 1150, 1240, 1600].map((x, i) => person(x, 1180, 1.1, [C.forest, C.gold, '#4F7CAC', C.terracotta, C.leaf][i], C.skin[i % 4])).join('')
  return s
}

const village: Scene = () => {
  let s = sky(520, '#9FD3EA', '#EAF6F2') + path('M0,520 L300,330 L560,520 Z', '#6E8FA0', 'opacity="0.6"') + path('M380,520 L760,260 L1120,520 Z', '#5E7F90', 'opacity="0.55"')
  const bands = ['#7DB35A', '#93C46A', '#6FA24A', '#A6CF7A', '#5E9A3C', '#8CC266', '#4E8A34']
  bands.forEach((c, i) => {
    const y = 500 + i * 125
    s += path(`M0,${y} Q450,${y - 70} 900,${y} T1800,${y - 20} L1800,${H} L0,${H} Z`, c)
    s += path(`M0,${y + 6} Q450,${y - 64} 900,${y + 6} T1800,${y - 14}`, 'none', 'stroke="#FFFFFF" stroke-width="4" opacity="0.35"')
  })
  // Candi bentar (split gate)
  const gate = (x: number, flip: number) =>
    path(`M${x},900 L${x},560 L${x + 40 * flip},520 L${x + 40 * flip},460 L${x + 80 * flip},420 L${x + 80 * flip},360 L${x + 120 * flip},320 L${x + 160 * flip},320 L${x + 160 * flip},900 Z`, '#8E6A4E')
  s += gate(1260, 1) + gate(1620, -1) + rect(1230, 880, 420, 40, '#6E4E36')
  s += palm(200, 980, 0.9, 50) + palm(1000, 940, 0.7, -40) + frangipani(1440, 960, 1.5)
  return s
}

const gardenPath: Scene = () => {
  let s = `<defs>${gradient('dusk', [[0, '#E89D73'], [0.6, '#F7D9B0'], [1, '#F7EEDB']])}</defs>` + rect(0, 0, W, 640, 'url(#dusk)')
  s += rect(0, 620, W, 730, '#7DAA5A') + path('M760,620 L1040,620 L1500,1350 L300,1350 Z', '#D8C7A6')
  s += Array.from({ length: 9 }, (_, i) => ellipse(900 + (i % 2 ? 60 : -60) * (i / 4), 680 + i * 75, 60 + i * 12, 16 + i * 4, '#C2AE88')).join('')
  s += roundTree(300, 760, 1.4, C.forest) + roundTree(1500, 760, 1.3, C.leaf) + palm(1150, 700, 0.6, -30) + palm(620, 690, 0.55, 30)
  for (const [x, y] of [[560, 1000], [1240, 1000], [420, 1250], [1380, 1250]]) {
    s += rect(x - 8, y - 160, 16, 160, '#3A3A3A') + rect(x - 34, y - 220, 68, 70, '#3A3A3A', 'rx="8"') + rect(x - 24, y - 210, 48, 50, '#FFD98A') + circle(x, y - 185, 70, '#FFD98A', 'opacity="0.25"')
  }
  return s
}

// ── Catalogue ─────────────────────────────────────────────────────────────────
type ImageDef = { key: string; scene: Scene; en: string; id: string; gallery?: string }

export const IMAGES: ImageDef[] = [
  { key: 'pool-main', scene: poolScene(), en: 'Pool with umbrellas and palm trees', id: 'Kolam dengan payung dan pohon kelapa', gallery: 'pool' },
  { key: 'pool-kids', scene: poolScene({ kids: true, loungers: false }), en: 'Children playing in the pool', id: 'Anak-anak bermain di kolam', gallery: 'pool' },
  { key: 'pool-loungers', scene: loungersCloseUp, en: 'Shaded loungers by the pool', id: 'Kursi santai teduh di tepi kolam' },
  { key: 'pool-evening', scene: poolScene({ dusk: true }), en: 'The pool at sunset', id: 'Kolam saat matahari terbenam', gallery: 'ambience' },
  { key: 'home-hero', scene: poolScene({ family: true }), en: 'Families enjoying the pool', id: 'Keluarga menikmati kolam' },
  { key: 'family-pool', scene: poolScene({ family: true, dusk: true }), en: 'A family afternoon at the pool', id: 'Sore keluarga di kolam' },
  { key: 'bistro', scene: nasiCampur, en: 'Balinese dishes on the table', id: 'Hidangan Bali di meja', gallery: 'dining' },
  { key: 'dining-indoor', scene: pavilion(false), en: 'Guests in the dining pavilion', id: 'Tamu di pavilion makan' },
  { key: 'dining-garden', scene: gardenPath, en: 'Garden path with lanterns at dusk', id: 'Jalan taman berlampu saat senja', gallery: 'ambience' },
  { key: 'poolside-snacks', scene: coconut, en: 'Fresh coconut by the pool', id: 'Kelapa muda di tepi kolam' },
  { key: 'coffee', scene: latte, en: 'Café latte with latte art', id: 'Café latte dengan latte art', gallery: 'dining' },
  { key: 'barista-v60', scene: v60, en: 'Barista pouring a V60', id: 'Barista menuang V60', gallery: 'dining' },
  { key: 'work', scene: desk(), en: 'Desk with a view of the garden', id: 'Meja kerja dengan pemandangan taman' },
  { key: 'work-pavilion', scene: desk({ pavilion: true }), en: 'Open-air work pavilion', id: 'Pavilion kerja terbuka', gallery: 'work' },
  { key: 'work-daypass', scene: desk({ topDown: true }), en: 'Laptop and coffee on a work desk', id: 'Laptop dan kopi di meja kerja' },
  { key: 'playground', scene: playground, en: 'Children on the swing', id: 'Anak-anak bermain ayunan', gallery: 'activities' },
  { key: 'wellness', scene: wellness, en: 'Morning yoga in the garden', id: 'Yoga pagi di taman', gallery: 'activities' },
  { key: 'creative', scene: canang(), en: 'Canang sari offerings', id: 'Canang sari', gallery: 'activities' },
  { key: 'creative-family', scene: canang(true), en: 'Families making canang sari', id: 'Keluarga membuat canang sari' },
  { key: 'gathering', scene: pavilion(true), en: 'Evening gathering in the pavilion', id: 'Acara malam di pavilion', gallery: 'events' },
  { key: 'event-acoustic', scene: acoustic, en: 'Live acoustic night', id: 'Malam musik akustik', gallery: 'events' },
  { key: 'event-market', scene: market, en: 'Sukawati creative market stalls', id: 'Lapak pasar kreatif Sukawati', gallery: 'events' },
  { key: 'village', scene: village, en: 'Rice terraces and temple gate in Sukawati', id: 'Sawah dan candi bentar di Sukawati', gallery: 'ambience' },
  // Menu
  { key: 'menu-nasi-campur', scene: nasiCampur, en: 'Nasi campur Bali', id: 'Nasi campur Bali' },
  { key: 'menu-chicken-bowl', scene: chickenBowl, en: 'Grilled chicken bowl', id: 'Grilled chicken bowl' },
  { key: 'menu-kids-pasta', scene: pasta, en: 'Kids pasta with tomato sauce', id: 'Pasta anak dengan saus tomat' },
  { key: 'menu-pisang-goreng', scene: pisangGoreng, en: 'Pisang goreng with palm sugar', id: 'Pisang goreng dengan gula aren' },
  { key: 'menu-kopi-bali', scene: kopiBali, en: 'Traditional Kopi Bali', id: 'Kopi Bali tradisional' },
  { key: 'menu-v60', scene: v60, en: 'V60 manual brew', id: 'Kopi V60 manual brew' },
  { key: 'menu-latte', scene: latte, en: 'Café latte', id: 'Café latte' },
  { key: 'menu-mie-goreng', scene: noodles, en: 'Mie goreng with fried egg', id: 'Mie goreng dengan telur' },
  { key: 'menu-bubur-injin', scene: buburInjin, en: 'Bubur injin (black rice pudding)', id: 'Bubur injin' },
  { key: 'menu-coconut', scene: coconut, en: 'Fresh young coconut', id: 'Kelapa muda segar' },
]

/** Which image goes where. Keys refer to IMAGES. */
const ASSIGN = {
  experiences: {
    pool: { hero: 'pool-main', gallery: ['pool-kids', 'pool-loungers', 'pool-evening', 'family-pool'] },
    dining: { hero: 'bistro', gallery: ['dining-indoor', 'dining-garden', 'poolside-snacks'] },
    coffee: { hero: 'coffee', gallery: ['barista-v60', 'menu-kopi-bali'] },
    'work-space': { hero: 'work', gallery: ['work-pavilion', 'work-daypass'] },
    playground: { hero: 'playground' },
    wellness: { hero: 'wellness' },
    'creative-classes': { hero: 'creative' },
    gathering: { hero: 'gathering' },
  } as Record<string, { hero: string; gallery?: string[] }>,
  menu: {
    'Nasi Campur Bali': 'menu-nasi-campur',
    'Grilled Chicken Bowl': 'menu-chicken-bowl',
    'Kids Pasta': 'menu-kids-pasta',
    'Pisang Goreng': 'menu-pisang-goreng',
    'Kopi Bali': 'menu-kopi-bali',
    'V60 Manual Brew': 'menu-v60',
    'Café Latte': 'menu-latte',
    'Mie Goreng': 'menu-mie-goreng',
    'Bubur Injin': 'menu-bubur-injin',
    'Fresh Coconut': 'menu-coconut',
  } as Record<string, string>,
  events: {
    'Sukawati Creative Market #3': 'event-market',
    'Live Acoustic Evening': 'event-acoustic',
    'Canang Sari Making for Families': 'creative-family',
  } as Record<string, string>,
  offers: { 'Family Weekend Package': 'family-pool', 'Work & Coffee Day Pass': 'work-daypass' } as Record<string, string>,
  pageIntros: {
    activities: 'playground',
    events: 'event-acoustic',
    offers: 'family-pool',
    gallery: 'pool-evening',
    visit: 'dining-garden',
    contact: 'village',
  } as Record<string, string>,
  home: { hero: 'home-hero', about: 'village' },
  about: { hero: 'gathering' },
}

// ── Rendering ─────────────────────────────────────────────────────────────────
const label = () => {
  // Centred near the bottom: survives the 16:9, 4:3, 4:5 and square crops used on the site.
  // Large enough to read on a 360 px card. The subject is in the alt text.
  const w = 640
  const y = H * 0.8
  return `${rect((W - w) / 2, y - 62, w, 92, '#1F2A24', 'rx="46" opacity="0.6"')}<text x="${W / 2}" y="${y}" font-family="Helvetica Neue, Arial, sans-serif" font-size="46" font-weight="700" letter-spacing="4" fill="#FFFFFF" text-anchor="middle">TEMPORARY PHOTO</text>`
}

export async function render(def: ImageDef): Promise<Buffer> {
  const sharp = (await import('sharp')).default
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">${def.scene()}${label()}</svg>`
  // Soft film grain so flat shapes read more like a photo.
  const grain = await sharp({
    create: { width: W, height: H, channels: 3, background: '#808080', noise: { type: 'gaussian', mean: 128, sigma: 14 } },
  })
    .png()
    .toBuffer()
  return sharp(Buffer.from(svg))
    .composite([{ input: grain, blend: 'soft-light' }])
    .jpeg({ quality: 86, mozjpeg: true })
    .toBuffer()
}

export async function seedTempImages(payload: Payload, log: (m: string) => void, force = false) {
  // The old flat "TEMP PHOTO" cards are replaced by these.
  const old = await payload.find({ collection: 'media', where: { filename: { like: 'temp-gallery-' } }, limit: 50, depth: 0 })
  for (const doc of old.docs) await payload.delete({ collection: 'media', id: doc.id })

  const ids: Record<string, number> = {}
  let created = 0
  let stockCount = 0
  for (const def of IMAGES) {
    const filename = `temp-${def.key}.webp`
    const existing = await payload.find({ collection: 'media', where: { filename: { equals: filename } }, limit: 1, depth: 0 })
    const stock = stockFor(def.key)
    let data: Buffer | null = null
    let usage = GENERATED_USAGE
    if (stock) {
      try {
        data = await loadStock(stock.key, stock.photo)
        usage = stockUsage(stock.photo)
      } catch (err) {
        log(`stock photo for ${def.key} unavailable, using the illustration (${(err as Error).message})`)
      }
    }
    // Keep what is there unless forced or the source changed (e.g. a stock photo was added).
    if (existing.docs[0] && !force && existing.docs[0].usageRights === usage) {
      ids[def.key] = existing.docs[0].id
      continue
    }
    if (existing.docs[0]) await payload.delete({ collection: 'media', id: existing.docs[0].id })
    const isStock = usage !== GENERATED_USAGE
    data ??= await render(def)
    const doc = await payload.create({
      collection: 'media',
      locale: 'en',
      data: {
        alt: isStock ? (stock?.photo.en ?? def.en) : `${def.en} (temporary photo)`,
        showInGallery: Boolean(def.gallery),
        galleryCategory: def.gallery as never,
        usageRights: usage,
        verified: false,
      },
      file: { data, mimetype: 'image/jpeg', name: `temp-${def.key}.jpg`, size: data.length },
    })
    await payload.update({
      collection: 'media',
      id: doc.id,
      locale: 'id',
      data: { alt: isStock ? (stock?.photo.id ?? def.id) : `${def.id} (foto sementara)` },
    })
    ids[def.key] = doc.id
    created++
    if (isStock) stockCount++
  }
  log(`${created} temporary photos created (${stockCount} stock photos, ${IMAGES.length - created} already there)`)

  const published = { _status: 'published' as const }
  for (const [key, a] of Object.entries(ASSIGN.experiences)) {
    const res = await payload.find({ collection: 'experiences', where: { key: { equals: key } }, limit: 1, depth: 0 })
    if (!res.docs[0]) continue
    await payload.update({
      collection: 'experiences',
      id: res.docs[0].id,
      data: { heroImage: ids[a.hero], gallery: (a.gallery ?? []).map((k) => ids[k]), ...published },
    })
  }
  for (const [collection, field, map] of [
    ['menu-items', 'name', ASSIGN.menu],
    ['events', 'title', ASSIGN.events],
    ['offers', 'title', ASSIGN.offers],
  ] as const) {
    for (const [title, key] of Object.entries(map)) {
      const res = await payload.find({ collection, where: { [field]: { equals: title } }, locale: 'en', limit: 1, depth: 0 })
      if (res.docs[0]) await payload.update({ collection, id: res.docs[0].id, data: { image: ids[key], ...published } as never })
    }
  }
  for (const [page, key] of Object.entries(ASSIGN.pageIntros)) {
    const res = await payload.find({ collection: 'page-intros', where: { page: { equals: page } }, limit: 1, depth: 0 })
    if (res.docs[0]) await payload.update({ collection: 'page-intros', id: res.docs[0].id, data: { heroImage: ids[key], ...published } })
  }
  // Globals: write the whole group back so its other (localized) fields stay as they are.
  const home = await payload.findGlobal({ slug: 'home-page', locale: 'en', depth: 0 })
  await payload.updateGlobal({
    slug: 'home-page',
    locale: 'en',
    data: { hero: { ...home.hero, image: ids[ASSIGN.home.hero] }, about: { ...home.about, image: ids[ASSIGN.home.about] }, ...published },
  })
  const about = await payload.findGlobal({ slug: 'about-page', locale: 'en', depth: 0 })
  await payload.updateGlobal({ slug: 'about-page', locale: 'en', data: { hero: { ...about.hero, image: ids[ASSIGN.about.hero] }, ...published } })
  log('photos attached to experiences, menu, events, offers, page headers, Home and About')
}
