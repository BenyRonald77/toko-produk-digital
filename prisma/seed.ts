import { PrismaClient } from "@prisma/client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();
const STORAGE = path.join(process.cwd(), "storage", "products");

async function makeEbookPdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const chapters = [
    {
      title: "Bab 1: Memulai Toko Online",
      body: "Langkah pertama membangun toko online adalah memahami produk yang dijual. Produk digital seperti e-book, template, dan source code tidak memerlukan gudang fisik. Fokuslah pada kualitas konten dan kemudahan proses checkout agar pembeli merasa aman.",
    },
    {
      title: "Bab 2: Strategi Harga",
      body: "Harga produk digital sebaiknya mencerminkan nilai yang diterima pembeli. Riset harga kompetitor, lalu tentukan posisi: lebih murah dengan volume besar, atau premium dengan dukungan purna jual. Jangan lupa memperhitungkan biaya platform pembayaran.",
    },
    {
      title: "Bab 3: Melindungi Karya Anda",
      body: "Gunakan license key unik untuk setiap pembelian. Batasi jumlah unduhan dan beri masa kedaluwarsa pada link unduhan. Untuk dokumen PDF, sisipkan watermark berisi identitas pembeli di setiap halaman agar kebocoran mudah dilacak.",
    },
  ];

  for (const ch of chapters) {
    const page = pdf.addPage([595, 842]);
    page.drawText(ch.title, { x: 50, y: 780, size: 20, font: bold, color: rgb(0.1, 0.4, 0.25) });
    const words = ch.body.split(" ");
    let line = "";
    let y = 740;
    for (const w of words) {
      if ((line + " " + w).length > 75) {
        page.drawText(line, { x: 50, y, size: 12, font, color: rgb(0.2, 0.2, 0.2) });
        y -= 20;
        line = w;
      } else {
        line = line ? line + " " + w : w;
      }
    }
    if (line) page.drawText(line, { x: 50, y, size: 12, font, color: rgb(0.2, 0.2, 0.2) });
    page.drawText("Panduan Praktis Membuat Toko Online - Sampel", {
      x: 50,
      y: 40,
      size: 9,
      font,
      color: rgb(0.5, 0.5, 0.5),
    });
  }
  pdf.setTitle("Panduan Praktis Membuat Toko Online");
  return await pdf.save();
}

const TEMPLATE_HTML = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="utf-8"><title>Template Landing Page Startup</title></head>
<body>
<header><h1>Nama Startup Anda</h1><p>Tagline produk dalam satu kalimat.</p></header>
<section><h2>Fitur Unggulan</h2><ul><li>Fitur satu</li><li>Fitur dua</li><li>Fitur tiga</li></ul></section>
<section><h2>Harga</h2><p>Mulai dari Rp99.000/bulan.</p></section>
<footer><p>Kontak: halo@startup.id</p></footer>
</body>
</html>
`;

const SOURCE_CODE = `// Contoh source code: util format rupiah
export const rupiah = (n) => "Rp" + Math.round(n).toLocaleString("id-ID");
export const diskon = (harga, persen) => Math.round(harga * (1 - persen / 100));
console.log(rupiah(diskon(150000, 10))); // Rp135.000
`;

async function main() {
  const n = await prisma.product.count();
  if (n > 0) {
    console.log("seed dilewati (sudah ada data)");
    return;
  }
  await mkdir(STORAGE, { recursive: true });

  const ebookBytes = await makeEbookPdf();
  const ebookPath = path.join(STORAGE, "seed-ebook-toko-online.pdf");
  await writeFile(ebookPath, Buffer.from(ebookBytes));

  const tplPath = path.join(STORAGE, "seed-template-landing.html");
  await writeFile(tplPath, TEMPLATE_HTML);

  const srcPath = path.join(STORAGE, "seed-source-kasir.js");
  await writeFile(srcPath, SOURCE_CODE);

  const ebook = await prisma.product.create({
    data: {
      name: "Panduan Praktis Membuat Toko Online",
      description:
        "E-book 3 bab: memulai toko online, strategi harga produk digital, dan melindungi karya dengan lisensi. File PDF di-watermark dengan email pembeli.",
      price: 99000,
      type: "EBOOK",
    },
  });
  const v1 = await prisma.productVersion.create({
    data: {
      productId: ebook.id,
      version: "1.0",
      fileName: "panduan-toko-online.pdf",
      filePath: ebookPath,
      fileSize: ebookBytes.length,
      mime: "application/pdf",
    },
  });
  await prisma.product.update({ where: { id: ebook.id }, data: { currentVersionId: v1.id } });

  const tpl = await prisma.product.create({
    data: {
      name: "Template Landing Page Startup",
      description:
        "Template HTML siap pakai untuk landing page startup: header, fitur, harga, dan footer. Mudah disesuaikan.",
      price: 149000,
      type: "TEMPLATE",
    },
  });
  const v2 = await prisma.productVersion.create({
    data: {
      productId: tpl.id,
      version: "1.0",
      fileName: "template-landing-page.html",
      filePath: tplPath,
      fileSize: Buffer.byteLength(TEMPLATE_HTML),
      mime: "text/html",
    },
  });
  await prisma.product.update({ where: { id: tpl.id }, data: { currentVersionId: v2.id } });

  const src = await prisma.product.create({
    data: {
      name: "Source Code Util Kasir",
      description:
        "Kumpulan fungsi util JavaScript untuk aplikasi kasir: format rupiah dan hitung diskon. Kode bersih dan terdokumentasi.",
      price: 199000,
      type: "SOURCE_CODE",
    },
  });
  const v3 = await prisma.productVersion.create({
    data: {
      productId: src.id,
      version: "1.0",
      fileName: "util-kasir.js",
      filePath: srcPath,
      fileSize: Buffer.byteLength(SOURCE_CODE),
      mime: "text/javascript",
    },
  });
  await prisma.product.update({ where: { id: src.id }, data: { currentVersionId: v3.id } });

  console.log("seed selesai: 3 produk + file contoh dibuat");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
