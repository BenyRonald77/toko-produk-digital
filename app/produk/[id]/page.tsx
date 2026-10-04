"use client";
import { useEffect, useState } from "react";
import { rupiah, productTypeLabel } from "@/lib/format";

type Detail = {
  id: number;
  name: string;
  description: string;
  price: number;
  type: string;
  currentVersion: { id: number; version: string; fileName: string; fileSize: number } | null;
  versions: { id: number; version: string; fileName: string; fileSize: number; createdAt: string }[];
};

export default function ProductDetail({ params }: { params: { id: string } }) {
  const [p, setP] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((d) => d && setP(d))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <p className="text-slate-500">Memuat produk...</p>;
  if (notFound || !p)
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-lg font-medium">Produk tidak ditemukan</p>
        <a href="/" className="mt-2 inline-block text-sm text-emerald-700 underline">
          Kembali ke katalog
        </a>
      </div>
    );

  return (
    <div className="grid gap-8 md:grid-cols-3">
      <div className="md:col-span-2">
        <a href="/" className="text-sm text-slate-500 hover:text-emerald-700">
          ← Kembali ke katalog
        </a>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{p.name}</h1>
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-semibold text-slate-700">
            {productTypeLabel[p.type] ?? p.type}
          </span>
          <span className="text-slate-500">Versi {p.currentVersion?.version ?? "-"}</span>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-slate-700">{p.description}</p>

        <h2 className="mt-8 text-lg font-semibold">Riwayat Versi</h2>
        {p.versions.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada versi.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {p.versions.map((v) => (
              <li
                key={v.id}
                className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <span className="font-medium">v{v.version}</span>
                <span className="text-slate-500">
                  {v.fileName} · {(v.fileSize / 1024).toFixed(1)} KB
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="h-fit rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Harga</p>
        <p className="text-3xl font-bold text-emerald-700">{rupiah(p.price)}</p>
        <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
          <li>✓ License key unik per pembelian</li>
          <li>✓ Link unduhan bertanda tangan (24 jam)</li>
          <li>✓ Kuota unduhan 5x</li>
          <li>✓ Akses gratis semua versi baru</li>
          <li>✓ PDF di-watermark email pembeli</li>
        </ul>
        <a
          href={`/checkout/${p.id}`}
          className="mt-5 block rounded-md bg-emerald-700 px-4 py-2.5 text-center font-semibold text-white hover:bg-emerald-800"
        >
          Beli Sekarang
        </a>
      </div>
    </div>
  );
}
