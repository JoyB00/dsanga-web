# Alur pesanan dan invoice (24 Nov 2026)

Tambahan di luar spesifikasi v1.3. Perlu masuk ke v1.4 dan disetujui klien.

## Alur

1. Customer melihat produk di website.
2. Tombol di setiap produk membuka WhatsApp admin, dengan pesan awal sesuai jenisnya.
3. Semua kesepakatan terjadi di WhatsApp.
4. Setelah deal, admin memasukkan pesanan di `/admin` › Pesanan.
5. Admin menekan **Buat invoice**, lalu **Kirim via WhatsApp** (tautan privat, ada unduh PDF).

Restaurant (Coffee & Bar) dan Bistro: hanya reservasi meja. Makanan dan minuman dipesan di tempat. Nomor meja ditentukan admin; customer tidak memilih meja di website. Tidak ada DP: harga tetap, dibayar penuh.

## Harga

Setiap produk punya **Show price on the website**. Harga yang disembunyikan juga tidak keluar lewat API publik, tetapi tetap dipakai admin di pesanan.

| Tampil | Disembunyikan |
|---|---|
| Pool, Work & Space, event, menu Bistro, paket tempat acara (belum ada angka: "Sesuai permintaan"), promo | Kopi dan minuman (Coffee & Bar), Kelas Kreatif |

Harga disimpan sebagai angka; teks hanya untuk kata seperti "Gratis".

## Pesan WhatsApp (`src/lib/whatsapp.ts`)

| Jenis | Dipakai di |
|---|---|
| `booking` | Pool, tarif Work & Space, aktivitas, promo. Menanyakan harga hanya bila harga tidak tampil |
| `join` | Event (tanggal sudah tertulis) |
| `table` | Bistro, Coffee & Bar |
| `quote` | Paket tempat acara |
| `ask` | Pertanyaan umum |

Formulir kontak hanya untuk pertanyaan umum; formulir di Work & Space dihapus.

## Aturan pesanan

- Nomor `DS-YYMM-0001` otomatis. Status: Deal, Selesai, Batal. Pesanan tidak bisa dihapus.
- Daftar produk mengisi keterangan dan harga; keduanya bisa diubah sesuai kesepakatan.
- Meja yang sudah terpakai di jam yang sama ditolak, kecuali "Izinkan meja ganda" dicentang. Lama default 120 menit.
- Setelah ada invoice aktif: customer, produk, harga, dan pembatalan terkunci. Jadwal masih bisa diubah.
- Jam di admin mengikuti zona waktu perangkat. Perangkat staf harus memakai WITA.

## Aturan invoice

- Nomor `INV/YYYY/MM/0001` berurutan, terpisah dari nomor pesanan. Satu invoice aktif per pesanan.
- Isi terkunci saat terbit, termasuk data usaha. Tidak bisa dihapus.
- Belum dibayar → Lunas (wajib cara pembayaran) → Batal (wajib alasan). Invoice lunas hanya bisa dibatalkan Penanggung Jawab.
- Tautan `/invoice/<token acak 48 karakter>`: tidak diindeks, tanpa analitik. Siapa pun yang memegang tautan bisa membukanya.
- Data usaha: `/admin` › Pengaturan invoice (khusus staf). Rekening kosong = customer diminta menghubungi WhatsApp.

## Hak akses

Pesanan, meja, dan invoice: Super Admin, Penanggung Jawab, dan peran baru **Admin Pesanan**. Admin Konten, Admin Produk, Viewer, dan publik tidak bisa melihatnya.

## Referensi

- Stripe Hosted Invoice Page (halaman privat, status, unduh PDF): https://docs.stripe.com/invoicing/hosted-invoice-page
- TourCMS Invoice (nomor invoice berurutan, terpisah dari nomor booking): https://www.tourcms.com/support/setup/invoice.php
- Jurnal.id (rincian jasa pada invoice usaha wisata): https://www.jurnal.id/id/blog/jenis-dan-contoh-invoice-yang-penting-untuk-bisnis/

PDF dibuat dengan PDFKit 0.17.2 (bukan react-pdf: rilis 24 Nov 2026 bergantung pada paket yang belum terbit).

## Belum termasuk

Pembayaran online, DP, pajak/service charge, pesan makanan online, stok, POS, WhatsApp Business API.

## Data sementara

12 meja contoh (R1–R6, B1–B6), data usaha dan catatan di Pengaturan invoice, masa simpan data pesanan di halaman Privasi.
