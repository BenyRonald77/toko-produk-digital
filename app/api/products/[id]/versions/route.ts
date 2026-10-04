import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { STORAGE_DIR } from "@/lib/download";

/**
 * POST /api/products/[id]/versions — upload versi baru (admin).
 * Versi baru jadi versi terkini; semua pembeli produk otomatis mendapat
 * akses + notifikasi tercatat.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const productId = parseInt(params.id, 10);
  if (!Number.isInteger(productId))
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product)
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Form tidak valid" }, { status: 400 });

  const versionLabel = String(form.get("version") || "").trim();
  const file = form.get("file") as File | null;
  if (!versionLabel)
    return NextResponse.json({ error: "Label versi wajib diisi" }, { status: 400 });
  if (!file || file.size === 0)
    return NextResponse.json({ error: "File versi baru wajib diunggah" }, { status: 400 });

  const existing = await prisma.productVersion.findFirst({
    where: { productId, version: versionLabel },
  });
  if (existing)
    return NextResponse.json({ error: "Versi ini sudah ada" }, { status: 409 });

  await mkdir(STORAGE_DIR, { recursive: true });
  const safeName = `${randomUUID()}-${file.name.replace(/[^\w.\-() ]/g, "_")}`;
  const filePath = path.join(STORAGE_DIR, safeName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  const version = await prisma.productVersion.create({
    data: {
      productId,
      version: versionLabel,
      fileName: file.name,
      filePath,
      fileSize: file.size,
      mime: file.type || "application/octet-stream",
    },
  });
  await prisma.product.update({
    where: { id: productId },
    data: { currentVersionId: version.id },
  });

  // Notifikasi untuk semua pembeli produk ini
  const purchases = await prisma.purchase.findMany({
    where: { productId },
    select: { id: true },
  });
  if (purchases.length > 0) {
    await prisma.notification.createMany({
      data: purchases.map((p) => ({
        purchaseId: p.id,
        message: `Versi baru tersedia: ${product.name} v${versionLabel}. Anda bisa mengunduhnya dengan license key yang sama.`,
      })),
    });
  }

  return NextResponse.json(
    {
      id: version.id,
      version: version.version,
      notifiedPurchases: purchases.length,
    },
    { status: 201 }
  );
}
