import type { Metadata } from "next";
import Link from "next/link";

import AuthPublicGate from "../../components/layouts/auth/AuthPublicGate";
import AuthSwitch from "../../components/layouts/auth/AuthSwitch";

export const metadata: Metadata = {
  title: "Autentikasi — Sahabat Laundry",
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthPublicGate>
      <div className="grid min-h-dvh grid-cols-1 bg-slate-50 text-slate-900 lg:grid-cols-2 dark:bg-slate-950 dark:text-slate-100">
        <aside className="relative hidden items-stretch overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-600 via-indigo-700 to-indigo-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900" />
          <div
            className="pointer-events-none absolute inset-0 opacity-25 dark:opacity-15"
            style={{
              backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
              backgroundSize: "14px 14px",
              color: "rgba(255,255,255,0.7)",
            }}
          />
          <div className="relative z-10 m-auto w-full max-w-lg p-10 text-white">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/90 hover:text-white"
            >
              <span className="text-xl font-semibold tracking-tight">SahabatLaundry</span>
            </Link>

            <h1 className="mt-10 text-3xl leading-tight font-bold">
              Kelola laundry lebih cepat & rapi
            </h1>
            <p className="mt-3 text-white/90">
              Order, status, pembayaran, invoice, dan laporan—terintegrasi.
            </p>

            <ul className="mt-6 space-y-2 text-sm text-white/90">
              <li>• Tracking status realtime</li>
              <li>• Pembayaran & invoice otomatis</li>
              <li>• Notifikasi pelanggan</li>
            </ul>

            <div className="mt-10 text-xs text-white/75">
              © {new Date().getFullYear()} SahabatLaundry
            </div>
          </div>
        </aside>

        <main className="flex items-center justify-center p-6">
          <div className="w-full max-w-md sm:max-w-lg">
            <div className="mb-6 flex items-center justify-between">
              <Link
                href="/"
                className="text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                ← Kembali ke beranda
              </Link>
            </div>

            <section className="border-border border-border-slate-200/60 border-border-slate-800 rounded-2xl border bg-white/80 p-5 shadow-sm ring-1 ring-slate-100/60 backdrop-blur supports-[backdrop-filter]:bg-white/70 dark:border dark:bg-slate-900/70 dark:ring-0">
              {children}
            </section>
            <AuthSwitch />
            <div className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
              Dengan melanjutkan, Anda menyetujui Ketentuan & Kebijakan Privasi.
            </div>
          </div>
        </main>
      </div>
    </AuthPublicGate>
  );
}
