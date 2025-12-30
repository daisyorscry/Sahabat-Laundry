"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { FieldValues, UseFormSetError } from "react-hook-form";

import { AppAlert } from "@/components/alert/AlertContext";
import { api } from "@/lib/axios/api";

import type { BackendResponse } from "../mutation";

export type CustomerAddress = {
  id: string;
  user_id: string;
  label: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

export type CustomerStatus = {
  id: number;
  code: string;
  description: string;
};

export type Customer = {
  id: string;
  full_name: string;
  email?: string | null;
  phone_number: string;
  is_active: boolean;
  is_member: boolean;
  balance: string;
  customer_status_id?: number | null;
  banned_reason?: string | null;
  avatar_url?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  customer_status?: CustomerStatus | null;
  addresses?: CustomerAddress[];
  addresses_count?: number;
  orders_count?: number;
  roles?: Array<{ id: string; slug: string; name: string }>;
};

export type Pagination = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type CustomersListData = {
  items: Customer[];
  pagination: Pagination;
  query: {
    q: string;
    isActive: boolean | null;
    isMember: boolean | null;
    statusId: number | null;
    sort: string;
    order: "asc" | "desc";
  };
};

export type CustomerStatistics = {
  customer_id: string;
  customer_name: string;
  total_orders: number;
  total_spending: number;
  average_order_value: number;
  completed_orders: number;
  pending_orders: number;
  cancelled_orders: number;
  current_balance: number;
  is_member: boolean;
  member_since: string;
  last_order_date?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiErr = AxiosError<BackendResponse<any>>;

const BASE = "/customers";

export const qk = {
  all: ["customers"] as const,
  list: (params?: Partial<ListParams>) => ["customers", "list", params] as const,
  detail: (id?: string | null) => ["customers", "detail", id] as const,
  statistics: (id?: string | null) => ["customers", "statistics", id] as const,
  orders: (id?: string | null, params?: Partial<OrdersParams>) =>
    ["customers", "orders", id, params] as const,
};

export type ListParams = {
  q?: string;
  is_active?: boolean | null;
  is_member?: boolean | null;
  customer_status_id?: number | null;
  sort?: string;
  order?: "asc" | "desc";
  per_page?: number;
  page?: number;
};

function toQuery(params?: ListParams) {
  const p = new URLSearchParams();
  if (!params) return p;
  if (params.q) p.set("q", params.q);
  if (typeof params.is_active === "boolean") p.set("is_active", String(params.is_active));
  if (typeof params.is_member === "boolean") p.set("is_member", String(params.is_member));
  if (params.customer_status_id) p.set("customer_status_id", String(params.customer_status_id));
  if (params.sort) p.set("sort", params.sort);
  if (params.order) p.set("order", params.order);
  if (params.per_page) p.set("per_page", String(params.per_page));
  if (params.page) p.set("page", String(params.page));
  return p;
}

export function useCustomersList(params?: ListParams) {
  return useQuery<BackendResponse<CustomersListData>, ApiErr>({
    queryKey: qk.list(params),
    queryFn: async () => {
      const qs = toQuery(params).toString();
      const res = await api().get(`${BASE}${qs ? `?${qs}` : ""}`);
      return res.data as BackendResponse<CustomersListData>;
    },
    placeholderData: keepPreviousData,
  });
}

export function useCustomerDetail(id?: string | null, enabled = true, withOrders = false) {
  return useQuery<BackendResponse<Customer>, ApiErr>({
    queryKey: qk.detail(id),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (withOrders) {
        params.set("with_orders", "true");
        params.set("order_limit", "10");
      }
      const qs = params.toString();
      const res = await api().get(`${BASE}/${id}${qs ? `?${qs}` : ""}`);
      return res.data as BackendResponse<Customer>;
    },
    enabled: !!id && enabled,
  });
}

export function useCustomerStatistics(id?: string | null, enabled = true) {
  return useQuery<BackendResponse<CustomerStatistics>, ApiErr>({
    queryKey: qk.statistics(id),
    queryFn: async () => {
      const res = await api().get(`${BASE}/${id}/statistics`);
      return res.data as BackendResponse<CustomerStatistics>;
    },
    enabled: !!id && enabled,
  });
}

export type OrdersParams = {
  status?: string;
  date_from?: string;
  date_to?: string;
  per_page?: number;
  page?: number;
};

export function useCustomerOrders(id?: string | null, params?: OrdersParams, enabled = true) {
  return useQuery({
    queryKey: qk.orders(id, params),
    queryFn: async () => {
      const p = new URLSearchParams();
      if (params?.status) p.set("status", params.status);
      if (params?.date_from) p.set("date_from", params.date_from);
      if (params?.date_to) p.set("date_to", params.date_to);
      if (params?.per_page) p.set("per_page", String(params.per_page));
      if (params?.page) p.set("page", String(params.page));
      const qs = p.toString();
      const res = await api().get(`${BASE}/${id}/orders${qs ? `?${qs}` : ""}`);
      return res.data;
    },
    enabled: !!id && enabled,
  });
}

export type CreateCustomerPayload = {
  full_name: string;
  email?: string | null;
  phone_number: string;
  password?: string | null;
  pin?: string | null;
  is_active?: boolean;
  is_member?: boolean;
  balance?: number;
  customer_status_id?: number | null;
  addresses?: Array<{
    label?: string;
    address: string;
    latitude?: number | null;
    longitude?: number | null;
    is_primary?: boolean;
  }>;
};

export function useCreateCustomer<TFieldValues extends FieldValues = FieldValues>(opts?: {
  setError?: UseFormSetError<TFieldValues>;
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<Customer>, ApiErr, CreateCustomerPayload>({
    mutationKey: ["customers", "create"],
    mutationFn: async (payload) => {
      const res = await api().post(BASE, payload);
      return res.data as BackendResponse<Customer>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Customer berhasil dibuat",
          autoClose: 1600,
        });
      }
      await qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) });
      if (out?.data?.id) {
        await qc.invalidateQueries({ queryKey: qk.detail(out.data.id) });
      }
    },
    onError: (err) => {
      if (opts?.setError) {
        // applyServerErrorsToForm(opts.setError, err.response?.data);
      }
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "danger",
          title: "Gagal",
          message: err.response?.data?.message ?? "Gagal membuat customer",
        });
      }
    },
  });
}

export type UpdateCustomerPayload = Partial<
  Omit<CreateCustomerPayload, "addresses"> & {
    banned_reason?: string | null;
  }
>;

export function useUpdateCustomer<TFieldValues extends FieldValues = FieldValues>(opts?: {
  setError?: UseFormSetError<TFieldValues>;
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<Customer>, ApiErr, { id: string; payload: UpdateCustomerPayload }>({
    mutationKey: ["customers", "update"],
    mutationFn: async ({ id, payload }) => {
      const res = await api().patch(`${BASE}/${id}`, payload);
      return res.data as BackendResponse<Customer>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Customer diperbarui",
          autoClose: 1600,
        });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.detail(out?.data?.id) }),
        qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) }),
        qc.invalidateQueries({ queryKey: qk.statistics(out?.data?.id) }),
      ]);
    },
    onError: (err) => {
      if (opts?.setError) {
        // applyServerErrorsToForm(opts.setError, err.response?.data);
      }
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "danger",
          title: "Gagal",
          message: err.response?.data?.message ?? "Gagal memperbarui customer",
        });
      }
    },
  });
}

export function useDeleteCustomer(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<{ id: string }>, ApiErr, { id: string }>({
    mutationKey: ["customers", "delete"],
    mutationFn: async ({ id }) => {
      const res = await api().delete(`${BASE}/${id}`);
      return res.data as BackendResponse<{ id: string }>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Customer dihapus",
          autoClose: 1600,
        });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) }),
        qc.invalidateQueries({ queryKey: qk.detail(out?.data?.id) }),
      ]);
    },
    onError: (err) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "danger",
          title: "Gagal",
          message: err.response?.data?.message ?? "Gagal menghapus customer",
        });
      }
    },
  });
}

export function useBanCustomer(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<
    BackendResponse<Customer>,
    ApiErr,
    { id: string; banned_reason: string }
  >({
    mutationKey: ["customers", "ban"],
    mutationFn: async ({ id, banned_reason }) => {
      const res = await api().post(`${BASE}/${id}/ban`, { banned_reason });
      return res.data as BackendResponse<Customer>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Customer di-ban",
          autoClose: 1600,
        });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.detail(out?.data?.id) }),
        qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) }),
      ]);
    },
    onError: (err) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "danger",
          title: "Gagal",
          message: err.response?.data?.message ?? "Gagal ban customer",
        });
      }
    },
  });
}

export function useUnbanCustomer(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<Customer>, ApiErr, { id: string }>({
    mutationKey: ["customers", "unban"],
    mutationFn: async ({ id }) => {
      const res = await api().post(`${BASE}/${id}/unban`);
      return res.data as BackendResponse<Customer>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Customer di-unban",
          autoClose: 1600,
        });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.detail(out?.data?.id) }),
        qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) }),
      ]);
    },
    onError: (err) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "danger",
          title: "Gagal",
          message: err.response?.data?.message ?? "Gagal unban customer",
        });
      }
    },
  });
}

export function useAdjustBalance(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<
    BackendResponse<Customer>,
    ApiErr,
    { id: string; amount: number; type: "topup" | "deduct"; note?: string }
  >({
    mutationKey: ["customers", "adjust-balance"],
    mutationFn: async ({ id, amount, type, note }) => {
      const res = await api().patch(`${BASE}/${id}/balance`, { amount, type, note });
      return res.data as BackendResponse<Customer>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Balance customer diperbarui",
          autoClose: 1600,
        });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.detail(out?.data?.id) }),
        qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) }),
        qc.invalidateQueries({ queryKey: qk.statistics(out?.data?.id) }),
      ]);
    },
    onError: (err) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "danger",
          title: "Gagal",
          message: err.response?.data?.message ?? "Gagal adjust balance",
        });
      }
    },
  });
}
