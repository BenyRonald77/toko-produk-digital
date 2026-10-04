import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/license/validate?key=XXXX-... → info lisensi publik. */
export async function GET(req: NextRequest) {
  const key = (req.nextUrl.searchParams.get("key") || "").trim().toUpperCase();
  if (!key) return NextResponse.json({ error: "License key wajib diisi." }, { status: 400 });

  const purchase = await prisma.purchase.findUnique({
    where: { licenseKey: key },
    include: {
      product: true,
      version: true,
    },
  });
  if (!purchase)
    return NextResponse.json({ valid: false, error: "License key tidak dikenal." }, { status: 404 });

  return NextResponse.json({
    valid: true,
    licenseKey: purchase.licenseKey,
    product: {
      id: purchase.product.id,
      name: purchase.product.name,
      type: purchase.product.type,
      version: purchase.version.version,
    },
    buyer: { name: purchase.buyerName, email: purchase.buyerEmail },
    purchasedAt: purchase.purchasedAt,
    quota: { used: purchase.downloadsUsed, max: purchase.maxDownloads },
  });
}
