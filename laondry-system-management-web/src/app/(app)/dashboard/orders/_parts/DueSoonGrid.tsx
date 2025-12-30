"use client";

import * as React from "react";
import Link from "next/link";
import { FiAlertTriangle, FiCheckCircle, FiClock, FiEye } from "react-icons/fi";

import Surface from "@/components/layouts/page/Surface";
import Dropdown from "@/components/partials/Dropdown";
import type { OrderListItem } from "@/features/orders/useOrders";

import StatusChip from "./StatusChip";
import TypeBadge from "./TypeBadge";

type Props = {
  items: OrderListItem[];
  loading?: boolean;
  onView: (id: string) => void;
  onChangeStatus: (id: string, to: string) => Promise<void> | void;
  onSortByDeadline?: () => void;
  limit?: number;
};

export default function DueSoonGrid({
  items,
  loading,
  onView,
  onChangeStatus,
  onSortByDeadline,
  limit = 8,
}: Props) {
  const [threshold, setThreshold] = React.useState<"2h" | "24h">("2h");

  const rows = React.useMemo(() => {
    const now = Date.now();
    const base = (items || []).filter((r) => {
      const s = (r.status || "").toUpperCase();
      if (["DONE", "COMPLETED", "CANCELED", "CANCELLED"].includes(s)) return false;
      return !!r.promised_at;
    });
    const scored = base.map((r) => {
      const ts = r.promised_at ? new Date(r.promised_at).getTime() : Number.POSITIVE_INFINITY;
      const diffH = Math.floor((ts - now) / 3600000);
      const overdue = diffH < 0;
      const priority = overdue ? -1e12 + ts : ts;
      return { r, ts, diffH, overdue, priority };
    });
    scored.sort((a, b) => a.priority - b.priority);
    return scored.slice(0, limit);
  }, [items, limit]);

  const badgeFor = (diffH: number, ts: number) => {
    const now = new Date();
    const isToday = new Date(ts).toDateString() === now.toDateString();
    if (diffH < 0) return { label: "Overdue", tone: "danger" as const };
    const tH = threshold === "2h" ? 2 : 24;
    if (diffH <= tH) return { label: `< ${tH}h`, tone: "warning" as const };
    if (isToday) return { label: "Today", tone: "today" as const };
    return { label: "Soon", tone: "info" as const };
  };

  return (
    <Surface className="ring-border overflow-hidden rounded-2xl bg-white p-0 shadow-sm ring-1">
      {/* Header */}
      <div className="border-border bg-brand-50/40 flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-300">
            <FiAlertTriangle className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-foreground text-sm font-semibold">Due Soon</h3>
            <p className="text-foreground/70 text-xs">Prioritas berdasarkan promised time</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Dropdown
            value={threshold}
            onChange={(v) => setThreshold(v as "2h" | "24h")}
            options={[
              { value: "2h", label: "< 2h" },
              { value: "24h", label: "< 24h" },
            ]}
            className="w-[110px]"
          />
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onSortByDeadline?.();
            }}
            className="text-brand-600 hover:text-brand-700 text-xs"
          >
            Urutkan berdasarkan deadline
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="ring-border animate-pulse rounded-xl bg-gray-50 p-3 shadow-sm ring-1"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 rounded bg-gray-300/40" />
                <div className="h-4 w-20 rounded bg-gray-300/40" />
              </div>
              <div className="mt-2 h-3 w-44 rounded bg-gray-200/40" />
            </div>
          ))}

        {!loading && rows.length === 0 && (
          <div className="text-foreground/60 col-span-full p-6 text-center text-sm">
            Tidak ada yang mendesak
          </div>
        )}

        {!loading &&
          rows.map(({ r, diffH, ts }) => {
            const { label, tone } = badgeFor(diffH, ts);
            return (
              <article
                key={r.id}
                className="group ring-border hover:bg-brand-50/40 hover:ring-brand-300 rounded-xl bg-white p-3 shadow-sm ring-1 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  {/* Left */}
                  <div className="min-w-0">
                    <div className="mb-1 flex items-center gap-2">
                      <UrgencyBadge label={label} tone={tone} />
                      <StatusChip value={r.status} />
                      <TypeBadge value={r.order_type ?? ""} />
                    </div>

                    <div className="text-foreground truncate text-sm font-semibold">
                      {r.order_no}
                    </div>

                    <div className="text-foreground/70 mt-1 text-[11px]">
                      <FiClock className="mr-1 inline h-3 w-3" />
                      {r.promised_at
                        ? new Date(r.promised_at).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </div>
                  </div>

                  {/* Right */}
                  <div className="text-right">
                    <div className="text-foreground text-sm font-semibold tabular-nums">
                      {typeof r.grand_total === "number"
                        ? `Rp ${r.grand_total.toLocaleString("id-ID")}`
                        : "Rp 0"}
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-1">
                      <button
                        className="border-border text-brand-600 hover:bg-brand-50 inline-flex h-8 items-center gap-1 rounded-md border bg-white px-2 text-xs"
                        onClick={() => onView(String(r.id))}
                      >
                        <FiEye className="h-3.5 w-3.5" /> View
                      </button>

                      {(r.status || "").toUpperCase() === "READY" && (
                        <button
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-400 bg-emerald-50 px-2 text-xs text-emerald-700 hover:bg-emerald-100"
                          onClick={async () => onChangeStatus(String(r.id), "DONE")}
                        >
                          <FiCheckCircle className="h-3.5 w-3.5" /> Done
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
      </div>
    </Surface>
  );
}

/* Subcomponent */
function UrgencyBadge({
  label,
  tone,
}: {
  label: string;
  tone: "danger" | "warning" | "today" | "info";
}) {
  const cls =
    tone === "danger"
      ? "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
      : tone === "warning"
        ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
        : tone === "today"
          ? "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200"
          : "bg-blue-100 text-blue-800 ring-1 ring-blue-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-medium ${cls}`}
    >
      {label}
    </span>
  );
}
