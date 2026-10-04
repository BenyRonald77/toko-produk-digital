import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unlink } from "fs/promises";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  const product = await prisma.product.findUnique({
    where: { id },
    include: { versions: { orderBy: { id: "desc" } } },
  });
  if (!product)
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  const current = product.versions.find((v) => v.id === product.currentVersionId);
  return NextResponse.json({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    type: product.type,
    createdAt: product.createdAt,
    currentVersion: current
      ? { id: current.id, version: current.version, fileName: current.fileName, fileSize: current.fileSize }
      : null,
    versions: product.versions.map((v) => ({
      id: v.id,
      version: v.version,
      fileName: v.fileName,
      fileSize: v.fileSize,
      createdAt: v.createdAt,
    })),
  });
}

/** Hapus produk (admin). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = parseInt(params.id, 10);
  if (!Number.isInteger(id))
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  const product = await prisma.product.findUnique({
    where: { id },
    include: { versions: true },
  });
  if (!product)
    return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  await prisma.product.delete({ where: { id } });
  for (const v of product.versions) {
    await unlink(v.filePath).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
