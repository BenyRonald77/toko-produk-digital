import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyDownloadToken } from "@/lib/download";
import { watermarkPdf, isPdf } from "@/lib/watermark";
import { readFile } from "fs/promises";

export const dynamic = "force-dynamic";

/**
 * GET /api/download?p=<purchaseId>&v=<versionId>&exp=<epoch>&sig=<hmac>
 * Validasi: signature HMAC, masa kedaluwarsa 24 jam, kuota unduhan.
 * Kuota dikurangi secara atomik (conditional updateMany). PDF di-watermark.
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const verified = verifyDownloadToken(
    q.get("p") || "",
    q.get("v") || "",
    q.get("exp") || "",
    q.get("sig") || ""
  );
  if (!verified)
    return NextResponse.json(
      { error: "Link unduhan tidak valid atau sudah kedaluwarsa." },
      { status: 403 }
    );

  const purchase = await prisma.purchase.findUnique({
    where: { id: verified.purchaseId },
    include: { product: true },
  });
  if (!purchase)
    return NextResponse.json({ error: "Pembelian tidak ditemukan." }, { status: 404 });

  const version = await prisma.productVersion.findUnique({
    where: { id: verified.versionId },
  });
  if (!version || version.productId !== purchase.productId)
    return NextResponse.json({ error: "Versi file tidak ditemukan." }, { status: 404 });

  // Kurangi kuota secara atomik: hanya berhasil bila kuota masih tersisa.
  const updated = await prisma.purchase.updateMany({
    where: {
      id: purchase.id,
      downloadsUsed: { lt: purchase.maxDownloads },
    },
    data: { downloadsUsed: { increment: 1 } },
  });
  if (updated.count === 0)
    return NextResponse.json(
      { error: "Kuota unduhan habis. Hubungi admin untuk perpanjangan." },
      { status: 410 }
    );

  const raw = await readFile(version.filePath).catch(() => null);
  if (!raw)
    return NextResponse.json({ error: "File produk tidak ditemukan di server." }, { status: 404 });

  let bytes: Uint8Array = new Uint8Array(raw);
  let contentType = version.mime;
  if (isPdf(version.fileName, version.mime)) {
    bytes = await watermarkPdf(bytes, purchase.buyerEmail);
    contentType = "application/pdf";
  }

  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(version.fileName)}"`,
      "Content-Length": String(bytes.length),
    },
  });
}
