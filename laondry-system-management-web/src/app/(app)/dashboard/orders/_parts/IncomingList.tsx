"use client";

import * as React from "react";
import { FiClock, FiEye, FiPlay, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import StatusChip from "./StatusChip";
import TypeBadge from "./TypeBadge";
import Surface from "@/components/layouts/page/Surface";
import Link from "next/link";
import type { OrderListItem } from "@/features/orders/useOrders";

type Props = {
  items: OrderListItem[];
  loading?: boolean;
  onView: (id: string) => void;
  onTimeline?: (id: string) => void;
  onChangeStatus: (id: string, to: string) => Promise<void> | void;
  onSeeAllNew?: () => void;
};

export default function IncomingList({
  items,
  loading,
  onView,
  onTimeline,
  onChangeStatus,
  onSeeAllNew,
}: Props) {
  return (
    <Surface className="p-0 overflow-hidden rounded-2xl bg-white ring-1 ring-border shadow-sm">
      <div className="flex items-center justify-between border-b border-border bg-brand-50/40 p-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200">
            <FiPlay className="h-3.5 w-3.5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Incoming Orders</h3>
            <p className="text-xs text-foreground/70">Order baru masuk (NEW)</p>
          </div>
        </div>
        <Link
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSeeAllNew?.();
          }}
          className="text-xs text-brand-600 hover:text-brand-700"
        >
          Lihat semua →
        </Link>
      </div>

      {/* List */}
      <ul className="divide-y divide-border/80">
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="p-3">
              <div className="rounded-xl bg-gray-50 ring-1 ring-border p-3 shadow-sm animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="h-4 w-28 rounded bg-gray-300/40" />
                  <div className="h-4 w-20 rounded bg-gray-300/40" />
                </div>
                <div className="mt-2 h-3 w-40 rounded bg-gray-200/50" />
              </div>
            </li>
          ))}

        {!loading && items.length === 0 && (
          <li className="p-6 text-center text-sm text-foreground/60">Tidak ada order baru</li>
        )}

        {!loading &&
          items.map((row) => (
            <li
              key={row.id}
              className="group p-3 transition-all"
            >
              <div className="rounded-xl bg-white ring-1 ring-border p-3 shadow-sm transition-all hover:bg-brand-50/40 hover:ring-brand-300">
                <div className="grid grid-cols-12 items-start gap-3">
                  {/* Left: info */}
                  <div className="col-span-7 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {row.order_no}
                      </span>
                      <TypeBadge value={row.order_type ?? ""} />
                      <StatusChip value={row.status} />
                    </div>
                    <div className="mt-1 text-[11px] text-foreground/70">
                      <FiClock className="mr-1 inline h-3 w-3" />
                      {row.created_at
                        ? new Date(row.created_at).toLocaleString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </div>
                  </div>

                  {/* Right: amount + actions */}
                  <div className="col-span-5 text-right">
                    <div className="tabular-nums text-sm font-semibold text-foreground">
                      {typeof row.grand_total === "number"
                        ? `Rp ${row.grand_total.toLocaleString("id-ID")}`
                        : "Rp 0"}
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-1">
                      <button
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-border bg-white px-2 text-xs text-brand-600 hover:bg-brand-50"
                        onClick={() => onView(String(row.id))}
                      >
                        <FiEye className="h-3.5 w-3.5" /> View
                      </button>

                      <button
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 text-xs text-amber-700 hover:bg-amber-100"
                        onClick={async () => onChangeStatus(String(row.id), "PROCESSING")}
                      >
                        <FiRefreshCw className="h-3.5 w-3.5" /> Processing
                      </button>

                      <button
                        className="inline-flex h-8 items-center gap-1 rounded-md border border-emerald-400 bg-emerald-50 px-2 text-xs text-emerald-700 hover:bg-emerald-100"
                        onClick={async () => onChangeStatus(String(row.id), "READY")}
                      >
                        <FiCheckCircle className="h-3.5 w-3.5" /> Ready
                      </button>
                    </div>

                    {/* Optional: timeline link kecil */}
                    {onTimeline && (
                      <div className="mt-1">
                        <button
                          className="text-[11px] text-foreground/60 hover:text-brand-700"
                          onClick={() => onTimeline(String(row.id))}
                        >
                          Lihat timeline
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
      </ul>
    </Surface>
  );
}
