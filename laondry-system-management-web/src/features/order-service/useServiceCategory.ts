// for mapping service
"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { FieldValues, UseFormSetError } from "react-hook-form";

import { AppAlert } from "@/components/alert/AlertContext";
import { api } from "@/lib/axios/api";

import type { BackendResponse } from "../mutation";

export type ServiceCategory = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
};

export type Pagination = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ServiceCategoriesListData = {
  items: ServiceCategory[];
  pagination: Pagination;
  query: {
    q: string;
    isActive: boolean | null;
    sort: "created_at" | "updated_at" | "code" | "name" | "is_active";
    order: "asc" | "desc";
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiErr = AxiosError<BackendResponse<any>>;

const BASE = "/service-categories";

export const qk = {
  all: ["service-categories"] as const,
  list: (params?: Partial<ListParams>) => ["service-categories", "list", params] as const,
  detail: (id?: string | null) => ["service-categories", "detail", id] as const,
};

export type ListParams = {
  q?: string;
  is_active?: boolean | null;
  sort?: "created_at" | "updated_at" | "code" | "name" | "is_active";
  order?: "asc" | "desc";
  per_page?: number;
  page?: number;
};

function toQuery(params?: ListParams) {
  const p = new URLSearchParams();
  if (!params) return p;
  if (params.q) p.set("q", params.q);
  if (typeof params.is_active === "boolean") p.set("is_active", String(params.is_active));
  if (params.sort) p.set("sort", params.sort);
  if (params.order) p.set("order", params.order);
  if (params.per_page) p.set("per_page", String(params.per_page));
  if (params.page) p.set("page", String(params.page));
  return p;
}

export function useServiceCategoriesList(params?: ListParams) {
  return useQuery<BackendResponse<ServiceCategoriesListData>, ApiErr>({
    queryKey: qk.list(params),
    queryFn: async () => {
      const qs = toQuery(params).toString();
      const res = await api().get(`${BASE}${qs ? `?${qs}` : ""}`);
      return res.data as BackendResponse<ServiceCategoriesListData>;
    },
    placeholderData: keepPreviousData,
  });
}

export function useServiceCategoryDetail(id?: string | null, enabled = true) {
  return useQuery<BackendResponse<ServiceCategory>, ApiErr>({
    queryKey: qk.detail(id),
    queryFn: async () => {
      const res = await api().get(`${BASE}/${id}`);
      return res.data as BackendResponse<ServiceCategory>;
    },
    enabled: !!id && enabled,
  });
}

export type CreateServiceCategoryPayload = {
  code: string;
  name: string;
  description?: string | null;
  is_active?: boolean;
};

export function useCreateServiceCategory<TFieldValues extends FieldValues = FieldValues>(opts?: {
  setError?: UseFormSetError<TFieldValues>;
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<ServiceCategory>, ApiErr, CreateServiceCategoryPayload>({
    mutationKey: ["service-categories", "create"],
    mutationFn: async (payload) => {
      const res = await api().post(BASE, payload);
      return res.data as BackendResponse<ServiceCategory>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Kategori dibuat",
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
          message: err.response?.data?.message ?? "Gagal membuat kategori",
        });
      }
    },
  });
}

export type UpdateServiceCategoryPayload = Partial<CreateServiceCategoryPayload>;

export function useUpdateServiceCategory<TFieldValues extends FieldValues = FieldValues>(opts?: {
  setError?: UseFormSetError<TFieldValues>;
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<
    BackendResponse<ServiceCategory>,
    ApiErr,
    { id: string; payload: UpdateServiceCategoryPayload }
  >({
    mutationKey: ["service-categories", "update"],
    mutationFn: async ({ id, payload }) => {
      const res = await api().patch(`${BASE}/${id}`, payload);
      return res.data as BackendResponse<ServiceCategory>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Kategori diperbarui",
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
        // applyServerErrorsToForm(opts.setError, err.response?.data);
      }
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "danger",
          title: "Gagal",
          message: err.response?.data?.message ?? "Gagal memperbarui kategori",
        });
      }
    },
  });
}

export function useDeleteServiceCategory(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<{ id: string }>, ApiErr, { id: string }>({
    mutationKey: ["service-categories", "delete"],
    mutationFn: async ({ id }) => {
      const res = await api().delete(`${BASE}/${id}`);
      return res.data as BackendResponse<{ id: string }>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Kategori dihapus",
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
          message: err.response?.data?.message ?? "Gagal menghapus kategori",
        });
      }
    },
  });
}

export function useActivateServiceCategory(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<ServiceCategory>, ApiErr, { id: string; is_active: boolean }>({
    mutationKey: ["service-categories", "activate"],
    mutationFn: async ({ id, is_active }) => {
      const res = await api().patch(`${BASE}/${id}/activate`, { is_active });
      return res.data as BackendResponse<ServiceCategory>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Status kategori diperbarui",
          autoClose: 1400,
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
          message: err.response?.data?.message ?? "Gagal memperbarui status",
        });
      }
    },
  });
}
