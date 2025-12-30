// support service
"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { FieldValues, UseFormSetError } from "react-hook-form";

import { AppAlert } from "@/components/alert/AlertContext";
import { api } from "@/lib/axios/api";

import { fileToIconPathJson } from "../_utility/imagePayload";
import { applyServerErrorsToForm, type BackendResponse } from "../mutation";

// ===== Types =====

export type Addon = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  price: string;
  is_active: boolean;
  icon_path: string;
  icon_url: string;

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

export type Sortable = "created_at" | "updated_at" | "code" | "name" | "price" | "is_active";

export type ListParams = {
  q?: string;
  is_active?: boolean | null;
  sort?: Sortable;
  order?: "asc" | "desc";
  per_page?: number;
  page?: number;
};

export type AddonsListData = {
  items: Addon[];
  pagination: Pagination;
  query: {
    q: string;
    is_active: boolean | null;
    sort: Sortable;
    order: "asc" | "desc";
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiErr = AxiosError<BackendResponse<any>>;

// ===== Const =====

const BASE = "/addons";

export const qk = {
  all: ["addons"] as const,
  list: (params?: Partial<ListParams>) => ["addons", "list", params] as const,
  detail: (id?: string | null) => ["addons", "detail", id] as const,
};

// ===== Helpers =====

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

// ===== Queries =====

export function useAddonsList(params?: ListParams) {
  return useQuery<BackendResponse<AddonsListData>, ApiErr>({
    queryKey: qk.list(params),
    queryFn: async () => {
      const qs = toQuery(params).toString();
      const res = await api().get(`${BASE}${qs ? `?${qs}` : ""}`);
      return res.data as BackendResponse<AddonsListData>;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAddonDetail(id?: string | null, enabled = true) {
  return useQuery<BackendResponse<Addon>, ApiErr>({
    queryKey: qk.detail(id),
    queryFn: async () => {
      const res = await api().get(`${BASE}/${id}`);
      return res.data as BackendResponse<Addon>;
    },
    enabled: !!id && enabled,
  });
}

export type CreateAddonPayload = {
  code: string;
  name: string;
  description?: string | null;
  price?: number | string;
  is_active?: boolean;
  iconFile?: File | null;
};

export type UpdateAddonPayload = Partial<CreateAddonPayload>;

export function useCreateAddon<TFieldValues extends FieldValues = FieldValues>(opts?: {
  setError?: UseFormSetError<TFieldValues>;
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<Addon>, ApiErr, CreateAddonPayload>({
    mutationKey: ["addons", "create"],
    mutationFn: async (payload) => {
      const { iconFile, ...rest } = payload;

      const body: Record<string, unknown> = { ...rest };

      if (iconFile instanceof File) {
        body.icon_path = await fileToIconPathJson(iconFile);
      }

      const res = await api().post(BASE, body);
      return res.data as BackendResponse<Addon>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Addon dibuat",
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
      AppAlert.show?.({
        type: "danger",
        title: "Gagal",
        message: err.response?.data?.message ?? "Gagal membuat addon",
      });
    },
  });
}

export function useUpdateAddon<TFieldValues extends FieldValues = FieldValues>(opts?: {
  setError?: UseFormSetError<TFieldValues>;
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<Addon>, ApiErr, { id: string; payload: UpdateAddonPayload }>({
    mutationKey: ["addons", "update"],
    mutationFn: async ({ id, payload }) => {
      const { iconFile, ...rest } = payload;
      const body: Record<string, unknown> = { ...rest };
      if (iconFile instanceof File) {
        body.icon_path = await fileToIconPathJson(iconFile);
      }

      const res = await api().patch(`${BASE}/${id}`, payload);
      return res.data as BackendResponse<Addon>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Addon diperbarui",
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
      AppAlert.show?.({
        type: "danger",
        title: "Gagal",
        message: err.response?.data?.message ?? "Gagal memperbarui addon",
      });
    },
  });
}

export function useDeleteAddon(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<{ id: string }>, ApiErr, { id: string }>({
    mutationKey: ["addons", "delete"],
    mutationFn: async ({ id }) => {
      const res = await api().delete(`${BASE}/${id}`);
      return res.data as BackendResponse<{ id: string }>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Addon dihapus",
          autoClose: 1400,
        });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) }),
        qc.invalidateQueries({ queryKey: qk.detail(out?.data?.id) }),
      ]);
    },
    onError: (err) => {
      AppAlert.show?.({
        type: "danger",
        title: "Gagal",
        message: err.response?.data?.message ?? "Gagal menghapus addon",
      });
    },
  });
}

export function useActivateAddon(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<Addon>, ApiErr, { id: string; is_active: boolean }>({
    mutationKey: ["addons", "activate"],
    mutationFn: async ({ id, is_active }) => {
      const res = await api().patch(`${BASE}/${id}/activate`, { is_active });
      return res.data as BackendResponse<Addon>;
    },
    onSuccess: async (out, { id }) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Status addon diperbarui",
          autoClose: 1400,
        });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.detail(id) }),
        qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) }),
      ]);
    },
    onError: (err) => {
      AppAlert.show?.({
        type: "danger",
        title: "Gagal",
        message: err.response?.data?.message ?? "Gagal mengubah status addon",
      });
    },
  });
}
