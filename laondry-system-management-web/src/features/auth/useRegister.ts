"use client";

import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useRouter } from "next/navigation";

import { AppAlert } from "@/components/alert/AlertContext";
import { api } from "@/lib/axios/api";

import { applyServerErrorsToForm, type BackendResponse } from "../mutation";

export type RegisterPayload = {
  full_name: string;
  email: string;
  password: string;
  phone_number: string;
  pin: string;
  alamat: string;
  label_alamat: string;
};

export type RegisterData = null | { id?: string | number };
export type RegisterResponse = BackendResponse<RegisterData> & {
  timestamp?: string;
};

export function useRegister(opts?: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setError?: any;
  redirectTo?: string | null;
  successMessage?: string;
  suppressAlerts?: boolean;
}) {
  const router = useRouter();

  return useMutation<RegisterResponse, AxiosError<BackendResponse>, RegisterPayload>({
    mutationKey: ["auth", "register"],
    mutationFn: async (payload) => {
      const res = await api().post("/auth/register", payload);
      return res.data as RegisterResponse;
    },

    onSuccess: (out) => {
      if (!opts?.suppressAlerts) {
        const msg = opts?.successMessage ?? out?.message ?? "Registrasi berhasil. Silahkan login.";
        AppAlert.show?.({ type: "success", title: "Berhasil", message: msg, autoClose: 2000 });
      }
      if (opts?.redirectTo !== null) {
        router.push(opts?.redirectTo ?? "/login");
      }
    },

    onError: (err) => {
      if (opts?.setError && applyServerErrorsToForm(err, opts.setError)) return;
      if (!opts?.suppressAlerts) {
        const m = err.response?.data?.message ?? "Registrasi gagal";
        AppAlert.show?.({ type: "danger", title: "Gagal", message: m });
      }
    },
  });
}
