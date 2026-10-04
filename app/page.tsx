"use client";
import { useEffect, useState } from "react";
import { rupiah, productTypeLabel } from "@/lib/format";

type Product = {
  id: number;
  name: string;
  description: string;
  price: number;
  type: string;
  version: string;
  versionCount: number;
};

const typeColors: Record<string, string> = {
  EBOOK: "bg-amber-100 text-amber-800",
  TEMPLATE: "bg-sky-100 text-sky-800",
  SOURCE_CODE: "bg-violet-100 text-violet-800",
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) setProducts(d);
        else setError("Gagal memuat katalog.");
      })
      .catch(() => setError("Gagal memuat katalog."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8 border-l-4 border-emerald-700 pl-4">
        <h1 className="text-3xl font-bold tracking-tight">Katalog Produk Digital</h1>
        <p className="mt-1 text-slate-600">
          E-book, template, dan source code berlisensi resmi. Setiap pembelian
          mendapat license key unik dan link unduhan bertanda tangan.
        </p>
      </div>

      {loading && <p className="text-slate-500">Memuat katalog...</p>}
      {error && <p className="rounded bg-red-50 p-4 text-red-700">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg font-medium">Belum ada produk</p>
          <p className="mt-1 text-sm text-slate-500">
            Katalog masih kosong. Produk baru bisa ditambahkan lewat halaman admin.
          </p>
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <a
            key={p.id}
            href={`/produk/${p.id}`}
            className="flex flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeColors[p.type] ?? "bg-slate-100 text-slate-700"}`}
              >
                {productTypeLabel[p.type] ?? p.type}
              </span>
              <span className="text-xs text-slate-500">v{p.version}</span>
            </div>
            <h2 className="text-lg font-semibold leading-snug">{p.name}</h2>
            <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-600">{p.description}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xl font-bold text-emerald-700">{rupiah(p.price)}</span>
              <span className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white">
                Lihat
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
