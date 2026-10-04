"use client";
import { useEffect, useState } from "react";
import { rupiah } from "@/lib/format";

type Product = { id: number; name: string; price: number };
type Success = {
  licenseKey: string;
  downloadUrl: string;
  product: { name: string; version: string };
  quota: { used: number; max: number };
};

export default function Checkout({ params }: { params: { id: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [card, setCard] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Success | null>(null);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then(async (r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((d) => d && setProduct({ id: d.id, name: d.name, price: d.price }));
  }, [params.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: params.id, buyerName: name, buyerEmail: email }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Checkout gagal.");
        return;
      }
      setDone(d);
    } catch {
      setError("Tidak bisa menghubungi server.");
    } finally {
      setBusy(false);
    }
  };

  if (notFound) return <p className="text-slate-500">Produk tidak ditemukan.</p>;
  if (!product) return <p className="text-slate-500">Memuat...</p>;

  if (done)
    return (
      <div className="mx-auto max-w-xl rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <h1 className="text-2xl font-bold text-emerald-800">Pembayaran Berhasil</h1>
        <p className="mt-1 text-sm text-emerald-900">
          Terima kasih! Ini pembayaran simulasi (selalu sukses). Simpan license key
          Anda baik-baik.
        </p>
        <div className="mt-4 rounded-md bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">License Key</p>
          <p className="mt-1 font-mono text-xl font-bold tracking-wider">{done.licenseKey}</p>
        </div>
        <div className="mt-3 rounded-md bg-white p-4 text-sm">
          <p>
            <span className="font-semibold">Produk:</span> {done.product.name} (v
            {done.product.version})
          </p>
          <p>
            <span className="font-semibold">Kuota unduhan:</span> {done.quota.used}/
            {done.quota.max}
          </p>
          <p className="mt-1 text-slate-500">Link berlaku 24 jam.</p>
        </div>
        <a
          href={done.downloadUrl}
          className="mt-4 block rounded-md bg-emerald-700 px-4 py-2.5 text-center font-semibold text-white hover:bg-emerald-800"
        >
          Unduh Sekarang
        </a>
        <a href="/pembelian" className="mt-3 block text-center text-sm text-emerald-700 underline">
          Lihat di Pembelian Saya
        </a>
      </div>
    );

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Checkout</h1>
      <div className="mt-3 rounded-lg border border-slate-200 bg-white p-5">
        <p className="font-semibold">{product.name}</p>
        <p className="text-xl font-bold text-emerald-700">{rupiah(product.price)}</p>
      </div>
      <form onSubmit={submit} className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          Mode simulasi: pembayaran selalu sukses. Data kartu tidak benar-benar diproses.
        </div>
        <div>
          <label className="text-sm font-medium">Nama Lengkap</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="Nama Anda"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            placeholder="anda@email.com"
          />
          <p className="mt-1 text-xs text-slate-500">
            Email ini akan di-watermark ke setiap halaman PDF yang Anda unduh.
          </p>
        </div>
        <div>
          <label className="text-sm font-medium">Nomor Kartu (simulasi)</label>
          <input
            value={card}
            onChange={(e) => setCard(e.target.value)}
            required
            inputMode="numeric"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-mono"
            placeholder="4111 1111 1111 1111"
          />
        </div>
        {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-emerald-700 px-4 py-2.5 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {busy ? "Memproses..." : `Bayar ${rupiah(product.price)}`}
        </button>
      </form>
    </div>
  );
}
