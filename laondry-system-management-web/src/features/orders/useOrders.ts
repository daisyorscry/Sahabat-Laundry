"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { api } from "@/lib/axios/api";
import type { BackendResponse } from "@/features/mutation";

type ApiErr = AxiosError<BackendResponse<any>>;

const BASE = "/orders";

export type OrdersQuery = {
  q?: string;
  status?: string;
  outlet_id?: string;
  customer_id?: string;
  type?: "DROPOFF" | "PICKUP";
  date_from?: string;
  date_to?: string;
  sort?: "created_at" | "updated_at" | "order_no" | "status" | "promised_at" | "grand_total";
  order?: "asc" | "desc";
  per_page?: number;
  page?: number;
};

export type OrderListItem = {
  id: string;
  order_no: string;
  status: string;
  order_type?: "DROPOFF" | "PICKUP";
  outlet_id?: string;
  customer_id?: string;
  grand_total?: number;
  created_at?: string;
  promised_at?: string | null;
};

export type OrdersListData = {
  items: OrderListItem[];
  pagination: { current_page: number; per_page: number; total: number; last_page: number };
  query?: Record<string, unknown>;
};

export const qk = {
  list: (params?: Partial<OrdersQuery>) => ["orders", "list", params] as const,
  statuses: ["lookups", "order-statuses"] as const,
};

export function useOrders(params?: Partial<OrdersQuery>) {
  return useQuery<BackendResponse<OrdersListData>, ApiErr>({
    queryKey: qk.list(params),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.q) p.set("q", params.q);
      if (params?.status) p.set("status", params.status);
      if (params?.outlet_id) p.set("outlet_id", params.outlet_id);
      if (params?.customer_id) p.set("customer_id", params.customer_id);
      if (params?.type) p.set("type", params.type);
      if (params?.date_from) p.set("date_from", params.date_from);
      if (params?.date_to) p.set("date_to", params.date_to);
      if (params?.sort) p.set("sort", params.sort);
      if (params?.order) p.set("order", params.order);
      if (params?.per_page) p.set("per_page", String(params.per_page));
      if (params?.page) p.set("page", String(params.page));
      const qs = p.toString();
      const res = await api().get(`${BASE}${qs ? `?${qs}` : ""}`);
      return res.data as BackendResponse<OrdersListData>;
    },
    placeholderData: keepPreviousData,
  });
}

export type OrderStatusLookup = { code: string; name: string; is_final?: boolean };
export function useOrderStatuses() {
  return useQuery<BackendResponse<{ items: OrderStatusLookup[] }>, ApiErr>({
    queryKey: qk.statuses,
    queryFn: async () => {
      const res = await api().get(`/lookups/order-statuses`);
      return res.data as BackendResponse<{ items: OrderStatusLookup[] }>;
    },
  });
}

// Details
export type OrderDetail = OrderListItem & {
  subtotal?: number;
  discount?: number;
  tax?: number;
  delivery_fee?: number;
  items?: Array<{
    id: string;
    service_id: string;
    service_code?: string;
    service_name?: string;
    unit_price?: number;
    qty?: number | null;
    weight_kg?: number | null;
    line_total?: number;
    addons?: Array<{
      id: string;
      addon_id: string;
      addon_code?: string;
      addon_name?: string;
      qty?: number;
      unit_price?: number;
      line_total?: number;
    }>;
  }>;
};

export function useOrderDetail(id?: string | null, enabled = true) {
  return useQuery<BackendResponse<OrderDetail>, ApiErr>({
    queryKey: ["orders", "detail", id],
    queryFn: async () => {
      const res = await api().get(`${BASE}/${id}`);
      return res.data as BackendResponse<OrderDetail>;
    },
    enabled: !!id && enabled,
  });
}

// Timeline
export type OrderLog = {
  id: string;
  from_status?: string | null;
  to_status: string;
  note?: string | null;
  changed_at: string;
  changed_by?: string | null;
};

export function useOrderTimeline(id?: string | null, enabled = true) {
  return useQuery<BackendResponse<{ order_id: string; items: OrderLog[] }>, ApiErr>({
    queryKey: ["orders", "timeline", id],
    queryFn: async () => {
      const res = await api().get(`${BASE}/${id}/timeline`);
      return res.data as BackendResponse<{ order_id: string; items: OrderLog[] }>;
    },
    enabled: !!id && enabled,
  });
}

// Mutations
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useChangeOrderStatus() {
  const qc = useQueryClient();
  return useMutation<BackendResponse<OrderDetail>, ApiErr, { id: string; to_status: string; note?: string }>(
    {
      mutationKey: ["orders", "change-status"],
      mutationFn: async ({ id, to_status, note }) => {
        const res = await api().post(`${BASE}/${id}/change-status`, { to_status, note });
        return res.data as BackendResponse<OrderDetail>;
      },
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: ["orders", "list"] });
      },
    }
  );
}

export function useRecalcOrder() {
  const qc = useQueryClient();
  return useMutation<BackendResponse<OrderDetail>, ApiErr, { id: string; reprice?: boolean }>(
    {
      mutationKey: ["orders", "recalc"],
      mutationFn: async ({ id, reprice = true }) => {
        const res = await api().post(`${BASE}/${id}/recalc`, { reprice });
        return res.data as BackendResponse<OrderDetail>;
      },
      onSuccess: async () => {
        await qc.invalidateQueries({ queryKey: ["orders", "list"] });
      },
    }
  );
}

// Print data
export function useOrderPrint(id?: string | null, enabled = false) {
  return useQuery<BackendResponse<{ order: OrderDetail; printed_at: string }>, ApiErr>({
    queryKey: ["orders", "print", id],
    queryFn: async () => {
      const res = await api().get(`${BASE}/${id}/print`);
      return res.data as BackendResponse<{ order: OrderDetail; printed_at: string }>;
    },
    enabled: !!id && enabled,
  });
}
