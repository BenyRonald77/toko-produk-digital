import { PDFDocument, StandardFonts, rgb, degrees } from "pdf-lib";

/**
 * Sisipkan watermark email pembeli di SETIAP halaman PDF.
 * Watermark nyata: teks diagonal semi-transparan + footer, disimpan ke bytes baru.
 */
export async function watermarkPdf(pdfBytes: Uint8Array, email: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(pdfBytes);
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const label = `Lisensi: ${email}`;

  for (const page of pdf.getPages()) {
    const { width, height } = page.getSize();
    // Watermark diagonal besar di tengah halaman
    page.drawText(label, {
      x: width / 2,
      y: height / 2,
      size: Math.min(28, Math.max(14, width / 28)),
      font,
      color: rgb(0.75, 0.75, 0.75),
      opacity: 0.45,
      rotate: degrees(45),
    });
    // Footer kecil di bawah setiap halaman
    page.drawText(label, {
      x: 36,
      y: 24,
      size: 9,
      font,
      color: rgb(0.35, 0.35, 0.35),
      opacity: 0.9,
    });
  }
  pdf.setTitle(`E-book berlisensi untuk ${email}`);
  return await pdf.save();
}

export const isPdf = (fileName: string, mime: string) =>
  mime === "application/pdf" || fileName.toLowerCase().endsWith(".pdf");
