"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatDateTime } from "@/lib/format";

type Purchase = {
  id: number;
  licenseKey: string;
  buyerName: string;
  purchasedAt: string;
  quota: { used: number; max: number };
  product: { id: number; name: string; type: string; currentVersionId: number | null };
  purchasedVersion: { id: number; version: string };
  versions: { id: number; version: string; fileName: string; isNew: boolean }[];
  notifications: { id: number; message: string; createdAt: string }[];
};

function PembelianContent() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") || "");
  const [rows, setRows] = useState<Purchase[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [links, setLinks] = useState<Record<string, string>>({});

  const search = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError("");
    setRows(null);
    try {
      const r = await fetch(`/api/purchases?email=${encodeURIComponent(email.trim().toLowerCase())}`);
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || "Gagal memuat pembelian.");
        return;
      }
      setRows(d);
    } catch {
      setError("Tidak bisa menghubungi server.");
    } finally {
      setLoading(false);
    }
  };

  const makeLink = async (licenseKey: string, versionId: number) => {
    const k = `${licenseKey}-${versionId}`;
    setLinks((s) => ({ ...s, [k]: "membuat..." }));
    const r = await fetch(
      `/api/download-link?licenseKey=${encodeURIComponent(licenseKey)}&versionId=${versionId}`
    );
    const d = await r.json();
    setLinks((s) => ({ ...s, [k]: r.ok ? d.url : `Gagal: ${d.error}` }));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold">Pembelian Saya</h1>
      <p className="mt-1 text-sm text-slate-600">
        Masukkan email yang dipakai saat checkout untuk melihat license key dan link unduhan Anda.
      </p>
      <form onSubmit={search} className="mt-4 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="anda@email.com"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? "Mencari..." : "Cari"}
        </button>
      </form>

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {rows && rows.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          Tidak ada pembelian untuk email ini.
        </div>
      )}

      <div className="mt-6 space-y-5">
        {(rows || []).map((p) => (
          <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{p.product.name}</h2>
                <p className="text-xs text-slate-500">
                  Dibeli {formatDateTime(p.purchasedAt)} · v{p.purchasedVersion.version}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold">
                {p.licenseKey}
              </span>
            </div>

            {p.notifications.length > 0 && (
              <div className="mt-3 rounded-md bg-sky-50 p-3 text-sm text-sky-900">
                {p.notifications.map((n) => (
                  <p key={n.id}>📢 {n.message}</p>
                ))}
              </div>
            )}

            <div className="mt-3">
              <p className="text-sm font-medium">
                Unduhan ({p.quota.used}/{p.quota.max} terpakai)
              </p>
              <ul className="mt-2 space-y-2">
                {p.versions.map((v) => {
                  const k = `${p.licenseKey}-${v.id}`;
                  return (
                    <li
                      key={v.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm"
                    >
                      <span>
                        v{v.version} · {v.fileName}
                        {v.isNew && (
                          <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                            versi baru
                          </span>
                        )}
                      </span>
                      <div className="flex items-center gap-2">
                        {links[k] && !links[k].startsWith("Gagal") && !links[k].endsWith("...") ? (
                          <a
                            href={links[k]}
                            className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-800"
                          >
                            Unduh (24 jam)
                          </a>
                        ) : (
                          <button
                            onClick={() => makeLink(p.licenseKey, v.id)}
                            className="rounded-md border border-emerald-700 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                          >
                            {links[k] === "membuat..." ? "Membuat..." : "Buat Link Unduh"}
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Pembelian() {
  return (
    <Suspense fallback={<p className="text-slate-500">Memuat...</p>}>
      <PembelianContent />
    </Suspense>
  );
}
