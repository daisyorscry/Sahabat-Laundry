"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

import { useTheme } from "@/app/theme-provider";

type Mode = "light" | "dark" | "system";
const LABEL: Record<Mode, string> = { light: "Light", dark: "Dark", system: "System" };

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

export default function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // primary color state
  const [preset, setPreset] = useState<Preset>("blue");

  // hydrate initial primary (attr > localStorage > default)
  useEffect(() => {
    const root = document.documentElement;
    const fromAttr = (root.getAttribute("data-primary") as Preset) || null;
    const fromLS =
      (typeof window !== "undefined" ? (localStorage.getItem("primary") as Preset) : null) || null;

    const initial = (fromAttr || fromLS || "blue") as Preset;
    setPreset(initial);
    root.setAttribute("data-primary", initial);
  }, []);

  // close on outside / ESC
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const chooseMode = (m: Mode) => {
    setMode(m);
    setOpen(false);
  };

  const choosePreset = (p: Preset) => {
    setPreset(p);
    document.documentElement.setAttribute("data-primary", p);
    try {
      localStorage.setItem("primary", p);
    } catch {}
  };

  // label tombol gabungan
  const buttonLabel = useMemo(() => `${LABEL[mode]} · ${preset}`, [mode, preset]);

  return (
    <div className="relative" ref={ref}>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="border-border hover:bg-surface rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
      >
        {buttonLabel}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="border-border bg-background absolute right-0 z-50 mt-2 min-w-56 overflow-hidden rounded-xl border shadow-2xl"
          >
            {/* Section: Mode */}
            <div className="px-3 pt-3 pb-2 text-xs font-medium text-foreground/80">
              Mode
            </div>
            {(["light", "dark", "system"] as Mode[]).map((m) => (
              <motion.button
                key={m}
                onClick={() => chooseMode(m)}
                className={`hover:bg-surface flex w-full items-center justify-between px-3 py-2 text-sm rounded-md ${
                  mode === m ? "bg-surface font-medium text-foreground" : "text-foreground/80"
                }`}
                whileHover={{ x: 2 }}
                role="menuitem"
              >
                <span>{LABEL[m]}</span>
                {mode === m && <span aria-hidden className="bg-brand-500 h-2 w-2 rounded-full" />}
              </motion.button>
            ))}

            {/* Divider */}
            <div className="bg-border my-2 h-px" />

            {/* Section: Primary */}
            <div className="px-3 pt-2 pb-2 text-xs font-medium text-foreground/80">
              Primary
            </div>

            <div className="grid grid-cols-5 gap-2 px-3 pb-3">
              {(PRESETS as readonly Preset[]).map((p) => (
                <button
                  key={p}
                  onClick={() => choosePreset(p)}
                  className={`group border-border hover:bg-surface relative flex items-center justify-center rounded-lg border px-2 py-2 text-xs capitalize ${
                    preset === p ? "ring-2 ring-[var(--brand-400,_currentColor)] ring-offset-0" : ""
                  }`}
                  style={
                    {
                      // preview chip pakai --primary-500 dari data-primary yang aktif pada root
                      // di sini kita kasih inline color preview via CSS var fallback:
                      color: "var(--primary-500)",
                    } as React.CSSProperties
                  }
                  title={p}
                >
                  <span
                    className="pointer-events-none absolute -top-1 right-1 h-1.5 w-1.5 rounded-full"
                    style={{ background: "var(--primary-500)" }}
                  />
                  <span className="truncate">{p}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
