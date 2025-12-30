"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { FieldValues, UseFormSetError } from "react-hook-form";

import { AppAlert } from "@/components/alert/AlertContext";
import { api } from "@/lib/axios/api";

import { applyServerErrorsToForm, type BackendResponse } from "../mutation";

export type Id = string;

export type ServicePrice = {
  id: Id;
  service_id: Id;
  outlet_id: Id;
  member_tier: string | null;
  is_express: boolean;
  price: string | number;
  effective_start: string;
  effective_end: string | null;
  created_at: string;
  updated_at: string;

  // relations
  service?: {
    id: Id;
    code: string;
    name: string;
    pricing_model: "weight" | "piece";
  } | null;
  outlet?: {
    id: Id;
    code: string;
    name: string;
  } | null;
};


export type Pagination = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ServicePricesListData = {
  items: ServicePrice[];
  pagination: Pagination;
  query: {
    service_id?: Id;
    outlet_id?: Id;
    member_tier?: string | null;
    is_express?: boolean | null;
    active_at?: string | null;
    sort:
      | "effective_start"
      | "effective_end"
      | "price"
      | "created_at"
      | "updated_at"
      | "is_express"
      | "member_tier";
    order: "asc" | "desc";
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiErr = AxiosError<BackendResponse<any>>;

const BASE = "/service-prices";

export const qk = {
  all: ["service-prices"] as const,
  list: (params?: Partial<ListParams>) => ["service-prices", "list", params] as const,
  detail: (id?: string | null) => ["service-prices", "detail", id] as const,
};

export type ListParams = {
  service_id?: Id;
  outlet_id?: Id;
  member_tier?: string | null;
  is_express?: boolean | null;
  active_at?: string;
  sort?:
    | "effective_start"
    | "effective_end"
    | "price"
    | "created_at"
    | "updated_at"
    | "is_express"
    | "member_tier";
  order?: "asc" | "desc";
  per_page?: number;
  page?: number;
};

function toQuery(params?: ListParams) {
  const p = new URLSearchParams();
  if (!params) return p;
  if (params.service_id) p.set("service_id", params.service_id);
  if (params.outlet_id) p.set("outlet_id", params.outlet_id);
  if (Object.prototype.hasOwnProperty.call(params, "member_tier")) {
    p.set("member_tier", params.member_tier === null ? "null" : String(params.member_tier ?? ""));
  }
  if (typeof params.is_express === "boolean") p.set("is_express", String(params.is_express));
  if (params.active_at) p.set("active_at", params.active_at);
  if (params.sort) p.set("sort", params.sort);
  if (params.order) p.set("order", params.order);
  if (params.per_page) p.set("per_page", String(params.per_page));
  if (params.page) p.set("page", String(params.page));
  return p;
}

export function useServicePricesList(params?: ListParams) {
  return useQuery<BackendResponse<ServicePricesListData>, ApiErr>({
    queryKey: qk.list(params),
    queryFn: async () => {
      const qs = toQuery(params).toString();
      const res = await api().get(`${BASE}${qs ? `?${qs}` : ""}`);
      return res.data as BackendResponse<ServicePricesListData>;
    },
    placeholderData: keepPreviousData,
  });
}

export function useServicePriceDetail(id?: string | null, enabled = true) {
  return useQuery<BackendResponse<ServicePrice>, ApiErr>({
    queryKey: qk.detail(id),
    queryFn: async () => {
      const res = await api().get(`${BASE}/${id}`);
      return res.data as BackendResponse<ServicePrice>;
    },
    enabled: !!id && enabled,
  });
}

export type CreateServicePricePayload = {
  service_id: Id;
  outlet_id: Id;
  member_tier?: string | null;
  is_express: boolean;
  price: string | number;
  effective_start: string;
  effective_end?: string | null;
};

export function useCreateServicePrice<TFieldValues extends FieldValues = FieldValues>(opts?: {
  setError?: UseFormSetError<TFieldValues>;
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<ServicePrice>, ApiErr, CreateServicePricePayload>({
    mutationKey: ["service-prices", "create"],
    mutationFn: async (payload) => {
      const res = await api().post(BASE, payload);
      return res.data as BackendResponse<ServicePrice>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Harga dibuat",
          autoClose: 1600,
        });
      }
      await qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) });
      if (out?.data?.id) await qc.invalidateQueries({ queryKey: qk.detail(out.data.id) });
    },
    onError: (err) => {
      if (opts?.setError) {
        applyServerErrorsToForm(err, opts.setError);
      }
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "danger",
          title: "Gagal",
          message: err.response?.data?.message ?? "Gagal membuat harga",
        });
      }
    },
  });
}

export type UpdateServicePricePayload = Partial<CreateServicePricePayload>;

export function useUpdateServicePrice<TFieldValues extends FieldValues = FieldValues>(opts?: {
  setError?: UseFormSetError<TFieldValues>;
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<
    BackendResponse<ServicePrice>,
    ApiErr,
    { id: string; payload: UpdateServicePricePayload }
  >({
    mutationKey: ["service-prices", "update"],
    mutationFn: async ({ id, payload }) => {
      const res = await api().patch(`${BASE}/${id}`, payload);
      return res.data as BackendResponse<ServicePrice>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Harga diperbarui",
          autoClose: 1600,
        });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.detail(out?.data?.id) }),
        qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) }),
      ]);
    },
    onError: (err) => {
      if (opts?.setError) {
        applyServerErrorsToForm(err, opts.setError);
      }
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "danger",
          title: "Gagal",
          message: err.response?.data?.message ?? "Gagal memperbarui harga",
        });
      }
    },
  });
}

export function useDeleteServicePrice(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<{ id: string } | null>, ApiErr, { id: string }>({
    mutationKey: ["service-prices", "delete"],
    mutationFn: async ({ id }) => {
      const res = await api().delete(`${BASE}/${id}`);
      return res.data as BackendResponse<{ id: string } | null>;
    },
    onSuccess: async (out, { id }) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Harga dihapus",
          autoClose: 1600,
        });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) }),
        qc.invalidateQueries({ queryKey: qk.detail(out?.data ? out.data.id : id) }),
      ]);
    },
    onError: (err) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "danger",
          title: "Gagal",
          message: err.response?.data?.message ?? "Gagal menghapus harga",
        });
      }
    },
  });
}

export type BulkImportResult = {
  total?: number;
  inserted?: number;
  skipped?: number;
  errors?: Array<{ row: number; message: string }>;
};

export function useBulkImportServicePrice(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<BulkImportResult>, ApiErr, { file: File }>({
    mutationKey: ["service-prices", "bulk"],
    mutationFn: async ({ file }) => {
      const form = new FormData();
      form.append("file", file);
      const res = await api().post(`${BASE}/bulk`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data as BackendResponse<BulkImportResult>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Bulk import diproses",
          autoClose: 1600,
        });
      }
      await qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) });
    },
    onError: (err) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "danger",
          title: "Gagal",
          message: err.response?.data?.message ?? "Gagal memproses bulk import",
        });
      }
    },
  });
}
