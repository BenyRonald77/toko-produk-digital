# Toko Produk Digital dengan Lisensi

Toko online untuk produk digital (e-book, template, source code). Setiap pembelian
mendapat license key unik (`XXXX-XXXX-XXXX-XXXX`), link unduhan bertanda tangan
(HMAC, kedaluwarsa 24 jam, kuota 5x unduhan), dan file PDF di-watermark dengan
email pembeli. Admin bisa merilis versi baru; pembeli lama otomatis mendapat
akses versi baru dengan license key yang sama.

## Cara Menjalankan

```bash
npm install
cp .env.example .env   # lalu isi DOWNLOAD_SECRET dengan string acak
npx prisma generate
npx prisma db push
npm run seed
npm run dev
```

Buka http://localhost:3000

## Halaman

- `/` — katalog produk
- `/produk/[id]` — detail produk + tombol beli
- `/checkout/[id]` — checkout (simulasi pembayaran, selalu sukses)
- `/pembelian` — cari pembelian via email: license key, link unduhan, notifikasi versi baru
- `/validasi` — validasi license key publik
- `/admin` — tambah produk, rilis versi baru, daftar penjualan

## API

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | /api/products | daftar produk |
| POST | /api/products | tambah produk + file (multipart, admin) |
| GET | /api/products/[id] | detail produk |
| DELETE | /api/products/[id] | hapus produk (admin) |
| POST | /api/products/[id]/versions | rilis versi baru (multipart, admin) |
| POST | /api/checkout | checkout simulasi → license key + link |
| GET | /api/download-link?licenseKey=&versionId= | buat link unduhan bertanda tangan |
| GET | /api/download?p=&v=&exp=&sig= | unduh file (validasi HMAC + kuota) |
| GET | /api/license/validate?key= | validasi license key publik |
| GET | /api/purchases?email= | daftar pembelian + notifikasi |
| GET | /api/sales | daftar penjualan (admin) |

## Aturan bisnis

- Link unduhan: HMAC-SHA256 atas `purchaseId.versionId.exp`, kedaluwarsa 24 jam.
- Kuota 5x unduhan per pembelian; pengurangan atomik via conditional `updateMany`.
- Kuota habis → 410, signature rusak/kedaluwarsa → 403, tak ada → 404.
- PDF di-watermark email pembeli di setiap halaman saat diunduh (pdf-lib).
