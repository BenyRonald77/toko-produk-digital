import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { STORAGE_DIR } from "@/lib/download";

const ALLOWED_TYPES = ["EBOOK", "TEMPLATE", "SOURCE_CODE"];

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { id: "asc" },
  });
  const rows = await Promise.all(
    products.map(async (p) => {
      const current = p.currentVersionId
        ? await prisma.productVersion.findUnique({ where: { id: p.currentVersionId } })
        : null;
      const versionCount = await prisma.productVersion.count({
        where: { productId: p.id },
      });
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        type: p.type,
        version: current?.version ?? "-",
        versionCount,
        createdAt: p.createdAt,
      };
    })
  );
  return NextResponse.json(rows);
}

/** Tambah produk baru (admin) + upload file versi 1.0. */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Form tidak valid" }, { status: 400 });

  const name = String(form.get("name") || "").trim();
  const description = String(form.get("description") || "").trim();
  const price = parseInt(String(form.get("price") || ""), 10);
  const type = String(form.get("type") || "EBOOK");
  const file = form.get("file") as File | null;

  if (!name) return NextResponse.json({ error: "Nama produk wajib diisi" }, { status: 400 });
  if (!Number.isInteger(price) || price < 0)
    return NextResponse.json({ error: "Harga tidak valid" }, { status: 400 });
  if (!ALLOWED_TYPES.includes(type))
    return NextResponse.json({ error: "Tipe produk tidak valid" }, { status: 400 });
  if (!file || file.size === 0)
    return NextResponse.json({ error: "File produk wajib diunggah" }, { status: 400 });

  const versionLabel = String(form.get("version") || "1.0").trim() || "1.0";
  await mkdir(STORAGE_DIR, { recursive: true });
  const safeName = `${randomUUID()}-${file.name.replace(/[^\w.\-() ]/g, "_")}`;
  const filePath = path.join(STORAGE_DIR, safeName);
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  const product = await prisma.product.create({
    data: { name, description, price, type },
  });
  const version = await prisma.productVersion.create({
    data: {
      productId: product.id,
      version: versionLabel,
      fileName: file.name,
      filePath,
      fileSize: file.size,
      mime: file.type || "application/octet-stream",
    },
  });
  await prisma.product.update({
    where: { id: product.id },
    data: { currentVersionId: version.id },
  });
  return NextResponse.json(
    { id: product.id, name, versionId: version.id, version: version.version },
    { status: 201 }
  );
}
