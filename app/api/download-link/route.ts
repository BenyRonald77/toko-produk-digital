import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadUrl } from "@/lib/download";

/**
 * GET /api/download-link?licenseKey=...&versionId=...
 * Membuat link unduhan bertanda tangan baru (berlaku 24 jam).
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const licenseKey = (q.get("licenseKey") || "").trim().toUpperCase();
  const versionId = parseInt(q.get("versionId") || "", 10);

  if (!licenseKey || !Number.isInteger(versionId))
    return NextResponse.json({ error: "Parameter tidak lengkap." }, { status: 400 });

  const purchase = await prisma.purchase.findUnique({ where: { licenseKey } });
  if (!purchase)
    return NextResponse.json({ error: "License key tidak valid." }, { status: 404 });

  const version = await prisma.productVersion.findUnique({ where: { id: versionId } });
  if (!version || version.productId !== purchase.productId)
    return NextResponse.json(
      { error: "Versi tidak tersedia untuk pembelian ini." },
      { status: 404 }
    );

  const origin = new URL(req.url).origin;
  return NextResponse.json({
    url: downloadUrl(origin, purchase.id, version.id),
    expiresInHours: 24,
    quota: { used: purchase.downloadsUsed, max: purchase.maxDownloads },
  });
}
