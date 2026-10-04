import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/sales — daftar penjualan (admin). */
export async function GET() {
  const purchases = await prisma.purchase.findMany({
    orderBy: { purchasedAt: "desc" },
    include: { product: true, version: true },
  });
  const total = purchases.reduce((s, p) => s + p.product.price, 0);
  return NextResponse.json({
    totalRevenue: total,
    count: purchases.length,
    sales: purchases.map((p) => ({
      id: p.id,
      productName: p.product.name,
      productPrice: p.product.price,
      version: p.version.version,
      buyerName: p.buyerName,
      buyerEmail: p.buyerEmail,
      licenseKey: p.licenseKey,
      downloads: `${p.downloadsUsed}/${p.maxDownloads}`,
      purchasedAt: p.purchasedAt,
    })),
  });
}
