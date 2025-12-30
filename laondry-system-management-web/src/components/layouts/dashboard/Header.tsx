"use client";

import { useState } from "react";

type Props = {
  onToggleSidebar: () => void;
  title?: string;
};

export default function Header({ onToggleSidebar, title = "Dashboard" }: Props) {
  const [q, setQ] = useState("");

  return (
    <header
      className={[
        // layout
        "sticky top-0 z-30 flex h-16 items-center gap-3 px-4",
        // border bawah header
        "border-border border-b",
        // latar semi-transparan + blur agar konten di bawah sedikit terlihat
        "bg-background/80 backdrop-blur",
        // teks
        "text-foreground",
      ].join(" ")}
    >
      {/* Toggle sidebar (mobile) */}
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
        className={[
          "inline-flex h-9 w-9 items-center justify-center rounded-md lg:hidden",
          "border-border bg-card-primary border",
          // ring ikut border-primary (biru di light, merah di dark)
          "ring-[var(--border-primary)] focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none",
          "transition-colors",
        ].join(" ")}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5">
          <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
        </svg>
      </button>

      <h1 className="mr-auto text-lg font-semibold">{title}</h1>

      {/* Actions kanan */}
      <div className="hidden items-center gap-2 md:flex">
        {/* Search */}
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari order, pelanggan…"
            className={[
              "h-9 w-64 rounded-md px-3 text-sm",
              "border-border bg-card-primary text-foreground border",
              "ring-[var(--border-primary)] focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none",
              "transition-colors",
            ].join(" ")}
          />
          <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 opacity-60">
            <svg viewBox="0 0 24 24" className="h-4 w-4">
              <path
                fill="currentColor"
                d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79L20 21.5 21.5 20l-6-6zM4 9.5C4 6.46 6.46 4 9.5 4S15 6.46 15 9.5 12.54 15 9.5 15 4 12.54 4 9.5z"
              />
            </svg>
          </span>
        </div>

        {/* Notifications */}
        <button
          aria-label="Notifications"
          className={[
            "h-9 w-9 rounded-md",
            "border-border bg-card-primary border",
            "ring-[var(--border-primary)] focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none",
            "transition-colors",
          ].join(" ")}
        >
          <svg viewBox="0 0 24 24" className="mx-auto h-5 w-5">
            <path
              fill="currentColor"
              d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 1 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z"
            />
          </svg>
        </button>

        {/* Profile */}
        <button
          className={[
            "h-9 rounded-md px-3 text-sm",
            "border-border bg-card-primary border",
            "ring-[var(--border-primary)] focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none",
            "transition-colors",
          ].join(" ")}
        >
          Admin
        </button>
      </div>
    </header>
  );
}
