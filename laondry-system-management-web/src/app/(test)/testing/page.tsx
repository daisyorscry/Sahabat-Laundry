"use client";

import { useEffect, useState } from "react";

const PRESETS = [
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "red",
  "orange",
  "amber",
  "emerald",
] as const;

type Preset = (typeof PRESETS)[number];

export default function ThemePlayground() {
  const [preset, setPreset] = useState<Preset>("blue");
  const [theme, setTheme] = useState<"system" | "light" | "dark">("system");
  const [activeTab, setActiveTab] = useState<"overview" | "details">("overview");

  useEffect(() => {
    document.documentElement.dataset.primary = preset;
  }, [preset]);

  useEffect(() => {
    if (theme === "system") {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  return (
    <div className="min-h-dvh px-4 py-6 md:px-8 lg:px-12">
      {/* DEMO VARS (global) */}
      <style jsx global>{`
        :root {
          --demo-border: #dc2626; /* red-600 */
          --demo-bg: #fee2e2; /* red-100 */
          --demo-card: color-mix(in oklch, #dc2626 10%, white 90%);
        }
        @media (prefers-color-scheme: dark) {
          :root {
            --demo-border: #7c3aed; /* violet-600 */
            --demo-bg: #ede9fe; /* violet-100 */
            --demo-card: color-mix(in oklch, #7c3aed 20%, black 80%);
          }
        }
        /* Jika kamu pakai override manual theme via data-theme */
        :root[data-theme="light"] {
          --demo-border: #dc2626;
          --demo-bg: #fee2e2;
          --demo-card: color-mix(in oklch, #dc2626 10%, white 90%);
        }
        :root[data-theme="dark"] {
          --demo-border: #7c3aed;
          --demo-bg: #ede9fe;
          --demo-card: color-mix(in oklch, #7c3aed 20%, black 80%);
        }
      `}</style>

      <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h1 className="text-2xl font-semibold">Theme Playground</h1>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">Primary:</label>
          <select
            value={preset}
            onChange={(e) => setPreset(e.target.value as Preset)}
            className="border-border rounded border bg-transparent px-3 py-2 text-sm"
          >
            {PRESETS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <label className="text-sm">Theme:</label>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as typeof theme)}
            className="border-border rounded border bg-transparent px-3 py-2 text-sm"
          >
            <option value="system">system</option>
            <option value="light">light</option>
            <option value="dark">dark</option>
          </select>
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={[
              "rounded-md px-3 py-2 text-sm",
              activeTab === "overview"
                ? "bg-primary text-white"
                : "border-border text-primary border",
            ].join(" ")}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={[
              "rounded-md px-3 py-2 text-sm",
              activeTab === "details"
                ? "bg-primary text-white"
                : "border-border text-primary border",
            ].join(" ")}
          >
            Details
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Card dengan nuansa primary */}
        <section className="bg-card-primary rounded-xl p-6">
          <h2 className="mb-2 text-lg font-medium">Card Primary</h2>
          <p className="mb-4 text-sm opacity-80">
            Latar card tercampur dengan warna primary + background. Adaptif terhadap light/dark dan
            preset primary.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button className="bg-primary rounded-md px-4 py-2 text-white">Primary Button</button>
            <button className="border-border text-primary rounded-md border px-4 py-2">
              Outline Primary
            </button>
            <span className="border-border text-primary rounded-full border px-2.5 py-1 text-xs font-medium">
              Primary Badge
            </span>
          </div>
        </section>

        {/* Form + ring warna primary */}
        <section className="border-border rounded-xl border p-6">
          <h2 className="mb-2 text-lg font-medium">Form dengan Ring Primary</h2>
          <p className="mb-4 text-sm opacity-80">
            Focus ring, border, dan tombol mengikuti palet primary.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
            }}
            className="space-y-4"
          >
            <div className="space-y-1.5">
              <label className="text-sm">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className="border-border w-full rounded-md border bg-transparent px-3 py-2 ring-0 outline-none focus-visible:ring-2"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="border-border w-full rounded-md border bg-transparent px-3 py-2 ring-0 outline-none focus-visible:ring-2"
              />
            </div>

            <div className="flex items-center gap-3">
              <button className="bg-primary rounded-md px-4 py-2 text-white">Submit</button>
              <button
                type="button"
                className="border-border text-primary rounded-md border px-4 py-2"
              >
                Secondary
              </button>
            </div>
          </form>
        </section>

        {/* ===== Light↔Dark DEMO: merah (light) ↔ violet (dark) ===== */}
        <section className="space-y-4 md:col-span-2">
          {/* Border Demo */}
          <div className="rounded-lg border-4 border-[var(--demo-border)] p-4">
            <div className="mb-1 text-sm font-medium">Border Demo (light: red, dark: violet)</div>
            <p className="opacity-80">
              Kelas: <code>border-[var(--demo-border)]</code>
            </p>
          </div>

          {/* Background solid Demo */}
          <div className="rounded-lg bg-[var(--demo-bg)] p-4">
            <div className="mb-1 text-sm font-medium">
              Background Demo (light: red-100, dark: violet-100)
            </div>
            <p className="opacity-80">
              Kelas: <code>bg-[var(--demo-bg)]</code>
            </p>
          </div>

          {/* Card Demo (blend) */}
          <div className="rounded-xl bg-[var(--demo-card)] p-6 shadow">
            <div className="mb-2 text-lg font-medium">Card Demo (blend)</div>
            <p className="opacity-80">
              Kelas: <code>bg-[var(--demo-card)]</code>. Campuran warna demo dengan background.
              Merah lembut di light, violet lembut di dark.
            </p>
          </div>
        </section>

        {/* Alert/Callout */}
        <section className="border-border rounded-xl border p-6 md:col-span-2">
          <div className="text-primary mb-2 text-sm font-medium">Informasi</div>
          <p className="opacity-80">
            Komponen ini menggunakan:{" "}
            <code className="bg-card-primary rounded px-1 py-0.5">bg-card-primary</code>,{" "}
            <code className="bg-card-primary rounded px-1 py-0.5">border-border</code>,{" "}
            <code className="bg-card-primary rounded px-1 py-0.5">bg-primary</code>,{" "}
            <code className="bg-card-primary rounded px-1 py-0.5">text-primary</code>, serta
            arbitrary values{" "}
            <code className="bg-card-primary rounded px-1 py-0.5">border-[var(--demo-border)]</code>
            , <code className="bg-card-primary rounded px-1 py-0.5">bg-[var(--demo-bg)]</code>,{" "}
            <code className="bg-card-primary rounded px-1 py-0.5">bg-[var(--demo-card)]</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
