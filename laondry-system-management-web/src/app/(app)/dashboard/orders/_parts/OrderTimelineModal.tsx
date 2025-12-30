"use client";

import * as React from "react";
import Modal from "@/components/ui/Modal";
import type { OrderLog } from "@/features/orders/useOrders";

export default function OrderTimelineModal({
  isOpen,
  onClose,
  loading,
  data,
}: {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  data?: { order_id: string; items: OrderLog[] };
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Order Timeline" size="lg">
      {loading ? (
        <div className="text-sm text-foreground/60">Memuat…</div>
      ) : !data ? (
        <div className="text-sm text-foreground/60">Data tidak tersedia</div>
      ) : (
        <section className="rounded-2xl bg-white ring-1 ring-border shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-brand-50/40 px-4 py-3">
            <div className="text-sm">
              <div className="text-foreground/60">Order ID</div>
              <div className="font-semibold text-foreground">{data.order_id}</div>
            </div>
            <div className="text-xs text-foreground/60">{data.items.length} log</div>
          </div>

          {/* Timeline */}
          <div className="max-h-96 overflow-auto px-4 py-3">
            <ol className="relative ml-4 border-l border-border/80">
              {data.items.map((log) => (
                <li key={log.id} className="relative mb-4 pl-4 last:mb-0">
                  {/* Dot */}
                  <span className="absolute -left-1.5 top-1.5 inline-block h-3 w-3 rounded-full bg-brand-500 ring-2 ring-white" />

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill value={log.from_status ?? "—"} />
                        <span className="text-xs text-foreground/60">→</span>
                        <StatusPill value={log.to_status} strong />
                      </div>
                      {log.note && (
                        <div className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-foreground/80 ring-1 ring-gray-200">
                          {log.note}
                        </div>
                      )}
                    </div>

                    <time className="shrink-0 whitespace-nowrap text-xs text-foreground/60">
                      {new Date(log.changed_at).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}
    </Modal>
  );
}

function StatusPill({ value, strong = false }: { value?: string | null; strong?: boolean }) {
  const s = (value || "").toUpperCase();

  const base =
    s === "NEW"
      ? "bg-blue-100 text-blue-800 ring-blue-200"
      : s === "PROCESSING"
      ? "bg-amber-100 text-amber-800 ring-amber-200"
      : s === "READY"
      ? "bg-violet-100 text-violet-800 ring-violet-200"
      : s === "DONE" || s === "COMPLETED"
      ? "bg-emerald-100 text-emerald-800 ring-emerald-200"
      : s === "CANCELED" || s === "CANCELLED"
      ? "bg-rose-100 text-rose-800 ring-rose-200"
      : "bg-gray-100 text-gray-700 ring-gray-200";

  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wide ring-1",
        strong ? "font-semibold" : "font-medium",
        base,
      ].join(" ")}
    >
      {s || "-"}
    </span>
  );
}
