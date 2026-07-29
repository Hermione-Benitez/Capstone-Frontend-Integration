import { ReactNode } from "react";

export type SortDirection = "asc" | "desc" | null;
export type DensityMode = "compact" | "regular" | "relaxed";

export interface ColumnDef<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
  frozen?: boolean;
  defaultVisible?: boolean;
}

export interface FilterOption {
  label: string;
  value: string;
}
export interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface ActionItem<T> {
  label: string;
  icon?: string;
  onClick: (row: T) => void;
  variant?: "default" | "danger";
  hidden?: (row: T) => boolean;
}

export interface BulkAction {
  label: string;
  icon?: string;
  variant?: "default" | "danger";
  destructive?: boolean;
  undoable?: boolean;
  onClick: (selectedKeys: (string | number)[]) => void;
}

export interface CreateButton {
  label: string;
  icon?: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

// Saved filter preset — stored in localStorage per table
export interface FilterPreset {
  id: string;
  name: string;
  search: string;
  filters: Record<string, string>;
  sortKey: string | null;
  sortDir: SortDirection;
}

export interface DataTableProps<T> {
  rowKey: keyof T;
  data: T[];
  columns: ColumnDef<T>[];
  actions?: ActionItem<T>[];
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  filters?: FilterConfig[];
  createButtons?: CreateButton[];
  bulkActions?: BulkAction[];
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  emptyMessage?: string;
  selectable?: boolean;
  onSelectionChange?: (selectedKeys: (string | number)[]) => void;
  className?: string;
  loading?: boolean;
  exportable?: boolean;
  onExport?: (data: T[], columns: ColumnDef<T>[]) => void;
  columnToggle?: boolean;
  densityToggle?: boolean;

  // Server-side Pagination & Operations Props
  serverSide?: boolean;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (sortKey: string | null, sortDir: SortDirection) => void;
  onSearchChange?: (query: string) => void;
  onFilterChange?: (filters: Record<string, string>) => void;
}
