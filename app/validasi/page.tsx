"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { formatDateTime } from "@/lib/format";

type Result = {
  valid: boolean;
  licenseKey?: string;
  product?: { name: string; type: string; version: string };
  buyer?: { name: string; email: string };
  purchasedAt?: string;
  quota?: { used: number; max: number };
  error?: string;
};

function ValidasiContent() {
  const params = useSearchParams();
  const [key, setKey] = useState(params.get("key") || "");
  const [res, setRes] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch(`/api/license/validate?key=${encodeURIComponent(key.trim())}`);
      setRes(await r.json());
    } catch {
      setRes({ valid: false, error: "Tidak bisa menghubungi server." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold">Validasi License Key</h1>
      <p className="mt-1 text-sm text-slate-600">
        Periksa keaslian license key produk digital yang Anda beli.
      </p>
      <form onSubmit={check} className="mt-4 flex gap-2">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          required
          placeholder="XXXX-XXXX-XXXX-XXXX"
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 font-mono uppercase"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? "Memeriksa..." : "Validasi"}
        </button>
      </form>

      {res && (
        <div
          className={`mt-4 rounded-lg border p-5 ${
            res.valid ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
          }`}
        >
          {res.valid ? (
            <>
              <p className="text-lg font-bold text-emerald-800">✓ License key VALID</p>
              <dl className="mt-3 space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Produk</dt><dd className="font-medium">{res.product?.name}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Versi saat dibeli</dt><dd className="font-medium">v{res.product?.version}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Pemegang lisensi</dt><dd className="font-medium">{res.buyer?.name}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Tanggal beli</dt><dd className="font-medium">{res.purchasedAt ? formatDateTime(res.purchasedAt) : "-"}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">Kuota unduhan</dt><dd className="font-medium">{res.quota?.used}/{res.quota?.max} terpakai</dd></div>
              </dl>
            </>
          ) : (
            <p className="font-medium text-red-700">✗ {res.error || "License key tidak valid."}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function Validasi() {
  return (
    <Suspense fallback={<p className="text-slate-500">Memuat...</p>}>
      <ValidasiContent />
    </Suspense>
  );
}
