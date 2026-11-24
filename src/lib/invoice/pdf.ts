import path from 'path'
import PDFDocument from 'pdfkit'

import type { InvoiceView } from './view'

const FONT_DIR = path.join(process.cwd(), 'public/fonts/invoice')
const FONTS = {
  regular: path.join(FONT_DIR, 'nunito-sans-latin-400-normal.woff'),
  bold: path.join(FONT_DIR, 'nunito-sans-latin-700-normal.woff'),
  display: path.join(FONT_DIR, 'cormorant-garamond-latin-700-normal.woff'),
}

// Design-system v1 colours (design/design-tokens.json).
const COLOR = { primary: '#1F4D3A', gold: '#E2C58F', cream: '#F7F3EA', text: '#1F2A24', muted: '#5B6358', line: '#DDD6C6' }
const STATUS = {
  unpaid: { bg: '#FBEBD2', text: '#7A4B00' },
  paid: { bg: '#DCEFE2', text: '#14532D' },
  void: { bg: '#F6DADA', text: '#8A1C1C' },
}

const PAGE = { width: 595.28, height: 841.89, margin: 48 }
const RIGHT = PAGE.width - PAGE.margin
const WIDTH = RIGHT - PAGE.margin
const BOTTOM = PAGE.height - 72

/** A4 invoice, same content as the web page (src/app/(invoice)). */
export function renderInvoicePdf(v: InvoiceView): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 0,
    autoFirstPage: false,
    bufferPages: true,
    lang: v.locale === 'id' ? 'id-ID' : 'en-GB',
    font: FONTS.regular,
    info: { Title: `${v.t.title} ${v.number}`, Author: v.seller.name },
  })
  const chunks: Buffer[] = []
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
  doc.registerFont('regular', FONTS.regular).registerFont('bold', FONTS.bold).registerFont('display', FONTS.display)
  doc.addPage()

  /** Writes wrapped text and returns the y below it. */
  const text = (
    value: string,
    x: number,
    y: number,
    { font = 'regular', size = 10, color = COLOR.text, width = WIDTH, align = 'left' as 'left' | 'right' | 'center' } = {},
  ) => {
    doc.font(font).fontSize(size).fillColor(color).text(value, x, y, { width, align, lineGap: 2 })
    return doc.y
  }
  const heightOf = (value: string, width: number, font = 'regular', size = 10) =>
    doc.font(font).fontSize(size).heightOfString(value, { width, lineGap: 2 })
  const rule = (y: number, color = COLOR.line) =>
    doc.moveTo(PAGE.margin, y).lineTo(RIGHT, y).lineWidth(0.75).strokeColor(color).stroke()

  // ── Header band with the site's leaf mark ──
  doc.rect(0, 0, PAGE.width, 116).fill(COLOR.primary)
  doc.save().translate(PAGE.margin - 6, 30).scale(0.86)
  doc.path('M32 50c-9 0-16-6.5-16-16 6.5 0 12.5 3 16 8 3.5-5 9.5-8 16-8 0 9.5-7 16-16 16z').fill(COLOR.gold)
  doc.path('M32 42c-3-4-4-10 0-18 4 8 3 14 0 18z').fill(COLOR.cream)
  doc.restore()
  text('D’Sanga', PAGE.margin + 50, 34, { font: 'display', size: 28, color: '#FFFFFF', width: 220 })
  text('Pool, Bistro & Space', PAGE.margin + 51, 70, { size: 9.5, color: COLOR.gold, width: 220 })
  text(v.t.title, RIGHT - 240, 34, { font: 'display', size: 28, color: '#FFFFFF', width: 240, align: 'right' })
  text(v.number, RIGHT - 240, 70, { font: 'bold', size: 10.5, color: COLOR.gold, width: 240, align: 'right' })

  // ── Seller + status ──
  let y = 140
  const chip = STATUS[v.status]
  const chipWidth = doc.font('bold').fontSize(10).widthOfString(v.statusLabel) + 24
  doc.roundedRect(RIGHT - chipWidth, y, chipWidth, 22, 11).fill(chip.bg)
  text(v.statusLabel, RIGHT - chipWidth, y + 4.5, { font: 'bold', color: chip.text, width: chipWidth, align: 'center' })
  let statusBottom = y + 26
  if (v.statusNote) statusBottom = text(v.statusNote, RIGHT - 220, y + 28, { size: 9, color: COLOR.muted, width: 220, align: 'right' })
  y = text(v.seller.name, PAGE.margin, y, { font: 'bold', size: 11, width: 270 })
  for (const line of v.seller.lines) y = text(line, PAGE.margin, y, { size: 9.5, color: COLOR.muted, width: 270 })
  y = Math.max(y, statusBottom) + 16

  // ── Customer + details ──
  rule(y)
  y += 16
  const top = y
  y = text(v.t.billTo.toUpperCase(), PAGE.margin, y, { font: 'bold', size: 8, color: COLOR.muted, width: 230 }) + 2
  y = text(v.customer.name, PAGE.margin, y, { font: 'bold', size: 12, width: 230 })
  for (const line of v.customer.lines) y = text(line, PAGE.margin, y, { size: 9.5, color: COLOR.muted, width: 230 })
  let dy = top
  const dx = PAGE.margin + 260
  for (const [label, value] of v.details) {
    text(label, dx, dy, { size: 9.5, color: COLOR.muted, width: 95 })
    dy = text(value, dx + 100, dy, { font: 'bold', size: 9.5, width: RIGHT - dx - 100, align: 'right' }) + 2
  }
  y = Math.max(y, dy) + 18

  // ── Items ──
  const col = { item: PAGE.margin + 10, qty: 300, price: 372, amount: 458 }
  const itemWidth = col.qty - col.item - 12
  const tableHead = () => {
    doc.roundedRect(PAGE.margin, y, WIDTH, 26, 4).fill(COLOR.cream)
    const style = { font: 'bold', size: 9, color: COLOR.primary }
    text(v.t.item, col.item, y + 7, { ...style, width: itemWidth })
    text(v.t.quantity, col.qty, y + 7, { ...style, width: 66 })
    text(v.t.unitPrice, col.price, y + 7, { ...style, width: 80, align: 'right' })
    text(v.t.amount, col.amount, y + 7, { ...style, width: RIGHT - 10 - col.amount, align: 'right' })
    y += 26
  }
  const newPage = () => {
    doc.addPage()
    y = PAGE.margin
  }
  tableHead()
  for (const item of v.items) {
    const rowHeight = Math.max(heightOf(item.description, itemWidth, 'bold'), heightOf(item.quantity, 66)) + 16
    if (y + rowHeight > BOTTOM) {
      newPage()
      tableHead()
    }
    text(item.description, col.item, y + 8, { font: 'bold', width: itemWidth })
    text(item.quantity, col.qty, y + 8, { width: 66 })
    text(item.unitPrice, col.price, y + 8, { width: 80, align: 'right' })
    text(item.amount, col.amount, y + 8, { font: 'bold', width: RIGHT - 10 - col.amount, align: 'right' })
    y += rowHeight
    rule(y)
  }

  // ── Totals ──
  const totalsHeight = v.sums.length * 18 + 54
  if (y + totalsHeight > BOTTOM) newPage()
  y += 12
  const sx = 320
  for (const [label, value] of v.sums) {
    text(label, sx, y, { color: COLOR.muted, width: 100 })
    text(value, sx + 100, y, { width: RIGHT - 10 - sx - 100, align: 'right' })
    y += 18
  }
  doc.roundedRect(sx - 12, y, RIGHT - sx + 12, 36, 6).fill(COLOR.primary)
  text(v.t.total, sx, y + 10, { font: 'bold', size: 11, color: '#FFFFFF', width: 80 })
  text(v.total, sx + 80, y + 6.5, { font: 'bold', size: 16, color: '#FFFFFF', width: RIGHT - 10 - sx - 80, align: 'right' })
  y += 60

  // ── Payment (only while there is something to pay) + notes ──
  if (v.status === 'unpaid') {
    const height = 20 + Math.max(1, v.seller.bankAccounts.length) * 34
    if (y + height > BOTTOM) newPage()
    y = text(v.t.payment, PAGE.margin, y, { font: 'bold', size: 11 }) + 2
    if (!v.seller.bankAccounts.length) y = text(v.t.paymentAsk, PAGE.margin, y, { color: COLOR.muted })
    for (const account of v.seller.bankAccounts) {
      y = text(`${account.bank} · ${account.number}`, PAGE.margin, y, { font: 'bold' })
      y = text(`${v.t.holder}: ${account.holder}`, PAGE.margin, y, { size: 9.5, color: COLOR.muted }) + 2
    }
    y += 12
  }
  if (v.seller.terms) {
    if (y + heightOf(v.seller.terms, WIDTH, 'regular', 9.5) > BOTTOM) newPage()
    y = text(v.seller.terms, PAGE.margin, y, { size: 9.5, color: COLOR.muted })
  }

  // ── Footer on every page ──
  const { start, count } = doc.bufferedPageRange()
  for (let i = start; i < start + count; i++) {
    doc.switchToPage(i)
    rule(PAGE.height - 56)
    text(v.t.thanks, PAGE.margin, PAGE.height - 44, { size: 9, color: COLOR.muted, width: 300 })
    text(`${v.number} · ${i - start + 1}/${count}`, RIGHT - 200, PAGE.height - 44, { size: 9, color: COLOR.muted, width: 200, align: 'right' })
  }
  doc.end()
  return done
}
