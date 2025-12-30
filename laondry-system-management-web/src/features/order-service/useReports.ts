"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";

import { api } from "@/lib/axios/api";

import type { BackendResponse } from "../mutation";

// Helper to handle null | undefined in BackendResponse
export type ReportResponse<T> = Omit<BackendResponse<T>, "data"> & {
  data: T | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiErr = AxiosError<BackendResponse<any>>;

const BASE = "/report";

export const qk = {
  all: ["reports"] as const,
  dashboard: (params?: Partial<ReportParams>) => ["reports", "dashboard", params] as const,
  revenue: (params?: Partial<RevenueParams>) => ["reports", "revenue", params] as const,
  serviceUsage: (params?: Partial<ServiceUsageParams>) => ["reports", "service-usage", params] as const,
  turnaround: (params?: Partial<ReportParams>) => ["reports", "turnaround", params] as const,
  customers: (params?: Partial<CustomersParams>) => ["reports", "customers", params] as const,
};

// Common params for most reports
export type ReportParams = {
  outlet_id?: string | null;
  date_from?: string;
  date_to?: string;
};

export type DashboardData = {
  summary: {
    total_revenue: number;
    total_orders: number;
    active_customers: number;
    pending_orders: number;
    avg_order_value: number;
  };
  order_status: {
    new: number;
    processing: number;
    ready: number;
    done: number;
    canceled: number;
  };
  top_services: Array<{
    name: string;
    revenue: number;
  }>;
  revenue_trend: Array<{
    date: string;
    revenue: number;
  }>;
  query: {
    outlet_id: string | null;
    date_from: string;
    date_to: string;
  };
};

export function useDashboard(params?: ReportParams) {
  return useQuery<ReportResponse<DashboardData>, ApiErr>({
    queryKey: qk.dashboard(params),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.outlet_id) p.set("outlet_id", params.outlet_id);
      if (params?.date_from) p.set("date_from", params.date_from);
      if (params?.date_to) p.set("date_to", params.date_to);
      const qs = p.toString();
      const res = await api().get(`${BASE}/dashboard${qs ? `?${qs}` : ""}`);
      return res.data as ReportResponse<DashboardData>;
    },
    placeholderData: keepPreviousData,
  });
}

export type RevenueParams = ReportParams & {
  group_by?: "day" | "week" | "month";
};

export type RevenueData = {
  summary: {
    total_revenue: number;
  };
  buckets: Array<{
    date: string;
    revenue: number;
  }>;
  query: {
    outlet_id: string | null;
    date_from: string;
    date_to: string;
    group_by: "day" | "week" | "month";
  };
};

export function useRevenue(params?: RevenueParams) {
  return useQuery<ReportResponse<RevenueData>, ApiErr>({
    queryKey: qk.revenue(params),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.outlet_id) p.set("outlet_id", params.outlet_id);
      if (params?.date_from) p.set("date_from", params.date_from);
      if (params?.date_to) p.set("date_to", params.date_to);
      if (params?.group_by) p.set("group_by", params.group_by);
      const qs = p.toString();
      const res = await api().get(`${BASE}/revenue${qs ? `?${qs}` : ""}`);
      return res.data as ReportResponse<RevenueData>;
    },
    placeholderData: keepPreviousData,
  });
}

export type ServiceUsageParams = ReportParams & {
  order_by?: "revenue" | "qty";
  limit?: number;
};

export type ServiceUsageData = {
  items: Array<{
    service_id: string;
    service_code: string;
    service_name: string;
    pricing_model: string;
    revenue: number;
    usage_qty: number;
  }>;
  query: {
    outlet_id: string | null;
    date_from: string;
    date_to: string;
    order_by: "revenue" | "qty";
    limit: number;
  };
};

export function useServiceUsage(params?: ServiceUsageParams) {
  return useQuery<ReportResponse<ServiceUsageData>, ApiErr>({
    queryKey: qk.serviceUsage(params),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.outlet_id) p.set("outlet_id", params.outlet_id);
      if (params?.date_from) p.set("date_from", params.date_from);
      if (params?.date_to) p.set("date_to", params.date_to);
      if (params?.order_by) p.set("order_by", params.order_by);
      if (params?.limit) p.set("limit", String(params.limit));
      const qs = p.toString();
      const res = await api().get(`${BASE}/service-usage${qs ? `?${qs}` : ""}`);
      return res.data as ReportResponse<ServiceUsageData>;
    },
    placeholderData: keepPreviousData,
  });
}

export type TurnaroundData = {
  summary: {
    orders_done: number;
    avg_hours: number;
    min_hours: number;
    max_hours: number;
  };
  query: {
    outlet_id: string | null;
    date_from: string;
    date_to: string;
  };
};

export function useTurnaround(params?: ReportParams) {
  return useQuery<ReportResponse<TurnaroundData>, ApiErr>({
    queryKey: qk.turnaround(params),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.outlet_id) p.set("outlet_id", params.outlet_id);
      if (params?.date_from) p.set("date_from", params.date_from);
      if (params?.date_to) p.set("date_to", params.date_to);
      const qs = p.toString();
      const res = await api().get(`${BASE}/turnaround${qs ? `?${qs}` : ""}`);
      return res.data as ReportResponse<TurnaroundData>;
    },
    placeholderData: keepPreviousData,
  });
}

export type CustomersParams = ReportParams & {
  limit?: number;
  sort?: "orders" | "revenue" | "last";
};

export type CustomersReportData = {
  items: Array<{
    customer_id: string;
    name: string;
    email: string;
    orders_count: number;
    revenue: number;
    last_order_at: string;
  }>;
  query: {
    outlet_id: string | null;
    date_from: string | null;
    date_to: string | null;
    limit: number;
    sort: "orders" | "revenue" | "last";
  };
};

export function useCustomersReport(params?: CustomersParams) {
  return useQuery<ReportResponse<CustomersReportData>, ApiErr>({
    queryKey: qk.customers(params),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.outlet_id) p.set("outlet_id", params.outlet_id);
      if (params?.date_from) p.set("date_from", params.date_from);
      if (params?.date_to) p.set("date_to", params.date_to);
      if (params?.limit) p.set("limit", String(params.limit));
      if (params?.sort) p.set("sort", params.sort);
      const qs = p.toString();
      const res = await api().get(`${BASE}/customers${qs ? `?${qs}` : ""}`);
      return res.data as ReportResponse<CustomersReportData>;
    },
    placeholderData: keepPreviousData,
  });
}
