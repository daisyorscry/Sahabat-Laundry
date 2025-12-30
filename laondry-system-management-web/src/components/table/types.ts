// src/components/table/types.ts
export type Sort = { id: string; desc: boolean };
export type PaginationState = { page: number; perPage: number; total?: number };

export type Column<T> = {
  id: string;
  header: string | React.ReactNode;
  accessor?: (row: T) => React.ReactNode;
  field?: keyof T;
  sortable?: boolean;
  width?: string;
  className?: string;
};

export type RowAction<T> = {
  id: string;
  label: string;
  onClick: (row: T) => void | Promise<void>;
  confirm?: boolean;
};

export type EmptyStateOptions = {
  title?: string;
  description?: string;
  text?: string;
  icon?: React.ReactNode;
  illustrationSrc?: string;
  variant?: "ghost" | "card";
  align?: "center" | "left";
  size?: "sm" | "md";
  minHeight?: number | string;
  // actions
  primaryAction?: { label: string; onClick?: () => void; href?: string; disabled?: boolean };
  secondaryAction?: { label: string; onClick?: () => void; href?: string; disabled?: boolean };
  // custom children (mis. tips)
  children?: React.ReactNode;
};

export type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  keyField: keyof T; // unique key
  loading?: boolean;
  loadingText: string;
  emptyText?: string;
  emptyState?: EmptyStateOptions;

  // selection (opsional)
  selectable?: boolean;
  selectedKeys?: Array<T[keyof T]>;
  onToggleSelect?: (key: T[keyof T], checked: boolean) => void;
  onToggleSelectAll?: (checked: boolean) => void;

  // sorting (controlled)
  sort?: Sort | null;
  onSortChange?: (next: Sort | null) => void;

  // row actions (opsional)
  rowActions?: RowAction<T>[];

  // paging (controlled)
  pagination?: PaginationState;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;

  // styling
  dense?: boolean;
  rowClassName?: (row: T, idx: number) => string | undefined;
};
