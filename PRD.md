# PRD — Toko Produk Digital dengan Lisensi

## 1. Ringkasan
Toko online untuk menjual produk digital (e-book, template, source code). Pembeli
checkout (simulasi pembayaran), menerima license key unik, dan mengunduh file
melalui link bertanda tangan (HMAC) yang kedaluwarsa dan berkuota. File PDF
di-watermark dengan email pembeli saat diunduh. Admin dapat merilis versi baru
produk; pembeli lama otomatis mendapat akses versi baru dengan license key yang
sama, disertai notifikasi.

## 2. Stack
Next.js 14 + TypeScript + Prisma 5.22 + SQLite + Tailwind CSS. App Router,
API di `app/api/**/route.ts`, alias `@/*`, singleton Prisma di `lib/prisma.ts`,
seed via `tsx`.

## 3. Fungsionalitas

### F0 — Fondasi
Repo, PRD, konfigurasi proyek, skema Prisma, util format, layout dasar.

### F1 — Katalog & Detail Produk (publik)
- Halaman katalog `/`: daftar produk (nama, tipe, harga, versi terkini).
- Halaman detail `/produk/[id]`: deskripsi, harga, tipe, tombol "Beli Sekarang".
- API: `GET /api/products`, `GET /api/products/[id]`.
- Empty state saat belum ada produk.

### F2 — Checkout (simulasi pembayaran)
- Form checkout di halaman detail: nama, email, data pembayaran simulasi.
- Pembayaran selalu sukses (simulasi, dinyatakan jujur di UI).
- `POST /api/checkout` membuat Purchase: license key unik format
  `XXXX-XXXX-XXXX-XXXX`, kuota unduhan 5x, tercatat versi produk saat dibeli.
- Respons: license key + link unduhan bertanda tangan (berlaku 24 jam).

### F3 — Link Unduhan Bertanda Tangan (HMAC)
- Link: `/api/download?p=<purchaseId>&v=<versionId>&exp=<epoch>&sig=<hmac>`.
- Signature = HMAC-SHA256 atas `p.v.exp` dengan secret server (`DOWNLOAD_SECRET`).
- Validasi: signature cocok, belum kedaluwarsa (24 jam), kuota belum habis,
  purchase & versi valid dan saling cocok.
- Setiap unduhan sukses mengurangi kuota SECARA ATOMIK
  (conditional `updateMany` + cek row terpengaruh). Unduhan ke-6 (kuota habis)
  → `410`. Signature rusak / kedaluwarsa → `403`. Produk tak ada → `404`.
- File PDF di-watermark saat diunduh: setiap halaman disisipi teks email
  pembeli (pdf-lib, nyata, bukan fake).
- File non-PDF dikirim apa adanya.

### F4 — Pembelian Saya & Validasi Lisensi (publik)
- Halaman `/pembelian`: cari pembelian berdasarkan email → daftar pembelian,
  license key, notifikasi versi baru, dan tombol unduh (link baru dibuat
  on-demand, berlaku 24 jam).
- Halaman `/validasi`: form input license key (publik).
- API `GET /api/license/validate?key=`: valid → info produk + pembeli +
  tanggal beli; invalid → 404.

### F5 — Admin
- Halaman `/admin`: daftar produk, tambah produk (upload file → versi 1.0),
  hapus produk, upload versi baru per produk, daftar penjualan, daftar
  notifikasi.
- API: `POST /api/products` (multipart), `DELETE /api/products/[id]`,
  `POST /api/products/[id]/versions` (multipart → versi baru, jadikan versi
  terkini, buat notifikasi untuk SEMUA pembeli produk itu),
  `GET /api/sales`, `GET /api/notifications?licenseKey=`.

### F6 — Seed & Dokumentasi
- Seed 3 produk: 1 e-book PDF asli (multi-halaman, agar watermark bisa dites),
  1 template, 1 source code.
- README dengan cara menjalankan.

## 4. Model Data
- **Product**: id, name, description, price (rupiah, Int), type
  (`EBOOK`|`TEMPLATE`|`SOURCE_CODE`), currentVersionId?, createdAt.
- **ProductVersion**: id, productId, version (string), fileName, filePath,
  fileSize, mime, createdAt.
- **Purchase**: id, productId, versionId (versi saat dibeli), buyerName,
  buyerEmail, licenseKey (unik), maxDownloads (5), downloadsUsed (0),
  purchasedAt.
- **Notification**: id, purchaseId, message, read, createdAt.

## 5. Aturan Bisnis Penting
1. License key unik per pembelian, format `XXXX-XXXX-XXXX-XXXX`.
2. Link unduhan kedaluwarsa 24 jam; signature HMAC-SHA256.
3. Kuota unduhan 5x per pembelian; pengurangan kuota atomik (conditional
   updateMany). Kuota habis → 410.
4. Pembeli lama otomatis bisa mengunduh versi baru dengan license key yang
   sama; setiap rilis versi baru mencatat notifikasi per pembelian.
5. Watermark PDF: email pembeli di setiap halaman, dikerjakan saat unduh.
6. Checkout adalah simulasi (selalu sukses) dan dinyatakan demikian di UI.

## 6. Kasus Uji (curl)
- checkout → 201, license key + link.
- unduh link valid → 200, watermark terverifikasi di bytes PDF.
- link kedaluwarsa → 403; kuota habis → 410; signature rusak → 403.
- validasi license key benar → 200; salah → 404.
- upload versi baru → pembeli lama bisa unduh versi baru (kuota bersama).
- produk tak ada → 404.
