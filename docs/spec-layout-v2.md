# Spesifikasi Layout v2: tampilan bergaya Desa Wisata Sukawati

**Proyek:** Website D’Sanga Pool, Bistro & Space · **Dasar:** Spesifikasi v1.3, design system v1
**Referensi:** https://www.sukawatihub.com/ (Desa Wisata Sukawati; D’Sanga tercantum di sana sebagai Rute #7)
**Tanggal:** 22 Nov 2026 · **Status:** diterapkan di situs (lokal), 22 Nov 2026

> **Catatan penerapan.** Diterapkan dengan layout opsi A dan warna design system v1 (§3.1). Perbedaan dari spesifikasi ini:
> - **Kartu acara dan promo:** foto dengan tanggal atau masa berlaku di atas foto, sedangkan detail dan tombol WhatsApp ada di bawah foto. Kartu tidak bisa sepenuhnya overlay karena tombol tidak boleh berada di dalam kartu yang seluruhnya link.
> - **CMS Home:** ada tambahan grup *Four ways section* (eyebrow, judul, pengantar) untuk section gelap.
> - **Belum dikerjakan:** timeline opsional "Sehari di D’Sanga".
> - **Belum diukur:** Lighthouse untuk layout baru. Pengukuran dilakukan di staging dengan foto asli (tahap 7).

---

## 1. Ringkasan

**Bisa.** Layout D’Sanga bisa dibuat mirip referensi. Perubahannya hanya di **tampilan**: warna, huruf, header, hero, kartu dan urutan section. Yang **tidak berubah**:

- struktur halaman dan URL (EN/ID)
- CMS dan alur persetujuan
- form, WhatsApp dan SEO
- kriteria F-01 sampai F-15

Di CMS hanya ada beberapa field teks tambahan yang opsional (§7).

Karena D’Sanga adalah bagian dari Desa Wisata Sukawati, gaya visual yang sejalan dengan situs desa justru menguntungkan: pengunjung yang datang dari situs desa merasa masih di "keluarga" yang sama.

**Estimasi:** ±7,5 hari kerja, ditambah 1 hari kalau bagian opsional "Sehari di D’Sanga" ikut dikerjakan (§10).

**Perlu persetujuan klien:** spesifikasi ini mengganti design system v1 yang sudah disetujui (huruf Caveat, warna krem) dengan v2. Lihat keputusan di §3.

---

## 2. Analisis referensi

### 2.1 Pola yang diambil

| Pola di referensi | Dipakai di D’Sanga sebagai |
|---|---|
| Hero foto layar penuh, overlay gelap, judul serif besar, baris kedua berwarna hijau terang | Hero Home dan semua halaman dalam (versi lebih pendek) |
| Header berbentuk "pil" mengambang, transparan di atas foto | Header global |
| Label kecil berbentuk pil di atas judul section ("PROFIL & WARISAN BUDAYA") | Eyebrow di setiap section |
| Judul section di tengah, judul serif + paragraf pengantar | Header section standar |
| Section "Tentang": teks dan kutipan di kiri, 4 kartu ikon 2×2 di kanan | Section Tentang di Home |
| Section gelap dengan 4 kartu pengalaman | Section "Pengalaman" di Home (Pool, Bistro & Coffee, Work & Space, Aktivitas) |
| Katalog kartu foto tinggi: overlay gradasi, kategori, judul, chip jam, tombol panah, filter pil | Katalog pengalaman, aktivitas, acara, promo |
| "Mengapa berkunjung": 4 kartu ikon horizontal | Section "Mengapa D’Sanga" |
| Pita CTA bergradasi hijau tua ke hitam | CTA penutup di Home dan halaman dalam |
| Footer gelap 4 kolom, tombol WhatsApp mengambang ("Tanya Kami") | Footer global, tombol WhatsApp mengambang (F-03) |

### 2.2 Yang tidak ditiru

| Di referensi | Alasan | Pengganti di D’Sanga |
|---|---|---|
| Peta rute interaktif 12 titik | Khas desa (banyak lokasi); D’Sanga satu lokasi | Opsional: timeline "Sehari di D’Sanga" (§6.1, section 4) |
| Menu di ponsel berdesakan di dalam pil, menutupi eyebrow hero | Sulit dipakai, gagal target sentuh 44 px | Tombol menu (hamburger) dan panel menu |
| Judul bahasa Inggris di halaman bahasa Indonesia | Melanggar F-08 (tidak campur bahasa) | Semua teks per bahasa dari CMS |
| Gambar rusak di katalog (alt text tampil sebagai teks) | Bug | Gambar dari CMS, wajib alt (F-04) |
| Halaman Home ponsel ±15.000 px | Terlalu panjang | Batas ±9.000 px di 375 px (§8) |
| Teks hijau terang di atas latar putih | Kontras di bawah 4,5:1 | Hijau terang hanya di latar gelap (§3.2) |
| Teks, foto dan kode referensi | Hak cipta | Hanya pola layout yang ditiru; isi tetap milik D’Sanga |

---

## 3. Design system v2

### 3.1 Keputusan yang perlu disetujui

| Opsi | Isi | Catatan |
|---|---|---|
| **A (rekomendasi)** | Layout dan gaya referensi, warna hijau D’Sanga diperdalam ke emerald, aksen emas D’Sanga tetap ada | Terlihat sekeluarga dengan situs desa, tetapi tetap punya identitas sendiri |
| B | Sama persis dengan referensi (emerald terang, hitam netral, tanpa emas) | Paling mirip, identitas D’Sanga hilang |
| C | Layout baru, warna dan huruf v1 tetap (Caveat + krem) | Perubahan paling kecil, tapi tidak terasa "mirip" karena hurufnya sangat berbeda |

**Keputusan (22 Nov 2026):** layout dan huruf mengikuti opsi A, tetapi **warna tetap memakai design system v1**: hijau hutan #1F4D3A, krem #F7F3EA, pasir #EFE7D6, aksen emas #C8963E. Token tambahan untuk layout baru diambil dari keluarga warna yang sama:

| Token baru | Nilai | Asal |
|---|---|---|
| `dark` (section gelap) | #163828 | v1 `primary-hover` |
| `footer` | #1F2A24 | v1 `foreground` |
| `dark-surface` (kartu di section gelap) | #1F4D3A | v1 `primary` |
| `on-dark-accent` (teks aksen di latar gelap) | #E2C58F | v1 `accent-on-dark` |
| `gradient-cta` | #1F4D3A → #163828 → #1F2A24 | v1 |

Tabel warna emerald di §3.2 di bawah ini **tidak dipakai lagi**; disimpan hanya sebagai catatan opsi A. Prototipe di `/prototype/en` dan `/prototype/id` sudah memakai warna v1.

### 3.2 Warna (token)

Nama token tetap sama (`--ds-color-*` di `design-tokens.css`), jadi komponen tidak perlu ditulis ulang. Hanya nilainya yang berubah, ditambah token untuk section gelap.

| Token | v1 | v2 | Pemakaian |
|---|---|---|---|
| `background` | #F7F3EA | #FAF8F3 | Latar halaman |
| `surface` | #FFFFFF | #FFFFFF | Kartu |
| `surface-alt` | #EFE7D6 | #F1F5F2 | Latar section selang-seling |
| `foreground` | #1F2A24 | #17201B | Teks utama |
| `muted-foreground` | #5B6358 | #4F5B54 | Teks sekunder |
| `primary` | #1F4D3A | **#047857** | Tombol utama, link (putih di atasnya: 5,5:1) |
| `primary-hover` | #163828 | #065F46 | |
| `highlight` | #E4EEE3 | #D1FAE5 | Latar eyebrow dan chip (teks #065F46: 6,8:1) |
| `accent` (emas) | #C8963E | #C8963E | Badge "Segera hadir", harga, ring fokus |
| baru `dark` | — | #0F1A15 | Section gelap, footer |
| baru `dark-surface` | — | #16241D | Kartu di section gelap |
| baru `on-dark-accent` | — | #34D399 | Teks hijau terang, **hanya di latar gelap** |
| baru `gradient-cta` | — | #065F46 → #134E4A → #0F1A15 | Pita CTA |
| baru `overlay-hero` | — | hitam 30% (atas) → 70% (bawah) | Di atas foto hero; teks putih minimal 4,5:1 |

### 3.3 Huruf

| Peran | v1 | v2 |
|---|---|---|
| Judul (h1–h3) | Caveat 600/700 | **Cormorant Garamond 600/700** (serif) |
| Teks, tombol, menu | Nunito Sans | Nunito Sans (tetap; mirip Karla di referensi, sudah terpasang) |
| Kutipan/tagline | — | Cormorant Garamond Italic 500 |

**Ukuran:**

| Elemen | Desktop | Ponsel |
|---|---|---|
| Judul hero Home | 96 px | 44 px |
| Judul hero halaman dalam | 64 px | 38 px |
| h2 | 48 px | 34 px |
| h3 kartu | 22 px | 22 px |

- Line-height judul: 1,05.
- Letter-spacing judul: -0,02 em.
- Cormorant tipis di ukuran kecil, jadi tidak dipakai di bawah 20 px.
- Huruf dimuat lewat `next/font` (self-hosted), hanya latin, maksimal 3 file judul supaya LCP tetap aman.

### 3.4 Bentuk dan bayangan

| Elemen | Ukuran |
|---|---|
| Radius tombol, filter dan eyebrow | pil penuh |
| Radius kartu | 20 px (sama) |
| Radius foto | 24 px (v1: 32 px) |
| Kartu terang | border 1 px #E5ECE7, bayangan halus |
| Kartu di section gelap | border 1 px putih 8%, tanpa bayangan |
| Tombol utama | bayangan hijau tipis |

---

## 4. Komponen global

### 4.1 Header

**Desktop:**
- Bentuknya pil mengambang: lebar konten, jarak 16 px dari atas, radius penuh.
- Di atas hero: latar putih 85% + blur (`backdrop-filter`). Kalau browser tidak mendukung blur, latar putih 95%.
- Isinya:
  - kiri: logo teks D’SANGA dengan sub-label
  - tengah: menu
  - kanan: EN | ID
- Setelah halaman digulir lebih dari 80 px, header tetap di atas (sticky) dan bayangannya sedikit menebal.

**Ponsel:**
- Pil berisi logo dan tombol menu 44 × 44 px.
- Panel menu turun penuh lebar, berisi semua link dan pengalih bahasa.
- Escape menutup panel, fokus kembali ke tombol, dan panel tetap bisa dipakai lewat keyboard.

**Pengganti komponen:**
- `SiteHeader`, `NavLinks`, menu ponsel (sekarang `details/summary`).
- Hanya tampilan yang diganti; link dan tautan bahasa tetap dari `LanguageSwitcher`.

### 4.2 Hero

| Varian | Tinggi | Isi |
|---|---|---|
| Home | 88 vh desktop, 80 svh ponsel | Eyebrow pil, judul 2 baris (baris 2 `on-dark-accent`), tagline italic, intro, 2 tombol, penanda "Gulir ke bawah" |
| Halaman dalam | 60 vh desktop, 52 svh ponsel | Breadcrumb putih, eyebrow, h1, tagline, tombol WhatsApp/aksi utama |
| Tanpa foto (Kontak, Privasi) | Pendek (±280 px) | Latar `gradient-cta`, breadcrumb, h1 |

- Foto hero dimuat `eager` + `fetchPriority="high"` (seperti sekarang), dengan ukuran `hero` 1920 px.
- Titik fokus foto dari CMS (`focalX/Y`) dipakai sebagai `object-position`.
- Penanda gulir bersifat dekoratif (`aria-hidden`) dan tidak beranimasi kalau pengguna memilih `prefers-reduced-motion`.

### 4.3 Elemen kecil

- **Eyebrow badge:** pil, huruf kapital 12 px, letter-spacing 0,18 em. Di latar terang: `highlight` + teks #065F46. Di latar gelap: border `on-dark-accent` 40% + teks `on-dark-accent`.
- **Section header:** eyebrow, h2, pengantar maksimal 640 px. Rata tengah untuk katalog dan section gelap, rata kiri untuk section 2 kolom.
- **Tombol:**
  - utama: `primary`, pil, tinggi 48 px
  - sekunder terang: outline
  - sekunder di atas foto: kaca gelap (hitam 40% + border putih 20%)
  - semua punya ikon opsional di kiri atau kanan
- **Chip info:** pil kecil berisi ikon + teks (jam, tanggal, harga). Di atas foto: hitam 55% + teks putih.

### 4.4 Kartu

| Kartu | Isi | Dipakai di |
|---|---|---|
| **Kartu foto overlay** (baru) | Foto rasio 4:5, gradasi hitam 0 → 75% dari tengah ke bawah. Badge kiri atas (mis. "Segera hadir" emas). Di bawah: kategori (kapital, `on-dark-accent`), judul serif putih, 1–2 chip. Tombol panah bulat kanan bawah. Seluruh kartu satu link dengan nama aksesibel = judul. | Katalog pengalaman, aktivitas, acara, promo |
| Kartu ikon | Kotak ikon 48 px (radius 12, warna lembut), judul serif 22 px, teks 14 px | Tentang, fasilitas |
| Kartu gelap | `dark-surface`, ikon, judul, teks, garis pemisah, tag kecil berwarna di bawah | Section Pengalaman |
| Kartu horizontal | Ikon di kiri, judul dan teks di kanan | Mengapa D’Sanga, info kunjungan |

**Interaksi kartu foto:**
- Saat hover, foto zoom 1,04 dalam 300 ms (tidak ada animasi kalau pengguna memilih reduced-motion).
- Fokus keyboard memakai ring emas di seluruh kartu.

### 4.5 Filter pil

- Bentuknya deretan pil dengan jumlah item, mis. "Semua (8)" dan "Pool (1)".
- Filter aktif: `primary` dengan teks putih.
- Di ponsel pil turun ke baris berikutnya (wrap), bukan geser horizontal. Tes "tidak ada scroll ke samping" harus tetap lolos.
- Memakai `role="tablist"` atau `aria-pressed`. Hasil filter diumumkan ke pembaca layar lewat `aria-live` ("6 hasil").

### 4.6 Pita CTA

- Latar `gradient-cta`, teks rata tengah.
- Isinya: eyebrow, h2 putih, paragraf, dua tombol (utama ke WhatsApp, sekunder outline putih).

### 4.7 Footer

Latar `dark`, 4 kolom di desktop, ditumpuk di ponsel:

1. Logo dengan aksen hijau, slogan, deskripsi singkat, kontak (WhatsApp, email, alamat) dengan ikon bulat.
2. Jelajahi (link halaman).
3. Informasi (Tentang, Galeri, Promo, Kunjungi, Kontak, Privasi).
4. Kotak slogan (kutipan italic).

Baris bawah: hak cipta di kiri, "Bagian dari Desa Wisata Sukawati" di kanan (link ke situs desa, kalau disetujui; §11).

### 4.8 Tombol WhatsApp mengambang

- Pil hijau WhatsApp (#25D366, teks #0B3D2E supaya kontrasnya cukup) berlabel "Tanya Kami" / "Ask Us".
- Posisinya kanan bawah, 16 px dari tepi, dan tidak menutupi tombol kirim form.
- Pesan pra-isi mengikuti halaman dan bahasa (F-03, logika yang sama dengan sekarang). Tombol tersembunyi kalau nomor WhatsApp belum diisi.
- Di ponsel ditampilkan sebagai ikon bulat 56 px dengan label untuk pembaca layar.

---

## 5. Aturan section

Latar section bergantian: putih → `surface-alt` → putih.

- Maksimal **satu section gelap** per halaman, plus pita CTA dan footer.
- Jarak vertikal section: 96 px desktop, 64 px ponsel.
- Lebar konten maksimal 1152 px (sama dengan v1).

---

## 6. Layout per halaman

### 6.1 Home

| # | Section | Isi dan sumber data |
|---|---|---|
| 1 | **Hero** | Foto `home.hero.image`; eyebrow "D’SANGA · SUKAWATI, BALI"; judul (`hero.title` + baru `hero.titleAccent` berwarna); baru `hero.tagline` (italic); `hero.intro`; tombol "Jelajahi D’Sanga" (ke #pengalaman) dan "Chat WhatsApp" |
| 2 | **Tentang** (terang) | Kiri: eyebrow, h2, `about.text`, kartu kutipan (baru `about.quote`). Kanan: 4 kartu ikon dari `about.values` (ikon + label; baru `values[].text` opsional). Tombol "Tentang D’Sanga" |
| 3 | **Pengalaman** (gelap) | 4 kartu gelap per tipe pengalaman: Pool, Bistro & Coffee, Work & Space, Aktivitas. Isinya ikon, judul, tagline, tag bawah (mis. "Kolam anak & dewasa"). Menggantikan deretan 6 ikon yang sekarang |
| 4 | *Opsional:* **Sehari di D’Sanga** (terang) | Timeline sederhana Pagi / Siang / Sore / Malam: jam, judul, teks, link ke pengalaman. Pengganti peta rute referensi. Butuh data baru (§7). Bisa dikerjakan belakangan |
| 5 | **Katalog pengalaman** (`surface-alt`) | Eyebrow, h2, filter pil per tipe, kartu foto overlay 3 kolom (2 di tablet, 1 di ponsel). Chip: jam buka hari biasa; badge "Segera hadir". Ponsel: 4 kartu, lalu tombol "Lihat semua" |
| 6 | **Promo & acara** (terang) | Kartu foto overlay: chip "Berlaku s/d …" atau tanggal/jam, harga. Maksimal 3, tombol "Semua promo" dan "Semua acara" |
| 7 | **Mengapa D’Sanga** (putih) | 4 kartu horizontal 2×2 (baru `whyVisit`) |
| 8 | **Galeri** (`surface-alt`) | 6 foto rasio 1:1, radius 20, tombol "Buka galeri" (komponen yang ada) |
| 9 | **Rencanakan kunjungan** (terang) | Peta, alamat, jam, parkir, FAQ singkat (yang ada, gaya baru) |
| 10 | **Pita CTA** | Baru `home.cta`: eyebrow, judul, teks, tombol WhatsApp dan "Info kunjungan" |

### 6.2 Halaman dalam

Semua halaman memakai komponen yang sama. Perubahan per halaman:

| Halaman | Hero | Perubahan section |
|---|---|---|
| Tentang | Foto | Cerita (2 kolom + kutipan), nilai (kartu ikon), pengelola (Desa Sukawati), pita CTA |
| Pool | Foto | Fasilitas → kartu ikon; jam dan harga → tabel bergaya kartu; galeri; aturan dan FAQ (akordeon kartu); CTA |
| Bistro & Coffee | Foto | Hidangan favorit → kartu foto (rasio 4:3, nama + harga di bawah, **bukan** overlay supaya harga mudah dibaca); tab menu → filter pil; section kopi; ambience; CTA reservasi grup |
| Work & Space | Foto | Fasilitas, harga day pass, galeri, FAQ, CTA |
| Aktivitas | Foto | Katalog kartu foto overlay + filter (Semua / Tersedia / Segera hadir) |
| Acara | Foto | Kartu foto overlay dengan chip tanggal dan jam; acara lewat otomatis hilang (F-13, tetap) |
| Promo | Foto | Kartu foto overlay dengan chip "Berlaku s/d" dan harga |
| Galeri | Foto | Filter pil (sudah ada), grid foto radius 20, lightbox tetap |
| Kunjungi | Foto | Peta besar, kartu info horizontal (alamat, jam, parkir, transportasi, aksesibilitas), FAQ |
| Kontak | Tanpa foto (gradasi) | Form (F-14) di kartu putih, info kontak di samping |
| Privasi | Tanpa foto (gradasi) | Teks panjang, lebar baca 720 px |

---

## 7. Perubahan CMS

Semua field baru bersifat **opsional dan per bahasa**. Konten yang sudah ada tetap tampil walaupun field baru kosong. Field baru ikut aturan bilingual F-08 dan penanda data sementara F-15. Perlu satu migrasi database (`payload migrate:create`).

| Lokasi | Field baru | Kalau kosong |
|---|---|---|
| Home › Hero | `titleAccent` (teks), `tagline` (teks) | Judul satu warna, tanpa tagline |
| Home › Tentang | `quote` (textarea), `values[].text` (teks) | Tanpa kartu kutipan, kartu hanya label |
| Home › baru `whyVisit` | `eyebrow`, `title`, `intro`, `items[4]` (ikon, judul, teks) | Section disembunyikan |
| Home › baru `cta` | `eyebrow`, `title`, `text`, label tombol | Teks bawaan dari kamus situs |
| Pengalaman | `cardTag` (teks pendek untuk kartu gelap) | Tagline dipakai |
| *Opsional:* Home › `dayPlan` | `items[]`: fase (pagi/siang/sore/malam), jam, judul, teks, relasi pengalaman | Section disembunyikan |

Seed data sementara (`pnpm seed`) diperbarui dengan contoh isi untuk field baru (EN + ID, `verified = false`).

---

## 8. Kebutuhan non-fungsional

| Aspek | Syarat |
|---|---|
| Aksesibilitas | WCAG 2.1 AA; axe 0 pelanggaran di 24 halaman. Teks di atas foto minimal 4,5:1 (overlay wajib). Hijau terang hanya di latar gelap. Target sentuh minimal 44 px. Fokus terlihat di semua kartu. Semua animasi mati dengan reduced-motion. |
| Performa (spesifikasi §9) | Lighthouse mobile: Performance ≥ 90, LCP ≤ 2,5 s, CLS ≤ 0,1. Hero foto layar penuh adalah LCP, jadi ukuran `hero` WebP ≤ 300 KB dan tanpa video atau slider di hero. Maksimal 5 file huruf. |
| Responsif | 375, 768, 1024, 1440 px. Tanpa scroll horizontal. Home di 375 px kira-kira ≤ 9.000 px. |
| Bilingual | Tidak ada teks campur bahasa; label komponen baru masuk kamus EN/ID. |
| SEO dan analitik | Tidak berubah (metadata, hreflang, sitemap, event GA4 tetap). Klik tombol WhatsApp mengambang dicatat sebagai event `whatsapp_click` dengan `location = floating`. |
| Browser | Safari iOS 16+, Chrome Android, Chrome/Edge/Firefox/Safari desktop versi terbaru. Ada fallback kalau `backdrop-filter` tidak didukung. |

---

## 9. Kriteria penerimaan

| # | Kriteria |
|---|---|
| L-01 | Token v2 dan huruf Cormorant + Nunito Sans terpasang; tidak ada sisa Caveat. |
| L-02 | Header pil mengambang di desktop; menu hamburger di ponsel bisa dipakai dengan keyboard dan pembaca layar. |
| L-03 | Hero layar penuh di Home dan halaman dalam; varian tanpa foto untuk Kontak dan Privasi. |
| L-04 | Home berisi section 1–3 dan 5–10 sesuai §6.1, semuanya dari CMS. |
| L-05 | Kartu foto overlay dipakai di katalog pengalaman, aktivitas, acara dan promo; seluruh kartu bisa diklik dan difokus. |
| L-06 | Filter pil berfungsi tanpa memuat ulang halaman, mengumumkan jumlah hasil, dan tidak menyebabkan scroll horizontal. |
| L-07 | Footer gelap 4 kolom dan tombol WhatsApp mengambang dengan pesan per halaman dan bahasa. |
| L-08 | Field CMS baru tersedia, opsional, per bahasa, dengan migrasi dan seed. |
| L-09 | Lighthouse dan axe memenuhi §8 di halaman yang sama dengan QA tahap 6. |
| L-10 | Semua tes otomatis lolos (integrasi + browser); tes disesuaikan untuk menu dan komponen baru. |
| L-11 | Dicek di iPhone Safari dan Android Chrome. |
| L-12 | *(Opsional)* "Sehari di D’Sanga" tampil dari CMS dan tersembunyi kalau kosong. |

---

## 10. Tahapan dan estimasi

| Tahap | Pekerjaan | Hari kerja |
|---|---|---|
| 0 | Prototipe Home (desktop + ponsel) di lingkungan lokal untuk disetujui klien | 1 (termasuk di tahap B kalau disetujui) |
| A | Token v2, huruf, tombol, eyebrow, section header, header, footer, WhatsApp mengambang | 1,5 |
| B | Home (semua section) + field CMS + migrasi + seed | 2,5 |
| C | Halaman dalam (11 halaman lewat template bersama) | 2 |
| D | QA: perbarui tes browser, axe, Lighthouse, cek perangkat nyata | 1,5 |
| | **Total** | **±7,5** |
| Opsional | "Sehari di D’Sanga" (data + tampilan) | +1 |

**Urutan kerja:**
- Tahap 0 dulu, supaya arah visual (opsi A/B/C) disetujui sebelum pekerjaan besar dimulai.
- Tahap 7 (deploy staging) bisa jalan sesudah tahap D. Lighthouse akhir diukur di staging dengan foto asli.

---

## 11. Pertanyaan terbuka

1. ~~**Design system:** opsi A, B atau C (§3.1)?~~ Diputuskan: layout opsi A dengan warna v1 (§3.1). Masih perlu dikonfirmasi: siapa di pihak klien yang menyetujui pergantian huruf dari Caveat ke Cormorant Garamond.
2. **Hubungan dengan situs desa:** apakah boleh menambahkan "Bagian dari Desa Wisata Sukawati" dengan link ke sukawatihub.com di footer? Apakah pengelolanya sama, sehingga logo atau warna perlu diselaraskan secara resmi?
3. **"Sehari di D’Sanga":** dimasukkan sekarang atau nanti?
4. **Foto:** hero layar penuh butuh foto lanskap berkualitas (minimal 2400 px lebar) dengan ruang kosong untuk teks. Kapan foto asli D’Sanga tersedia? Sampai saat itu, foto stok sementara tetap dipakai.
5. **Tagline dan kutipan:** isi teks EN/ID untuk field baru (tagline hero, kutipan Tentang, Mengapa D’Sanga, CTA) disediakan klien atau dibuatkan draf dulu?
