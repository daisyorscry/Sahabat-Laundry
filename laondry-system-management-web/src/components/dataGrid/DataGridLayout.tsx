"use client";

import * as React from "react";

import Pagination from "./Pagination";
import SkeletonCard from "./SkeletonCard";
import Toolbar from "./Toolbar";
import type { DataGridLayoutProps } from "./types";
import { clsx, gridClass } from "./utils";

export function DataGridLayout<T>({
  items,
  renderItem,
  loading = false,
  skeletonCount = 8,
  searchable = true,
  query,
  onQueryChange,
  searchPlaceholder,
  sortable = true,
  sortKey,
  sortOrder = "desc",
  onSortChange,
  sortOptions = [],
  actions,
  gridCols,
  className,
  emptyTitle = "Tidak ada data",
  emptyDescription,
  emptyAction,
  page = 1,
  perPage = 10,
  total = 0,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 20, 30, 50],
  ...rest
}: DataGridLayoutProps<T>) {
  const Muted = "text-[color-mix(in oklab,var(--color-foreground) 60%,var(--color-background))]";

  return (
    <div className={clsx("flex flex-col gap-4", className)} {...rest}>
      {(searchable || (sortable && sortOptions.length > 0) || !!actions) && (
        <Toolbar
          searchable={searchable}
          query={query}
          onQueryChange={(v) => {
            onQueryChange?.(v);
          }}
          searchPlaceholder={searchPlaceholder}
          sortable={sortable}
          sortKey={sortKey}
          sortOrder={sortOrder}
          onSortChange={onSortChange}
          sortOptions={sortOptions}
          actions={actions}
        />
      )}

      {loading ? (
        <div className={gridClass(gridCols)}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          className={clsx(
            "flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-xl border text-center",
            "border-[var(--color-border)] bg-[var(--color-surface)]"
          )}
        >
          <div className="text-base font-medium text-[var(--color-foreground)]">{emptyTitle}</div>
          {emptyDescription ? (
            <div className={clsx("text-sm", Muted)}>{emptyDescription}</div>
          ) : null}
          {emptyAction ? <div className="mt-2">{emptyAction}</div> : null}
        </div>
      ) : (
        <div className={gridClass(gridCols)}>
          {items.map((it, idx) => (
            <React.Fragment key={(it as unknown as { id?: string })?.id ?? idx}>
              {renderItem(it)}
            </React.Fragment>
          ))}
        </div>
      )}

      {onPageChange && onPerPageChange ? (
        <Pagination
          page={page}
          perPage={perPage}
          total={total}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
          perPageOptions={perPageOptions}
        />
      ) : null}
    </div>
  );
}

export default DataGridLayout;
