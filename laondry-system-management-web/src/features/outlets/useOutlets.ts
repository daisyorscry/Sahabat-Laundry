// src/features/outlets/useOutlets.ts
"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { FieldValues, UseFormSetError } from "react-hook-form";

import { AppAlert } from "@/components/alert/AlertContext";
import { api } from "@/lib/axios/api";

import { BackendResponse } from "../mutation";

export type Outlet = {
  id: string;
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address_line?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
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

export type OutletsListData = {
  items: Outlet[];
  pagination: Pagination;
  query: {
    q: string;
    is_active: boolean | null;
    sort: "created_at" | "updated_at" | "code" | "name" | "is_active";
    order: "asc" | "desc";
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ApiErr = AxiosError<BackendResponse<any>>;

const BASE = "/outlets";

// ----- Query Keys -----

export const qk = {
  all: ["outlets"] as const,
  list: (params?: Partial<ListParams>) => ["outlets", "list", params] as const,
  detail: (id?: string | null) => ["outlets", "detail", id] as const,
};

// ----- List params -----

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

// ----- Hooks: Queries -----

export function useOutletsList(params?: ListParams) {
  return useQuery<BackendResponse<OutletsListData>, ApiErr>({
    queryKey: qk.list(params),
    queryFn: async () => {
      const qs = toQuery(params).toString();
      const res = await api().get(`${BASE}${qs ? `?${qs}` : ""}`);
      return res.data as BackendResponse<OutletsListData>;
    },
    placeholderData: keepPreviousData,
  });
}

export function useOutletDetail(id?: string | null, enabled = true) {
  return useQuery<BackendResponse<Outlet>, ApiErr>({
    queryKey: qk.detail(id),
    queryFn: async () => {
      const res = await api().get(`${BASE}/${id}`);
      return res.data as BackendResponse<Outlet>;
    },
    enabled: !!id && enabled,
  });
}

// ----- Hooks: Mutations -----

export type CreateOutletPayload = {
  code: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address_line?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  is_active?: boolean;
};

export function useCreateOutlet<TFieldValues extends FieldValues = FieldValues>(opts?: {
  setError?: UseFormSetError<TFieldValues>;
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams; // agar invalidate konsisten dengan filter aktif
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<Outlet>, ApiErr, CreateOutletPayload>({
    mutationKey: ["outlets", "create"],
    mutationFn: async (payload) => {
      const res = await api().post(BASE, payload);
      return res.data as BackendResponse<Outlet>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Outlet dibuat",
          autoClose: 1600,
        });
      }
      // invalidate list & maybe detail
      await qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) });
      if (out?.data?.id) {
        await qc.invalidateQueries({ queryKey: qk.detail(out.data.id) });
      }
    },
    onError: (err) => {
      if (opts?.setError)
        // applyServerErrorsToForm(opts.setError, err.response?.data);
        AppAlert.show?.({
          type: "danger",
          title: "Gagal",
          message: err.response?.data?.message ?? "Gagal membuat outlet",
        });
    },
  });
}

export type UpdateOutletPayload = Partial<CreateOutletPayload>;

export function useUpdateOutlet<TFieldValues extends FieldValues = FieldValues>(opts?: {
  setError?: UseFormSetError<TFieldValues>;
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<Outlet>, ApiErr, { id: string; payload: UpdateOutletPayload }>(
    {
      mutationKey: ["outlets", "update"],
      mutationFn: async ({ id, payload }) => {
        const res = await api().patch(`${BASE}/${id}`, payload);
        return res.data as BackendResponse<Outlet>;
      },
      onSuccess: async (out) => {
        if (!opts?.suppressAlerts) {
          AppAlert.show?.({
            type: "success",
            title: "Berhasil",
            message: opts?.successMessage ?? out?.message ?? "Outlet diperbarui",
            autoClose: 1600,
          });
        }
        await Promise.all([
          qc.invalidateQueries({ queryKey: qk.detail(out?.data?.id) }),
          qc.invalidateQueries({ queryKey: qk.list(opts?.invalidateParams) }),
        ]);
      },
      onError: (err) => {
        if (opts?.setError)
          // applyServerErrorsToForm(opts.setError, err.response?.data);
          AppAlert.show?.({
            type: "danger",
            title: "Gagal",
            message: err.response?.data?.message ?? "Gagal memperbarui outlet",
          });
      },
    }
  );
}

export function useDeleteOutlet(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<{ id: string }>, ApiErr, { id: string }>({
    mutationKey: ["outlets", "delete"],
    mutationFn: async ({ id }) => {
      const res = await api().delete(`${BASE}/${id}`);
      return res.data as BackendResponse<{ id: string }>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Outlet dihapus",
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
        message: err.response?.data?.message ?? "Gagal menghapus outlet",
      });
    },
  });
}

export function useActivateOutlet(opts?: {
  successMessage?: string;
  suppressAlerts?: boolean;
  invalidateParams?: ListParams;
}) {
  const qc = useQueryClient();

  return useMutation<BackendResponse<Outlet>, ApiErr, { id: string; is_active: boolean }>({
    mutationKey: ["outlets", "activate"],
    mutationFn: async ({ id, is_active }) => {
      const res = await api().patch(`${BASE}/${id}/activate`, { is_active });
      return res.data as BackendResponse<Outlet>;
    },
    onSuccess: async (out) => {
      if (!opts?.suppressAlerts) {
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: opts?.successMessage ?? out?.message ?? "Status outlet diperbarui",
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
