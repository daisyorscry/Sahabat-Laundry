"use client";

import * as React from "react";

import DataTable from "./DataTable";
import Pagination from "./Pagination";
import Toolbar from "./Toolbar";
import type { DataTableProps, PaginationState } from "./types";

export type ToolbarPropsLite = React.ComponentProps<typeof Toolbar>;
export type PaginationPropsLite = {
  value: PaginationState;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
};

type TablePanelProps<T> = {
  toolbar?: Omit<ToolbarPropsLite, "className"> & { className?: string };
  table: DataTableProps<T>;
  pagination: PaginationPropsLite;
  footerClassName?: string;
  containerClassName?: string;
};

export default function TablePanel<T>({
  toolbar,
  table,
  pagination,
  footerClassName,
  containerClassName,
}: TablePanelProps<T>) {
  return (
    <div className={containerClassName}>
      {toolbar && (
        <div className="p-3">
          <Toolbar {...toolbar} />
        </div>
      )}

      <div className="mt-3">
        <DataTable<T> {...table} />
        <div className={["ryp-2.5 flex items-center justify-end", footerClassName ?? ""].join(" ")}>
          <Pagination
            value={pagination.value}
            onPageChange={pagination.onPageChange}
            onPerPageChange={pagination.onPerPageChange}
          />
        </div>
      </div>
    </div>
  );
}
