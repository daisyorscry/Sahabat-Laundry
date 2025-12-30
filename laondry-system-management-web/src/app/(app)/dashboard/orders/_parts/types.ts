"use client";

export type Filters = {
  q?: string;
  range: { start?: string; end?: string };
  status?: string;
  type?: "DROPOFF" | "PICKUP" | "";
  __note?: string; // for change-status modal note
};
import type { Sort as TableSort } from "@/components/table/types";
export type Sort = TableSort | null;

export type OrderRow = {
  id: string | number;
  created_at?: string | null;
  promised_at?: string | null;
  order_no: string;
  order_type?: string | null;
  status?: string | null;
  grand_total?: number | null;
};
