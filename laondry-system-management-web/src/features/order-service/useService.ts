// utility service
"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { FieldValues, UseFormSetError } from "react-hook-form";

import { AppAlert } from "@/components/alert/AlertContext";
import { api } from "@/lib/axios/api";

import { fileToIconPathJson } from "../_utility/imagePayload";
import { applyServerErrorsToForm, type BackendResponse } from "../mutation";

export type Service = {
  id: string;
  category_id: string | null;
  code: string;
  name: string;
  description: string | null;
  pricing_model: "weight" | "piece";
  base_price: string | number;
  min_qty: string | number | null;
  est_duration_hours: number;
  is_express_available: boolean;
  is_active: boolean;
  icon_path: string;
  icon_url: string;
  created_at: string;
  updated_at: string;
  order_items_count?: number;
  category?: { id: string; code: string; name: string } | null;
  creator?: { id: string; name?: string | null; email?: string | null } | null;
  updater?: { id: string; name?: string | null; email?: string | null } | null;
  addons?: Array<{
    id: string;
    code: string;
    name: string;
    description: string | null;
    price: string | number;
    is_active: boolean;
    pivot?: { service_id: string; addon_id: string; is_required: boolean };
  }>;
  resolved_price?: {
    id: string;
    price: string | number;
    member_tier: string | null;
    effective_start: string | null;
    effective_end: string | null;
    is_express: boolean;
  } | null;
};

export type Addon = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  // rel pivot (opsional)
  pivot?: {
    is_required?: boolean;
  };
};

export type Pagination = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ServicesListData = {
  items: Service[];
  pagination: Pagination;
  query: {
    q: string;
    category_id: string | null;
    pricing_model: "weight" | "piece" | null;
    is_active: boolean | null;
    is_express_available: boolean | null;
    sort: Sortable;
    order: "asc" | "desc";
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiErr = AxiosError<BackendResponse<any>>;

const BASE = "/service";

export const qk = {
  all: ["services"] as const,
  list: (params?: Partial<ListParams>) => ["services", "list", params] as const,
  detail: (id?: string | null) => ["services", "detail", id] as const,
  addons: (serviceId?: string | null) => ["services", "addons", serviceId] as const,
};

export type Sortable =
  | "created_at"
  | "updated_at"
  | "code"
  | "name"
  | "pricing_model"
  | "is_active"
  | "is_express_available";

export type ListParams = {
  q?: string;
  category_id?: string | null;
  pricing_model?: "weight" | "piece" | null;
  is_active?: boolean | null;
  is_express_available?: boolean | null;
  sort?: Sortable;
  order?: "asc" | "desc";
  per_page?: number;
  page?: number;
};

function toQuery(params?: ListParams) {
  const p = new URLSearchParams();
  if (!params) return p;

  if (params.q) p.set("q", params.q);
  if (params.category_id) p.set("category_id", params.category_id);
  if (params.pricing_model) p.set("pricing_model", params.pricing_model);
  if (typeof params.is_active === "boolean") p.set("is_active", String(params.is_active));
  if (typeof params.is_express_available === "boolean")
    p.set("is_express_available", String(params.is_express_available));
  if (params.sort) p.set("sort", params.sort);
  if (params.order) p.set("order", params.order);
  if (params.per_page) p.set("per_page", String(params.per_page));
  if (params.page) p.set("page", String(params.page));

  return p;
}

export function useServicesList(params?: ListParams) {
  return useQuery<BackendResponse<ServicesListData>, ApiErr>({
    queryKey: qk.list(params),
    queryFn: async () => {
      const qs = toQuery(params).toString();
      const res = await api().get(`${BASE}${qs ? `?${qs}` : ""}`);
      return res.data as BackendResponse<ServicesListData>;
    },
    placeholderData: keepPreviousData,
  });
}

export function useServiceDetail(id?: string | null, enabled = true) {
  return useQuery<BackendResponse<Service>, ApiErr>({
    queryKey: qk.detail(id),
    queryFn: async () => {
      const res = await api().get(`${BASE}/${id}`);
      return res.data as BackendResponse<Service>;
    },
    enabled: !!id && enabled,
  });
}

export type ServiceAddonInput = { addon_id: string; is_required?: boolean };
export type ServicePriceInput = {
  id?: string;
  outlet_id: string;
  member_tier?: string | null;
  price: number | string;
  effective_start: string;
  effective_end?: string | null;
  is_express?: boolean;
};

export type CreateServicePayload = {
  code: string;
  category_id: string;
  name: string;
  description?: string | null;
  pricing_model: "weight" | "piece";
  base_price?: number | string;
  min_qty?: number | string;
  est_duration_hours?: number;
  is_express_available?: boolean;
  is_active?: boolean;
  iconFile?: File;

  addons?: ServiceAddonInput[];
  prices?: ServicePriceInput[];
};

export type UpdateServicePayload = Partial<Omit<CreateServicePayload, "category_id">> & {
  category_id?: string;
  remove_price_ids?: string[];
};

export function useCreateService<TFieldValues extends FieldValues = FieldValues>(opts?: {
  setError?: UseFormSetError<TFieldValues>;
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<Service>, ApiErr, CreateServicePayload>({
    mutationKey: ["services", "create"],
    mutationFn: async (payload) => {
      const { iconFile, ...rest } = payload;

      const body: Record<string, unknown> = { ...rest };
      if (iconFile instanceof File) {
        body.icon_path = await fileToIconPathJson(iconFile);
      }
      
      const res = await api().post(BASE, payload);
      return res.data as BackendResponse<Service>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Service dibuat",
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
        applyServerErrorsToForm(err, opts.setError);
      }
      AppAlert.show?.({
        type: "danger",
        title: "Gagal",
        message: err.response?.data?.message ?? "Gagal membuat service",
      });
    },
  });
}

export function useUpdateService<TFieldValues extends FieldValues = FieldValues>(opts?: {
  setError?: UseFormSetError<TFieldValues>;
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<
    BackendResponse<Service>,
    ApiErr,
    { id: string; payload: UpdateServicePayload }
  >({
    mutationKey: ["services", "update"],
    mutationFn: async ({ id, payload }) => {
      const { iconFile, ...rest } = payload;
      const body: Record<string, unknown> = { ...rest };

      if (iconFile instanceof File) {
        body.icon_path = await fileToIconPathJson(iconFile);
      }

      const res = await api().patch(`${BASE}/${id}`, payload);
      return res.data as BackendResponse<Service>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Service diperbarui",
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
        message: err.response?.data?.message ?? "Gagal memperbarui service",
      });
    },
  });
}

export function useDeleteService(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<{ id: string }>, ApiErr, { id: string }>({
    mutationKey: ["services", "delete"],
    mutationFn: async ({ id }) => {
      const res = await api().delete(`${BASE}/${id}`);
      return res.data as BackendResponse<{ id: string }>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Service dihapus",
          autoClose: 1600,
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
        message: err.response?.data?.message ?? "Gagal menghapus service",
      });
    },
  });
}

export function useActivateService(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<Service>, ApiErr, { id: string; is_active: boolean }>({
    mutationKey: ["services", "activate"],
    mutationFn: async ({ id, is_active }) => {
      const res = await api().patch(`${BASE}/${id}/activate`, { is_active });
      return res.data as BackendResponse<Service>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Status service diperbarui",
          autoClose: 1400,
        });
      }
      await Promise.all([
        qc.invalidateQueries({ queryKey: qk.detail(out?.data?.id) }),
        qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) }),
      ]);
    },
    onError: (err) => {
      AppAlert.show?.({
        type: "danger",
        title: "Gagal",
        message: err.response?.data?.message ?? "Gagal memperbarui status",
      });
    },
  });
}

// ===== Addons APIs (opsional, sesuai rute yang kamu punya) =====

export function useServiceAddons(serviceId?: string | null, enabled = true) {
  return useQuery<BackendResponse<Addon[]>, ApiErr>({
    queryKey: qk.addons(serviceId),
    queryFn: async () => {
      const res = await api().get(`${BASE}/${serviceId}/addons`);
      return res.data as BackendResponse<Addon[]>;
    },
    enabled: !!serviceId && enabled,
  });
}

// sync seluruh addons (PUT /{service}/addons) -> kirim array id & flag
export type SyncServiceAddonsPayload = Array<{ addon_id: string; is_required?: boolean }>;

export function useSyncServiceAddons(opts?: { successMessage?: string; suppressAlerts?: boolean }) {
  const qc = useQueryClient();

  return useMutation<
    BackendResponse<Addon[]>,
    ApiErr,
    { serviceId: string; payload: SyncServiceAddonsPayload }
  >({
    mutationKey: ["services", "addons", "sync"],
    mutationFn: async ({ serviceId, payload }) => {
      const res = await api().put(`${BASE}/${serviceId}/addons`, payload);
      return res.data as BackendResponse<Addon[]>;
    },
    onSuccess: async (out, vars) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Addons diperbarui",
          autoClose: 1400,
        });
      }
      await qc.invalidateQueries({ queryKey: qk.addons(vars.serviceId) });
    },
    onError: (err) => {
      AppAlert.show?.({
        type: "danger",
        title: "Gagal",
        message: err.response?.data?.message ?? "Gagal menyinkronkan addons",
      });
    },
  });
}

// attach single addon
export function useAttachServiceAddon(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
}) {
  const qc = useQueryClient();

  return useMutation<
    BackendResponse<Addon[]>,
    ApiErr,
    { serviceId: string; addonId: string; is_required?: boolean }
  >({
    mutationKey: ["services", "addons", "attach"],
    mutationFn: async ({ serviceId, addonId, is_required }) => {
      const res = await api().post(`${BASE}/${serviceId}/addons/${addonId}`, { is_required });
      return res.data as BackendResponse<Addon[]>;
    },
    onSuccess: async (out, vars) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Addon ditambahkan",
          autoClose: 1200,
        });
      }
      await qc.invalidateQueries({ queryKey: qk.addons(vars.serviceId) });
    },
    onError: (err) => {
      AppAlert.show?.({
        type: "danger",
        title: "Gagal",
        message: err.response?.data?.message ?? "Gagal menambahkan addon",
      });
    },
  });
}

// detach single addon
export function useDetachServiceAddon(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<Addon[]>, ApiErr, { serviceId: string; addonId: string }>({
    mutationKey: ["services", "addons", "detach"],
    mutationFn: async ({ serviceId, addonId }) => {
      const res = await api().delete(`${BASE}/${serviceId}/addons/${addonId}`);
      return res.data as BackendResponse<Addon[]>;
    },
    onSuccess: async (out, vars) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Addon dihapus",
          autoClose: 1200,
        });
      }
      await qc.invalidateQueries({ queryKey: qk.addons(vars.serviceId) });
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
