// src/components/table/Pagination.tsx
"use client";

import * as React from "react";
import {
  HiChevronDoubleLeft,
  HiChevronDoubleRight,
  HiChevronLeft,
  HiChevronRight,
} from "react-icons/hi";

import { PaginationState } from "./types";

// src/components/table/Pagination.tsx

type Props = {
  value: PaginationState;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
  className?: string;

  tableId?: string;
  showPerPage?: boolean;
  showEdges?: boolean;
  labels?: {
    rowsPerPage?: string;
    of?: string;
    items?: string;
    firstPage?: string;
    prevPage?: string;
    nextPage?: string;
    lastPage?: string;
  };
};

export default function Pagination({
  value,
  onPageChange,
  onPerPageChange,
  perPageOptions = [10, 20, 50, 100],
  className,
  tableId,
  showPerPage = true,
  showEdges = true,
  labels = {
    rowsPerPage: "Rows per page",
    of: "of",
    items: "items",
    firstPage: "First page",
    prevPage: "Previous page",
    nextPage: "Next page",
    lastPage: "Last page",
  },
}: Props) {
  const { page, perPage, total } = value;

  const totalPages = React.useMemo(
    () => (typeof total === "number" ? Math.max(1, Math.ceil(total / perPage)) : 1),
    [total, perPage]
  );
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const from = React.useMemo(
    () => (typeof total === "number" && total > 0 ? (page - 1) * perPage + 1 : 0),
    [total, page, perPage]
  );
  const to = React.useMemo(
    () => (typeof total === "number" ? Math.min(page * perPage, total) : 0),
    [total, page, perPage]
  );

  const options = React.useMemo(() => {
    const set = new Set(perPageOptions);
    set.add(perPage);
    return Array.from(set).sort((a, b) => a - b);
  }, [perPageOptions, perPage]);

  const goFirst = React.useCallback(() => canPrev && onPageChange?.(1), [canPrev, onPageChange]);
  const goPrev = React.useCallback(
    () => canPrev && onPageChange?.(page - 1),
    [canPrev, page, onPageChange]
  );
  const goNext = React.useCallback(
    () => canNext && onPageChange?.(page + 1),
    [canNext, page, onPageChange]
  );
  const goLast = React.useCallback(
    () => canNext && onPageChange?.(totalPages),
    [canNext, totalPages, onPageChange]
  );

  const btnPager = [
    "inline-flex h-8 w-8 items-center justify-center rounded-md",
    "border border-border bg-background text-foreground",
    "hover:bg-card-primary",
    // Fokus: ring sama dengan border-primary; tanpa offset putih
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ring-[var(--border-primary)]",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "transition-colors",
  ].join(" ");

  return (
    <div
      className={["flex w-full items-center justify-between p-3 text-sm", className ?? ""].join(
        " "
      )}
    >
      {showPerPage && (
        <label className="flex items-center gap-2">
          <span className="opacity-70">{labels.rowsPerPage}</span>
          <select
            aria-label={labels.rowsPerPage}
            value={perPage}
            onChange={(e) => onPerPageChange?.(Number(e.target.value))}
            className={[
              "h-9 rounded-md px-2",
              "border-border bg-background text-foreground border",
              "ring-[var(--border-primary)] focus-visible:ring-2 focus-visible:ring-offset-0 focus-visible:outline-none",
              "transition-colors",
            ].join(" ")}
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="flex items-center gap-3">
        {typeof total === "number" && (
          <span className="opacity-70" aria-live="polite">
            {total > 0 ? `${from}–${to} ${labels.of} ${total}` : `0 ${labels.items}`}
          </span>
        )}

        <div className="flex items-center gap-1" aria-controls={tableId}>
          {showEdges && (
            <button
              type="button"
              aria-label={labels.firstPage}
              title={labels.firstPage}
              disabled={!canPrev}
              onClick={goFirst}
              className={btnPager}
              aria-disabled={!canPrev}
            >
              <HiChevronDoubleLeft className="h-4 w-4" />
            </button>
          )}

          <button
            type="button"
            aria-label={labels.prevPage}
            title={labels.prevPage}
            disabled={!canPrev}
            onClick={goPrev}
            className={btnPager}
            aria-disabled={!canPrev}
          >
            <HiChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-1" aria-live="polite">
            {page} <span className="opacity-70">/ {totalPages}</span>
          </span>

          <button
            type="button"
            aria-label={labels.nextPage}
            title={labels.nextPage}
            disabled={!canNext}
            onClick={goNext}
            className={btnPager}
            aria-disabled={!canNext}
          >
            <HiChevronRight className="h-4 w-4" />
          </button>

          {showEdges && (
            <button
              type="button"
              aria-label={labels.lastPage}
              title={labels.lastPage}
              disabled={!canNext}
              onClick={goLast}
              className={btnPager}
              aria-disabled={!canNext}
            >
              <HiChevronDoubleRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
