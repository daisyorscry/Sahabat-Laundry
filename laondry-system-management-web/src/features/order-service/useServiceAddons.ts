// Pivot to addons to service
"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { AppAlert } from "@/components/alert/AlertContext";
import { api } from "@/lib/axios/api";
import type { BackendResponse } from "../mutation";

export type ServiceAddonPivot = {
  is_required?: boolean;
  attached_at?: string | null;
  updated_at?: string | null;
};

export type ServiceAddonItem = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  is_active: boolean;
  pivot?: ServiceAddonPivot;
};

export type Pagination = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ListParams = {
  q?: string;
  required_only?: boolean;
  per_page?: number;
  page?: number;
};

export type ServiceAddonsListData = {
  items: ServiceAddonItem[];
  pagination: Pagination;
  query: {
    q: string;
    required_only: boolean;
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiErr = AxiosError<BackendResponse<any>>;

// ===== Query Keys =====

export const qk = {
  all: (serviceId?: string | null) => ["services", serviceId, "addons"] as const,
  list: (serviceId?: string | null, params?: Partial<ListParams>) =>
    ["services", serviceId, "addons", "list", params] as const,
};

// ===== Helpers =====

function toQuery(params?: ListParams) {
  const p = new URLSearchParams();
  if (!params) return p;

  if (params.q) p.set("q", params.q);
  if (typeof params.required_only === "boolean")
    p.set("required_only", String(params.required_only));
  if (params.per_page) p.set("per_page", String(params.per_page));
  if (params.page) p.set("page", String(params.page));

  return p;
}

// ===== Queries =====

export function useServiceAddons(serviceId?: string | null, params?: ListParams) {
  return useQuery<BackendResponse<ServiceAddonsListData>, ApiErr>({
    queryKey: qk.list(serviceId, params),
    queryFn: async () => {
      const qs = toQuery(params).toString();
      const res = await api().get(`/services/${serviceId}/addons${qs ? `?${qs}` : ""}`);
      return res.data as BackendResponse<ServiceAddonsListData>;
    },
    enabled: !!serviceId,
    placeholderData: keepPreviousData,
  });
}

export type AttachServiceAddonPayload = {
  addon_id: string;
  is_required?: boolean;
};

export type UpdateServiceAddonPivotPayload = {
  is_required: boolean;
};

export function useAttachServiceAddon(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  serviceId?: string | null;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<
    BackendResponse<{
      service_id: string;
      addon_id: string;
      is_required: boolean;
      created: boolean;
    }>,
    ApiErr,
    { serviceId: string; payload: AttachServiceAddonPayload }
  >({
    mutationKey: ["services", "addons", "attach"],
    mutationFn: async ({ serviceId, payload }) => {
      const res = await api().post(`/services/${serviceId}/addons`, payload);
      return res.data;
    },
    onSuccess: async (out, vars) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message:
            opts?.successMessage ??
            (out?.data?.created ? "Addon dipasang ke service" : "Addon sudah terpasang"),
          autoClose: 1400,
        });
      }
      await qc.invalidateQueries({
        queryKey: qk.list(opts?.serviceId ?? vars.serviceId, opts?.invalidateParams),
      });
    },
    onError: (err) => {
      AppAlert.show?.({
        type: "danger",
        title: "Gagal",
        message: err.response?.data?.message ?? "Gagal memasang addon",
      });
    },
  });
}

export function useUpdateServiceAddonPivot(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  serviceId?: string | null;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<
    BackendResponse<{
      service_id: string;
      addon_id: string;
      is_required: boolean;
    }>,
    ApiErr,
    { serviceId: string; addonId: string; payload: UpdateServiceAddonPivotPayload }
  >({
    mutationKey: ["services", "addons", "pivot-update"],
    mutationFn: async ({ serviceId, addonId, payload }) => {
      const res = await api().patch(`/services/${serviceId}/addons/${addonId}`, payload);
      return res.data;
    },
    onSuccess: async (out, vars) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? "Pivot diperbarui",
          autoClose: 1200,
        });
      }
      await qc.invalidateQueries({
        queryKey: qk.list(opts?.serviceId ?? vars.serviceId, opts?.invalidateParams),
      });
    },
    onError: (err) => {
      AppAlert.show?.({
        type: "danger",
        title: "Gagal",
        message: err.response?.data?.message ?? "Gagal memperbarui pivot addon",
      });
    },
  });
}

export function useDetachServiceAddon(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  serviceId?: string | null;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<
    BackendResponse<{ service_id: string; addon_id: string; deleted: boolean }>,
    ApiErr,
    { serviceId: string; addonId: string }
  >({
    mutationKey: ["services", "addons", "detach"],
    mutationFn: async ({ serviceId, addonId }) => {
      const res = await api().delete(`/services/${serviceId}/addons/${addonId}`);
      return res.data;
    },
    onSuccess: async (out, vars) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message:
            opts?.successMessage ??
            (out?.data?.deleted ? "Addon dilepas dari service" : "Addon tidak terpasang"),
          autoClose: 1200,
        });
      }
      await qc.invalidateQueries({
        queryKey: qk.list(opts?.serviceId ?? vars.serviceId, opts?.invalidateParams),
      });
    },
    onError: (err) => {
      AppAlert.show?.({
        type: "danger",
        title: "Gagal",
        message: err.response?.data?.message ?? "Gagal melepas addon",
      });
    },
  });
}
