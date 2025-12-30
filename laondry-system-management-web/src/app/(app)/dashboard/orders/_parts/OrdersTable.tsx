"use client";

import * as React from "react";

import DataTable from "@/components/table/DataTable";
import Pagination from "@/components/table/Pagination";
import type { Column, RowAction } from "@/components/table/types";

import type { OrderRow, Sort } from "./types";

type Props = {
  items: OrderRow[];
  pagination: { total: number } | undefined;
  loading: boolean;

  sort: Sort;
  onSortChange: (s: Sort) => void;

  selected: string[];
  onToggleSelect: (key: string, checked: boolean) => void;
  onToggleSelectAll: (keys: string[], checked: boolean) => void;

  page: number;
  perPage: number;
  onPageChange: (p: number) => void;
  onPerPageChange: (n: number) => void;

  onBulkChangeStatus: () => void;
  onBulkPrint: () => void;
  onClearSelection: () => void;

  rowActions: RowAction<OrderRow>[];
};

export default function OrdersTable({
  items,
  pagination,
  loading,
  sort,
  onSortChange,
  selected,
  onToggleSelect,
  onToggleSelectAll,
  page,
  perPage,
  onPageChange,
  onPerPageChange,
  onBulkChangeStatus,
  onBulkPrint,
  onClearSelection,
  rowActions,
}: Props) {
  const columns: Column<OrderRow>[] = React.useMemo(
    () => [
      {
        id: "created",
        header: "Created",
        width: "140px",
        accessor: (row) => (
          <span className="text-foreground/80 text-xs">
            {row.created_at
              ? new Date(row.created_at).toLocaleString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"}
          </span>
        ),
        sortable: true,
      },
      {
        id: "order_no",
        header: "Order No",
        accessor: (row) => <span className="text-foreground font-medium">{row.order_no}</span>,
      },
      {
        id: "type",
        header: "Type",
        width: "90px",
        accessor: (row) => (
          <span className="text-foreground/70 text-xs uppercase">{row.order_type || "-"}</span>
        ),
      },
      {
        id: "status",
        header: "Status",
        width: "140px",
        accessor: (row) => {
          const s = (row.status || "").toUpperCase();
          const cls =
            s === "NEW"
              ? "bg-blue-100 text-blue-800 ring-1 ring-blue-200"
              : s === "PROCESSING"
                ? "bg-amber-100 text-amber-800 ring-1 ring-amber-200"
                : s === "READY"
                  ? "bg-violet-100 text-violet-800 ring-1 ring-violet-200"
                  : s === "DONE" || s === "COMPLETED"
                    ? "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200"
                    : s === "CANCELED" || s === "CANCELLED"
                      ? "bg-rose-100 text-rose-800 ring-1 ring-rose-200"
                      : "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
          return (
            <span
              className={[
                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tracking-wide uppercase",
                cls,
              ].join(" ")}
            >
              {s || "-"}
            </span>
          );
        },
      },
      {
        id: "promised",
        header: "Promised",
        width: "120px",
        accessor: (row) => (
          <span className="text-foreground/70 text-xs">
            {row.promised_at
              ? new Date(row.promised_at).toLocaleDateString("id-ID", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </span>
        ),
        sortable: true,
      },
      {
        id: "grand_total",
        header: "Grand Total",
        className: "text-right",
        width: "140px",
        accessor: (row) => (
          <span className="text-foreground font-semibold tabular-nums">
            {typeof row.grand_total === "number"
              ? `Rp ${row.grand_total.toLocaleString("id-ID")}`
              : "Rp 0"}
          </span>
        ),
        sortable: true,
      },
    ],
    []
  );

  return (
    <div className="ring-border rounded-2xl bg-white shadow-sm ring-1">
      {selected.length > 0 && (
        <div className="border-border bg-brand-50/40 flex items-center justify-between gap-2 border-b p-3 text-sm">
          <div>
            <span className="font-medium">{selected.length}</span> dipilih
          </div>
          <div className="flex items-center gap-2">
            <button
              className="border-border text-brand-700 hover:bg-brand-50 inline-flex h-8 items-center rounded-md border bg-white px-3 text-xs font-medium"
              onClick={onBulkChangeStatus}
            >
              Change Status
            </button>
            <button
              className="border-border text-brand-700 hover:bg-brand-50 inline-flex h-8 items-center rounded-md border bg-white px-3 text-xs font-medium"
              onClick={onBulkPrint}
            >
              Print
            </button>
            <button
              className="text-foreground/70 inline-flex h-8 items-center rounded-md border border-transparent px-3 text-xs font-medium hover:bg-gray-100"
              onClick={onClearSelection}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <DataTable<OrderRow>
        data={items}
        columns={columns}
        keyField="id"
        loading={loading}
        loadingText="Memuat data..."
        selectable
        selectedKeys={selected}
        onToggleSelect={(key, checked) => onToggleSelect(String(key), checked)}
        onToggleSelectAll={(checked) =>
          onToggleSelectAll(
            items.map((i) => String(i.id)),
            checked
          )
        }
        sort={sort}
        onSortChange={onSortChange}
        rowActions={rowActions}
        emptyState={{
          variant: "ghost",
          align: "center",
          title: "Tidak ada data",
          description: "Belum ada order sesuai filter",
          size: "sm",
        }}
      />

      <div className="border-border border-t">
        <Pagination
          value={{ page, perPage, total: pagination?.total ?? 0 }}
          onPageChange={onPageChange}
          onPerPageChange={(n) => {
            onPerPageChange(n);
            onPageChange(1);
          }}
          className="bg-white"
        />
      </div>
    </div>
  );
}
