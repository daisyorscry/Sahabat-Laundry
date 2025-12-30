"use client";

import * as React from "react";

import Drawer from "@/components/ui/Drawer";
import type { OrderDetail } from "@/features/orders/useOrders";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  data?: OrderDetail;
};

export default function OrderDetailsDrawer({ isOpen, onClose, loading, data }: Props) {
  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Order Details" size="lg">
      {loading ? (
        <div className="text-foreground/60 text-sm">Memuat…</div>
      ) : !data ? (
        <div className="text-foreground/60 text-sm">Data tidak tersedia</div>
      ) : (
        <div className="space-y-4 p-4">
          {/* Header ring + badge */}
          <section className="bg-surface ring-border rounded-2xl p-4 shadow-sm ring-1">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-foreground/60 text-xs">Order No</div>
                <div className="text-foreground text-lg font-semibold tracking-tight">
                  {data.order_no}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={data.status} />
                <TypeBadge type={data.order_type} />
              </div>
            </div>

            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <MetaRow label="Created" value={fmtDateTime(data.created_at)} />
              <MetaRow label="Promised" value={fmtDate(data.promised_at)} />
            </div>
          </section>

          {/* Totals as cards */}
          <section className="grid gap-3 sm:grid-cols-2">
            <TotalCard label="Subtotal" value={data.subtotal} />
            <TotalCard label="Discount" value={data.discount} />
            <TotalCard label="Tax" value={data.tax} />
            <TotalCard label="Delivery" value={data.delivery_fee} />
            <div className="sm:col-span-2">
              <div className="bg-surface ring-border rounded-2xl p-4 shadow-sm ring-1">
                <div className="text-foreground/70 text-sm">Grand Total</div>
                <div className="text-foreground mt-0.5 text-2xl font-bold">
                  {fmtIDR(data.grand_total)}
                </div>
              </div>
            </div>
          </section>

          {/* Items table-like list */}
          <section className="bg-surface ring-border rounded-2xl shadow-sm ring-1">
            <header className="flex items-center justify-between p-4">
              <div className="text-foreground text-sm font-medium">Items</div>
              <div className="text-foreground/60 text-xs">{data.items?.length ?? 0} baris</div>
            </header>

            <div className="max-h-80 overflow-auto">
              <div className="min-w-[640px]">
                <div className="border-border/70 bg-background/40 text-foreground/70 grid grid-cols-12 border-t px-4 py-2 text-xs">
                  <div className="col-span-5">Item</div>
                  <div className="col-span-2">Qty/Weight</div>
                  <div className="col-span-2 text-right">Unit</div>
                  <div className="col-span-3 text-right">Line Total</div>
                </div>

                {(data.items ?? []).map((it) => (
                  <div
                    key={it.id}
                    className="border-border/60 hover:bg-background/40 grid grid-cols-12 border-t px-4 py-3 text-sm"
                  >
                    <div className="col-span-5 pr-3">
                      <div className="text-foreground font-medium">
                        {it.service_name ?? it.service_code ?? it.service_id}
                      </div>
                      {Array.isArray(it.addons) && it.addons.length > 0 && (
                        <ul className="text-foreground/70 mt-1 list-disc pl-5 text-xs">
                          {it.addons.map((ax) => (
                            <li key={ax.id}>
                              {ax.addon_name ?? ax.addon_code ?? ax.addon_id} × {ax.qty} —{" "}
                              {fmtIDR(ax.line_total)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="text-foreground/80 col-span-2 self-center">
                      {renderQtyOrWeight(it.qty, it.weight_kg)}
                    </div>

                    <div className="text-foreground/80 col-span-2 self-center text-right tabular-nums">
                      {fmtIDR(it.unit_price)}
                    </div>

                    <div className="text-foreground col-span-3 self-center text-right font-semibold tabular-nums">
                      {fmtIDR(it.line_total)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      )}
    </Drawer>
  );
}

/* ========================
 * Sub-components & utils
 * ====================== */

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border/60 bg-background/40 flex items-center justify-between rounded-xl border px-3 py-2">
      <div className="text-foreground/70">{label}</div>
      <div className="text-foreground font-medium">{value}</div>
    </div>
  );
}

function TotalCard({ label, value }: { label: string; value?: number | null }) {
  return (
    <div className="bg-surface ring-border rounded-2xl p-4 shadow-sm ring-1">
      <div className="text-foreground/70 text-sm">{label}</div>
      <div className="text-foreground mt-0.5 text-xl font-semibold">{fmtIDR(value)}</div>
    </div>
  );
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status ?? "").toUpperCase();
  const cls =
    s === "NEW"
      ? "bg-brand-50 text-brand-500 ring-1 ring-brand-200"
      : s === "PROCESSING"
        ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
        : s === "READY"
          ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200"
          : s === "DONE" || s === "COMPLETED"
            ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
            : s === "CANCELED" || s === "CANCELLED"
              ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
              : "bg-background text-foreground/80 ring-1 ring-border";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      {s || "-"}
    </span>
  );
}

function TypeBadge({ type }: { type?: string | null }) {
  if (!type) return null;
  return (
    <span className="bg-background text-foreground/80 ring-border inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium uppercase ring-1">
      {type}
    </span>
  );
}

function fmtIDR(v?: number | null) {
  const n = Number(v ?? 0);
  return `Rp ${n.toLocaleString("id-ID")}`;
}

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function fmtDateTime(iso?: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

function renderQtyOrWeight(qty?: number | null, weightKg?: number | null) {
  if (qty != null) return `${qty} pcs`;
  if (weightKg != null) return `${weightKg} kg`;
  return "—";
}
