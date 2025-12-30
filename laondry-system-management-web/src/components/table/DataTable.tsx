/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/table/DataTable.tsx
"use client";

import * as React from "react";

import EmptyState from "./EmptyState";
import LoadingState from "./LoadingState";
import { TableContainer, TableEl, TBody, TD, TH, THead, TR } from "./TableShell";
import { Column, DataTableProps } from "./types";

function SortIcon({ dir }: { dir: "asc" | "desc" }) {
  return <span className="ml-1 text-xs">{dir === "asc" ? "▲" : "▼"}</span>;
}

export default function DataTable<T>({
  data,
  columns,
  keyField,
  loading,
  loadingText,
  emptyText,
  emptyState,

  selectable,
  selectedKeys = [],
  onToggleSelect,
  onToggleSelectAll,

  sort,
  onSortChange,

  rowActions = [],
  pagination,
  onPageChange,
  onPerPageChange,

  dense,
  rowClassName,
}: DataTableProps<T>) {
  const allSelected =
    selectable && data.length > 0 && data.every((row) => selectedKeys.includes(row[keyField]));
  const someSelected =
    selectable && !allSelected && data.some((row) => selectedKeys.includes(row[keyField]));

  const handleSort = (col: Column<T>) => {
    if (!col.sortable || !onSortChange) return;
    if (!sort || sort.id !== col.id) onSortChange({ id: col.id, desc: false });
    else onSortChange({ id: col.id, desc: !sort.desc });
  };

  const colSpan = columns.length + (selectable ? 1 : 0) + (rowActions.length ? 1 : 0);

  return (
    <TableContainer>
      <TableEl>
        <THead>
          <TR>
            {selectable && (
              <TH className="w-10">
                <input
                  type="checkbox"
                  aria-label="select-all"
                  checked={Boolean(allSelected)}
                  ref={(el) => {
                    if (el) el.indeterminate = Boolean(someSelected);
                  }}
                  onChange={(e) => onToggleSelectAll?.(e.target.checked)}
                />
              </TH>
            )}

            {columns.map((col) => {
              const isSorted = sort?.id === col.id;
              return (
                <TH
                  key={col.id}
                  className={col.className}
                  style={{ width: col.width }}
                  onClick={() => handleSort(col)}
                >
                  <div
                    className={
                      col.sortable
                        ? "flex cursor-pointer items-center gap-1 select-none"
                        : "flex items-center gap-1"
                    }
                  >
                    {col.header}
                    {isSorted ? <SortIcon dir={sort!.desc ? "desc" : "asc"} /> : null}
                  </div>
                </TH>
              );
            })}

            {rowActions.length > 0 && <TH className="w-1">Aksi</TH>}
          </TR>
        </THead>

        <TBody>
          {loading ? (
            <TR>
              <TD colSpan={colSpan}>
                <LoadingState text={loadingText} />
              </TD>
            </TR>
          ) : data.length === 0 ? (
            <TR>
              <TD colSpan={colSpan}>
                <EmptyState text={emptyText} {...emptyState} />
              </TD>
            </TR>
          ) : (
            data.map((row, idx) => {
              const rowKey = String(row[keyField] as unknown as string | number);
              const isSelected = selectable
                ? selectedKeys.some((k) => String(k as any) === rowKey)
                : false;

              return (
                <TR key={rowKey} className={rowClassName?.(row, idx)}>
                  {selectable && (
                    <TD className="w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => onToggleSelect?.(row[keyField], e.target.checked)}
                        aria-label={`select-row-${rowKey}`}
                      />
                    </TD>
                  )}

                  {columns.map((col) => {
                    let content: React.ReactNode = null;

                    if (col.accessor) {
                      content = col.accessor(row);
                    } else if (col.field) {
                      const v = (row as any)[col.field];
                      content =
                        v === null || v === undefined || v === "" ? (
                          <span className="opacity-50">—</span>
                        ) : (
                          ((v as any)?.toString?.() ?? (v as any))
                        );
                    }

                    return (
                      <TD key={col.id} className={col.className} style={{ width: col.width }}>
                        {content}
                      </TD>
                    );
                  })}

                  {rowActions.length > 0 && (
                    <TD className="whitespace-nowrap">
                      <div className="flex gap-2">
                        {rowActions.map((a) => (
                          <button
                            key={a.id}
                            onClick={async () => {
                              if (a.confirm && !confirm("Lanjutkan aksi ini?")) return;
                              await a.onClick(row);
                            }}
                            className="border-border bg-bg hover:bg-bg-muted ring-brand h-8 rounded-md border px-2 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
                          >
                            {a.label}
                          </button>
                        ))}
                      </div>
                    </TD>
                  )}
                </TR>
              );
            })
          )}
        </TBody>
      </TableEl>

      {/* Footer pagination hook-in (opsional) */}
      {/* {pagination && <div className="border border-border -t -strong" />} */}
    </TableContainer>
  );
}
