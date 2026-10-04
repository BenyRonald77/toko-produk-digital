import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** GET /api/purchases?email=... → daftar pembelian + notifikasi versi baru. */
export async function GET(req: NextRequest) {
  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "Email wajib diisi." }, { status: 400 });

  const purchases = await prisma.purchase.findMany({
    where: { buyerEmail: email },
    orderBy: { purchasedAt: "desc" },
    include: {
      product: { include: { versions: { orderBy: { id: "desc" } } } },
      version: true,
      notifications: { orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json(
    purchases.map((p) => ({
      id: p.id,
      licenseKey: p.licenseKey,
      buyerName: p.buyerName,
      buyerEmail: p.buyerEmail,
      purchasedAt: p.purchasedAt,
      quota: { used: p.downloadsUsed, max: p.maxDownloads },
      product: {
        id: p.product.id,
        name: p.product.name,
        type: p.product.type,
        currentVersionId: p.product.currentVersionId,
      },
      purchasedVersion: { id: p.version.id, version: p.version.version },
      versions: p.product.versions.map((v) => ({
        id: v.id,
        version: v.version,
        fileName: v.fileName,
        fileSize: v.fileSize,
        createdAt: v.createdAt,
        isNew: v.id !== p.version.id,
      })),
      notifications: p.notifications.map((n) => ({
        id: n.id,
        message: n.message,
        read: n.read,
        createdAt: n.createdAt,
      })),
    }))
  );
}
