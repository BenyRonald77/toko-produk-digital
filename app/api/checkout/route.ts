import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateLicenseKey, downloadMaxUses, downloadUrl } from "@/lib/download";

/**
 * Checkout simulasi: pembayaran dianggap selalu sukses.
 * Membuat Purchase + license key unik + link unduhan bertanda tangan.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const productId = body ? parseInt(body.productId, 10) : NaN;
  const buyerName = body ? String(body.buyerName || "").trim() : "";
  const buyerEmail = body ? String(body.buyerEmail || "").trim() : "";

  if (!Number.isInteger(productId))
    return NextResponse.json({ error: "productId tidak valid" }, { status: 400 });
  if (!buyerName)
    return NextResponse.json({ error: "Nama pembeli wajib diisi" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail))
    return NextResponse.json({ error: "Email tidak valid" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product)
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  if (!product.currentVersionId)
    return NextResponse.json({ error: "Produk belum memiliki versi file" }, { status: 409 });
  const version = await prisma.productVersion.findUnique({
    where: { id: product.currentVersionId },
  });
  if (!version)
    return NextResponse.json({ error: "Versi produk tidak ditemukan" }, { status: 404 });

  // License key harus unik; coba ulang bila tabrakan (sangat jarang).
  let licenseKey = "";
  for (let i = 0; i < 5; i++) {
    licenseKey = generateLicenseKey();
    const exists = await prisma.purchase.findUnique({ where: { licenseKey } });
    if (!exists) break;
    licenseKey = "";
  }
  if (!licenseKey)
    return NextResponse.json({ error: "Gagal membuat license key" }, { status: 500 });

  const purchase = await prisma.purchase.create({
    data: {
      productId: product.id,
      versionId: version.id,
      buyerName,
      buyerEmail,
      licenseKey,
      maxDownloads: downloadMaxUses(),
      downloadsUsed: 0,
    },
  });

  const origin = new URL(req.url).origin;
  return NextResponse.json(
    {
      purchaseId: purchase.id,
      licenseKey: purchase.licenseKey,
      product: { id: product.id, name: product.name, version: version.version },
      buyer: { name: buyerName, email: buyerEmail },
      downloadUrl: downloadUrl(origin, purchase.id, version.id),
      quota: { used: 0, max: purchase.maxDownloads },
      note: "Pembayaran simulasi: selalu sukses.",
    },
    { status: 201 }
  );
}
