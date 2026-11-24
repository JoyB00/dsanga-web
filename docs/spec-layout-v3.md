# Spesifikasi Layout v3: tampilan yang lebih eye-catching

**Dasar:** [layout v2](spec-layout-v2.md), warna design system v1 · **Referensi:** https://www.balihiddencanyon.com/ (hanya pola layout)
**Tanggal:** 24 Nov 2026 · **Status:** diterapkan di semua halaman (lokal).

## Urutan Home

1. **Hero:** foto hampir selayar penuh, hanya area teks yang digelapkan. Isi: label, judul, satu kalimat, tombol. Foto bergerak sekali (4 detik) saat dibuka, mati pada *reduced motion*.
2. **Strip info:** jam buka, tiket pool, jumlah pengalaman yang tersedia, lokasi. Semua dari CMS; info yang kosong tidak tampil.
3. **Paket** (`#packages`, menggantikan video di referensi): promo aktif (maks. 4, F-13) sebagai kartu besar dengan harga dan nilai hemat, lalu paket acara privat. Tersembunyi bila keduanya kosong.
4. **Mozaik foto:** 8 foto tinggi-rendah (4 di ponsel).
5. **Pengalaman** (`#experiences`): gabungan "Empat Cara" dan katalog. Kartu bertepi gelombang di atas latar foto, dengan filter. Satu-satunya section gelap.
6. **Tentang:** teks + kolase 3 foto, nilai dalam satu baris.
7. **Acara terdekat**, **Mengapa D’Sanga** (ringkas), **Info kunjungan + FAQ**, **CTA**: tetap.

## Halaman dalam

- **Hero:** foto cerah, digelapkan hanya di belakang teks, tepi gelombang ke section berikutnya. Breadcrumb punya latar gelap sendiri. Kontak dan Privasi: gradien hijau + gelombang, tanpa foto.
- **Strip info** di atas gelombang: Pool, Bistro & Coffee, Work & Space. Info Kunjungan: peta + alamat.
- **Section gelap berlatar foto:** nilai (Tentang), kopi (Bistro), tarif (Work & Space), acara privat (Events). Maksimal satu per halaman.
- **Kartu bertepi gelombang:** menu unggulan, aktivitas, acara, promo, paket acara privat.
- **Foto tinggi-rendah:** Tentang dan Galeri. Pool: satu baris bila fotonya kurang dari 8.
- **CTA penutup** berlatar foto; baru di Promo dan Galeri. Pool dan Bistro dapat tombol kedua "Info kunjungan".

## CMS

- *Home page › Packages section*: eyebrow, judul, pengantar (EN/ID).
- *Home page › Photo mosaic › Photos* (4–8 foto) dan *About › Photos* (2 foto).
- *Venue packages › Image*.
- *Four ways section* disembunyikan dari admin. Kolomnya masih ada; hapus bersama migrasi tahap 7.

## Batas

- Teks hero di atas foto: cek kontras lagi setiap kali foto hero diganti (judul minimal 3:1, kalimat 4,5:1).
- Tinggi Home di ponsel (390 px) ±9.600 px (batas v2 ±9.000 px); diterima 24 Nov 2026 karena ada section Paket.
- Tidak ada video, embed Instagram, atau logo/rating ulasan.
