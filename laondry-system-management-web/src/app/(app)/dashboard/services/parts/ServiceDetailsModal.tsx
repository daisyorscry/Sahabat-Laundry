"use client";

import * as React from "react";

import Modal from "@/components/ui/Modal";
import type { Service } from "@/features/order-service/useService";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  data: Service | null;
};

export default function ServiceDetailsModal({ isOpen, onClose, data }: Props) {
  const fmtRp = (n?: string | number | null) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(n ?? 0));

  const createdBy = data?.creator ? (data.creator.name ?? data.creator.email ?? "—") : "—";
  const updatedBy = data?.updater ? (data.updater.name ?? data.updater.email ?? "—") : "—";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolved = (data as any)?.resolved_price as
    | {
        price: string | number;
        member_tier?: string | null;
        is_express?: boolean;
        effective_start?: string;
        effective_end?: string | null;
      }
    | undefined;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data ? `Detail Service — ${data.name}` : "Detail Service"}
      size="xl"
    >
      {!data ? (
        <div className="text-sm text-[color-mix(in_oklab,var(--color-foreground)_70%,transparent)]">
          Tidak ada data.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <DetailItem label="Kode" value={data.code} />
          <DetailItem label="Nama" value={data.name} />

          <DetailItem label="Kategori" value={data.category?.name ?? "—"} />
          <DetailItem
            label="Pricing"
            value={data.pricing_model === "weight" ? "Per Kg" : "Per Pcs"}
          />

          <DetailItem label="Base Price" value={fmtRp(data.base_price)} />
          <DetailItem label="Min Qty" value={String(data.min_qty ?? 0)} />
          <DetailItem label="Durasi (jam)" value={String(data.est_duration_hours)} />
          <DetailItem label="Express" value={data.is_express_available ? "Tersedia" : "Tidak"} />
          <DetailItem label="Aktif" value={data.is_active ? "Ya" : "Tidak"} />

          <div className="grid grid-cols-1 gap-4 md:col-span-2 md:grid-cols-2">
            <DetailItem label="Harga Efektif" value={resolved ? fmtRp(resolved.price) : "—"} />
            <DetailItem
              label="Tier/Express"
              value={
                resolved
                  ? [
                      resolved.member_tier ?? "REGULAR",
                      resolved.is_express ? "Express" : "Normal",
                    ].join(" · ")
                  : "—"
              }
            />
            {resolved && (
              <>
                <DetailItem label="Start" value={resolved.effective_start ?? "—"} />
                <DetailItem label="End" value={resolved.effective_end ?? "—"} />
              </>
            )}
          </div>

          <div className="md:col-span-2">
            <DetailItem label="Deskripsi" value={data.description ?? "—"} multiline />
          </div>

          <DetailItem label="Dibuat" value={new Date(data.created_at).toLocaleString("id-ID")} />
          <DetailItem label="Diubah" value={new Date(data.updated_at).toLocaleString("id-ID")} />

          <DetailItem label="Dibuat oleh" value={createdBy} />
          <DetailItem label="Diubah oleh" value={updatedBy} />

          {/* Addons */}
          <div className="md:col-span-3">
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
              <div className="text-xs font-medium text-[color-mix(in_oklab,var(--color-foreground)_65%,transparent)]">
                Addons ({data.addons?.length ?? 0})
              </div>
              {data.addons && data.addons.length > 0 ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {data.addons.map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate font-medium">
                          {a.name} <span className="opacity-70">({a.code})</span>
                        </div>
                        {a.description && (
                          <div className="truncate opacity-80">{a.description}</div>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-sm">{fmtRp(a.price)}</span>
                        <span
                          className={[
                            "inline-flex h-6 items-center rounded-full px-2 text-xs",
                            a.pivot?.is_required
                              ? "border border-[var(--color-border)]"
                              : "border border-dashed border-[var(--color-border)] opacity-70",
                          ].join(" ")}
                        >
                          {a.pivot?.is_required ? "Wajib" : "Opsional"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 text-sm opacity-70">Tidak ada addon.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}

function DetailItem({
  label,
  value,
  multiline,
}: {
  label: string;
  value: React.ReactNode;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <div className="text-xs font-medium text-[color-mix(in_oklab,var(--color-foreground)_65%,transparent)]">
        {label}
      </div>
      <div className={["mt-1 text-sm", multiline ? "whitespace-pre-wrap" : "truncate"].join(" ")}>
        {value}
      </div>
    </div>
  );
}
