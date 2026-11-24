# Audit UX layout v3

**Tanggal:** 24 Nov 2026 · **Acuan:** UI UX Pro Max 2.15 (panduan UX, Next.js, Tailwind) + pengukuran di build produksi
**Cakupan:** 12 halaman × EN/ID di 375, 820 dan 1440 px; fokus keyboard di 11 halaman (EN); Lighthouse mobile di 10 URL.
Warna, huruf dan gaya sudah disetujui, jadi tidak diubah.

## Diperbaiki

| Temuan | Tingkat | Perbaikan |
|---|---|---|
| Tautan "Skip to main content" tertutup header tetap (WCAG 2.4.11) | Tinggi | Di atas header; ada tes |
| Ring fokus emas 2,4:1 di krem (minimal 3:1) | Tinggi | Emas tua #8A5A1C di latar terang, emas muda #E2C58F di latar gelap |
| Pemilih tanggal tanpa ring fokus | Sedang | `:focus-within` |
| Tombol dan kartu tanpa efek tekan di layar sentuh | Sedang | Skala kecil saat ditekan, mati pada *reduced motion* |
| Link breadcrumb 22 px, checkbox persetujuan 20 px (minimal 24) | Tinggi | 24 px |
| Link footer 36 px di ponsel | Sedang | 44 px |
| Satu kata tersisa di baris terakhir judul (11 judul) | Sedang | `text-wrap: balance`; sisa 0 |
| Tombol "Mencari diskon? …" pecah dua baris | Sedang | "Lihat promo berlaku" / "See current offers" |
| Teks 10–11 px | Sedang | 12 px (slogan di logo header 11 px) |
| Paragraf terlalu lebar | Sedang | Lebar dibatasi |
| Pengumuman filter tanpa konteks ("8 shown") | Tinggi | "8 experiences shown" / "8 pengalaman ditampilkan" |
| Angka harga tidak sejajar di tabel | Rendah | Angka tabular |
| Foto hero mobile sampai 87 KB | Tinggi | AVIF; terbesar 50 KB. Cache gambar 31 hari (URL berversi) |

## Performa (Lighthouse mobile, build produksi lokal, HTTP/1.1)

- Performance 93–97, Accessibility / Best Practices / SEO 100, CLS maks. 0,023.
- **LCP simulasi 2,7–3,3 s: di atas target 2,5 s** (sebelum audit 2,4–3,4 s).
- LCP dengan throttling nyata (median 3 kali): Home 2,8 → 2,2 s, Pool 2,0 → 1,8 s, Info Kunjungan 2,7 → 2,0 s.
- Menunda font judul diuji dan dibatalkan (pengaruh ≤ 0,2 s, judul berkedip). Ukur ulang di staging dengan HTTP/2 dan foto asli.

## Keputusan (24 Nov 2026)

1. **Promo di menu desktop:** ditambahkan. Menu penuh tampil mulai 1200 px, di bawahnya tombol menu.
2. **Bukti sosial:** belum ada; pasang hanya bila ada ulasan asli.
3. **Teks "Empat hal yang paling disukai tamu":** diganti "Empat alasan untuk datang ke D’Sanga". Judul "Favorit pengunjung" di Bistro masih perlu ditinjau.
4. **Home di ponsel ±9.600 px:** diterima.

## Dicatat, tidak diubah

- Ukuran huruf ditulis langsung (`text-[22px]`, …): belum jadi token. Tingkat rendah.
- Filter katalog tidak masuk URL.
- Saran gaya dari database skill (Aurora, Liquid Glass, biru langit) tidak cocok dengan gaya yang disetujui.
- Link "Kebijakan Privasi" 19 px di dalam kalimat: pengecualian *inline* WCAG 2.5.8.
