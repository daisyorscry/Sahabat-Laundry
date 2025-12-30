"use client";

import * as React from "react";

import Button from "@/components/button/Button";
import Pagination from "@/components/table/Pagination";
import { PaginationPropsLite } from "@/components/table/TablePanel";
import type { Addon, Sortable } from "@/features/order-service/useAddons";

import AddonCard from "./AddonCard";

export function AddonGrid({
  items,
  loading,
  empty,
  q,
  onQChange,
  sort,
  onSortChange,
  pagination,
  onEdit,
  onDelete,
}: {
  items: Addon[];
  loading: boolean;
  empty: { title: string; description?: string; onCreate: () => void };
  q: string;
  onQChange: (v: string) => void;
  sort: { sort: Sortable; order: "asc" | "desc" };
  onSortChange: (s: { sort: Sortable; order: "asc" | "desc" }) => void;
  pagination: PaginationPropsLite;
  onPageChange: (page: number) => void;
  onPerPageChange: (per: number) => void;
  onEdit: (row: Addon) => void;
  onDelete: (row: Addon) => void;
}) {

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <input
            value={q}
            onChange={(e) => onQChange(e.target.value)}
            placeholder="Cari kode/nama/deskripsi..."
            className="h-9 w-64 rounded-md border px-3 text-sm transition outline-none focus:border-[var(--primary)]"
          />
          <select
            value={`${sort.sort}:${sort.order}`}
            onChange={(e) => {
              const [s, o] = e.target.value.split(":") as [Sortable, "asc" | "desc"];
              onSortChange({ sort: s, order: o });
            }}
            className="h-9 rounded-md border px-3 text-sm"
          >
            <option value="created_at:desc">Terbaru</option>
            <option value="created_at:asc">Terlama</option>
            <option value="name:asc">Nama A–Z</option>
            <option value="name:desc">Nama Z–A</option>
            <option value="price:asc">Harga termurah</option>
            <option value="price:desc">Harga termahal</option>
            <option value="code:asc">Kode A–Z</option>
            <option value="code:desc">Kode Z–A</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl border bg-[var(--muted)]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border bg-[var(--surface)] text-center">
          <div className="text-base font-medium">{empty.title}</div>
          {empty.description ? (
            <div className="text-sm text-[var(--muted-foreground)]">{empty.description}</div>
          ) : null}
          <div className="mt-2">
            <Button variant="solid" tone="primary" onClick={empty.onCreate}>
              Tambah Addon
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((it) => (
            <AddonCard key={it.id} data={it} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
      <Pagination
        value={pagination.value}
        onPageChange={pagination.onPageChange}
        onPerPageChange={pagination.onPerPageChange}
      />
    </div>
  );
}
