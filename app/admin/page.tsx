"use client";
import { useEffect, useState } from "react";
import { rupiah, productTypeLabel, formatDateTime } from "@/lib/format";

type Product = {
  id: number;
  name: string;
  price: number;
  type: string;
  version: string;
  versionCount: number;
};

type Sale = {
  id: number;
  productName: string;
  productPrice: number;
  version: string;
  buyerName: string;
  buyerEmail: string;
  licenseKey: string;
  downloads: string;
  purchasedAt: string;
};

export default function Admin() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // form produk baru
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [type, setType] = useState("EBOOK");
  const [file, setFile] = useState<File | null>(null);

  // form versi baru
  const [verProduct, setVerProduct] = useState("");
  const [verLabel, setVerLabel] = useState("");
  const [verFile, setVerFile] = useState<File | null>(null);

  const reload = async () => {
    const [pr, sa] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/sales").then((r) => r.json()),
    ]);
    if (Array.isArray(pr)) setProducts(pr);
    if (sa.sales) {
      setSales(sa.sales);
      setTotalRevenue(sa.totalRevenue);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const flash = (m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(""), 5000);
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      flash("Pilih file produk dulu.");
      return;
    }
    setBusy(true);
    const form = new FormData();
    form.set("name", name);
    form.set("description", desc);
    form.set("price", price);
    form.set("type", type);
    form.set("file", file);
    const r = await fetch("/api/products", { method: "POST", body: form });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) {
      flash(`Gagal: ${d.error}`);
      return;
    }
    setName("");
    setDesc("");
    setPrice("");
    setFile(null);
    flash(`Produk "${d.name}" ditambahkan (v${d.version}).`);
    reload();
  };

  const addVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verFile || !verProduct) {
      flash("Pilih produk dan file versi baru.");
      return;
    }
    setBusy(true);
    const form = new FormData();
    form.set("version", verLabel);
    form.set("file", verFile);
    const r = await fetch(`/api/products/${verProduct}/versions`, { method: "POST", body: form });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) {
      flash(`Gagal: ${d.error}`);
      return;
    }
    setVerLabel("");
    setVerFile(null);
    flash(`Versi ${d.version} dirilis; ${d.notifiedPurchases} pembeli diberi notifikasi.`);
    reload();
  };

  const delProduct = async (id: number, nm: string) => {
    if (!confirm(`Hapus produk "${nm}" beserta semua versinya?`)) return;
    const r = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const d = await r.json();
      flash(`Gagal: ${d.error}`);
      return;
    }
    flash("Produk dihapus.");
    reload();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin</h1>
      {msg && <p className="mt-3 rounded bg-sky-50 p-3 text-sm text-sky-900">{msg}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <form onSubmit={addProduct} className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Tambah Produk Baru</h2>
          <div className="mt-3 space-y-3 text-sm">
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nama produk" className="w-full rounded-md border border-slate-300 px-3 py-2" />
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Deskripsi" rows={3} className="w-full rounded-md border border-slate-300 px-3 py-2" />
            <div className="flex gap-2">
              <input value={price} onChange={(e) => setPrice(e.target.value)} required inputMode="numeric" placeholder="Harga (Rp)" className="w-full rounded-md border border-slate-300 px-3 py-2" />
              <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-md border border-slate-300 px-3 py-2">
                <option value="EBOOK">E-book</option>
                <option value="TEMPLATE">Template</option>
                <option value="SOURCE_CODE">Source Code</option>
              </select>
            </div>
            <input type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm" />
            <button disabled={busy} className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
              Tambah Produk
            </button>
          </div>
        </form>

        <form onSubmit={addVersion} className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Rilis Versi Baru</h2>
          <p className="mt-1 text-xs text-slate-500">
            Pembeli lama otomatis mendapat akses + notifikasi dengan license key yang sama.
          </p>
          <div className="mt-3 space-y-3 text-sm">
            <select value={verProduct} onChange={(e) => setVerProduct(e.target.value)} required className="w-full rounded-md border border-slate-300 px-3 py-2">
              <option value="">Pilih produk</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (v{p.version})</option>
              ))}
            </select>
            <input value={verLabel} onChange={(e) => setVerLabel(e.target.value)} required placeholder="Label versi, mis. 2.0" className="w-full rounded-md border border-slate-300 px-3 py-2" />
            <input type="file" required onChange={(e) => setVerFile(e.target.files?.[0] || null)} className="w-full text-sm" />
            <button disabled={busy} className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50">
              Rilis Versi Baru
            </button>
          </div>
        </form>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Daftar Produk</h2>
      {products.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Belum ada produk.</p>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Tipe</th>
                <th className="px-3 py-2">Harga</th>
                <th className="px-3 py-2">Versi</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{p.name}</td>
                  <td className="px-3 py-2">{productTypeLabel[p.type] ?? p.type}</td>
                  <td className="px-3 py-2">{rupiah(p.price)}</td>
                  <td className="px-3 py-2">v{p.version} ({p.versionCount}x)</td>
                  <td className="px-3 py-2 text-right">
                    <button onClick={() => delProduct(p.id, p.name)} className="text-red-600 hover:underline">
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mt-8 text-lg font-semibold">
        Penjualan <span className="text-sm font-normal text-slate-500">(total {rupiah(totalRevenue)})</span>
      </h2>
      {sales.length === 0 ? (
        <p className="mt-2 text-sm text-slate-500">Belum ada penjualan.</p>
      ) : (
        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-3 py-2">Produk</th>
                <th className="px-3 py-2">Pembeli</th>
                <th className="px-3 py-2">License Key</th>
                <th className="px-3 py-2">Unduhan</th>
                <th className="px-3 py-2">Waktu</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium">{s.productName} (v{s.version}) · {rupiah(s.productPrice)}</td>
                  <td className="px-3 py-2">{s.buyerName}<br /><span className="text-xs text-slate-500">{s.buyerEmail}</span></td>
                  <td className="px-3 py-2 font-mono text-xs">{s.licenseKey}</td>
                  <td className="px-3 py-2">{s.downloads}</td>
                  <td className="px-3 py-2 text-xs text-slate-500">{formatDateTime(s.purchasedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
