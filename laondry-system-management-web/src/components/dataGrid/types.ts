"use client";

export type SortOrder = "asc" | "desc";

export type GridCols = {
  base?: number; // default 1
  sm?: number; // default 2
  md?: number; // default 3
  lg?: number; // default 4
  xl?: number; // default 4
};

export type ToolbarSortOption = { label: string; value: string; order?: SortOrder };

export type DataGridLayoutProps<T> = {
  // data
  items: T[];
  renderItem: (item: T) => React.ReactNode;

  // ui state
  loading?: boolean;
  skeletonCount?: number;

  // toolbar
  searchable?: boolean;
  query?: string;
  onQueryChange?: (q: string) => void;
  searchPlaceholder?: string;

  sortable?: boolean;
  sortKey?: string;
  sortOrder?: SortOrder;
  onSortChange?: (next: { sortKey: string; sortOrder: SortOrder }) => void;
  sortOptions?: ToolbarSortOption[];

  actions?: React.ReactNode;

  // grid
  gridCols?: GridCols;
  className?: string;

  // empty
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;

  // pagination
  page?: number;
  perPage?: number;
  total?: number; // server-driven total
  onPageChange?: (page: number) => void;
  onPerPageChange?: (per: number) => void;
  perPageOptions?: number[];

  // accessibility
  "aria-label"?: string;
};


export type Props = Required<
  Pick<DataGridLayoutProps<unknown>, "page" | "perPage" | "total" | "onPageChange" | "onPerPageChange">
> &
  Pick<DataGridLayoutProps<unknown>, "perPageOptions">;
