// app/(dashboard)/dashboard/outlets/_parts/OutletDetailsModal.tsx
"use client";

import * as React from "react";

import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import type { Outlet } from "@/features/outlets/useOutlets";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data?: Outlet | null; // ← boleh undefined/null
};

export default function OutletDetailsModal({ isOpen, onClose, data }: Props) {
  if (!data) return null;

  const {
    id,
    code,
    name,
    phone,
    email,
    address_line,
    city,
    province,
    postal_code,
    is_active,
    created_at,
    updated_at,
    deleted_at,
    created_by,
    updated_by,
  } = data;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Detail Outlet" size="xl">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-foreground truncate text-base font-semibold">{name}</h3>
          <p className="text-foreground/70 text-sm break-all">{email ?? "—"}</p>
        </div>
        <Badge tone={is_active ? "success" : "secondary"} size="xs">
          {is_active ? "Aktif" : "Nonaktif"}
        </Badge>
      </header>

      {/* Info utama */}
      <section className="border-border bg-card-primary/60 rounded-xl border p-4">
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
          <Field label="ID" value={id} mono copyable />
          <Field label="Kode" value={code} mono copyable />
          <Field label="Nama" value={name} />
          <Field label="Telepon" value={phone} />
          <Field label="Email" value={email} />
          <Field label="Kota" value={city} />
          <Field label="Provinsi" value={province} />
          <Field label="Kode Pos" value={postal_code} />
          <Field label="Alamat" value={address_line} className="md:col-span-2" />
        </div>
      </section>

      {/* Meta */}
      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <MetaCard title="Dibuat" by={created_by ?? null} at={created_at ?? null} />
        <MetaCard title="Diubah" by={updated_by ?? null} at={updated_at ?? null} />
        <MetaCard
          title="Dihapus"
          by={null}
          at={deleted_at ?? null}
          className="md:col-span-2"
          tone={deleted_at ? "danger" : "neutral"}
          placeholder="—"
        />
      </section>
    </Modal>
  );
}

/* ---------- Subcomponents ---------- */

function Field({
  label,
  value,
  className,
  mono,
  copyable,
}: {
  label: string;
  value?: string | null | undefined; // ← longgar
  className?: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  const display = value ?? "—";
  const [copied, setCopied] = React.useState(false);

  const doCopy = React.useCallback(async () => {
    if (!copyable || !value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }, [copyable, value]);

  return (
    <div className={className}>
      <div className="text-foreground/55 mb-1 text-[11px] tracking-wide uppercase">{label}</div>
      <div className="flex items-center gap-2">
        <div className={cls("text-foreground text-sm break-words", mono && "font-mono")}>
          {display}
        </div>
        {copyable && value && (
          <button
            type="button"
            onClick={doCopy}
            className="text-foreground/70 hover:bg-card-primary inline-flex h-6 items-center rounded-md px-2 text-[11px] font-medium"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
    </div>
  );
}

function MetaCard({
  title,
  by,
  at,
  className,
  tone = "neutral",
}: {
  title: string;
  by: string | null;
  at: string | null;
  className?: string;
  tone?: "neutral" | "danger";
  placeholder?: string;
}) {
  const has = Boolean(at);
  return (
    <div
      className={cls(
        "rounded-xl border p-4",
        tone === "danger"
          ? "border-red-200/60 bg-red-50 dark:border-red-900/40 dark:bg-red-900/20"
          : "border-border bg-card-primary/40",
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="text-foreground/70 text-[12px] font-semibold tracking-wide uppercase">
          {title}
        </div>
        <Badge size="xs" tone={has ? (tone === "danger" ? "danger" : "secondary") : "neutral"}>
          {has ? (tone === "danger" ? "Ada" : "Info") : "—"}
        </Badge>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label="Waktu" value={formatDate(at)} />
        <Field label="Relative" value={formatRelative(at)} />
        <Field label="Oleh" value={by} mono copyable />
      </div>
    </div>
  );
}

/* ---------- Utils ---------- */

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return d.toLocaleString();
  }
}

function formatRelative(iso?: string | null): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return null;
  const now = Date.now();
  const diff = Math.round((now - then) / 1000); // detik
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (abs < 60) return rtf.format(-diff, "second");
  if (abs < 3600) return rtf.format(-Math.floor(diff / 60), "minute");
  if (abs < 86400) return rtf.format(-Math.floor(diff / 3600), "hour");
  if (abs < 604800) return rtf.format(-Math.floor(diff / 86400), "day");
  if (abs < 2629800) return rtf.format(-Math.floor(diff / 604800), "week");
  if (abs < 31557600) return rtf.format(-Math.floor(diff / 2629800), "month");
  return rtf.format(-Math.floor(diff / 31557600), "year");
}
