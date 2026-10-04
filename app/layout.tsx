import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Toko Produk Digital",
  description: "Beli e-book, template, dan source code dengan lisensi resmi.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <a href="/" className="text-lg font-bold tracking-tight">
              <span className="text-emerald-700">Toko</span>Digital
            </a>
            <nav className="flex gap-4 text-sm font-medium">
              <a href="/" className="hover:text-emerald-700">Katalog</a>
              <a href="/pembelian" className="hover:text-emerald-700">Pembelian Saya</a>
              <a href="/validasi" className="hover:text-emerald-700">Validasi Lisensi</a>
              <a href="/admin" className="hover:text-emerald-700">Admin</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          Toko Produk Digital: e-book, template, dan source code berlisensi.
        </footer>
      </body>
    </html>
  );
}
