// src/features/auth/useLoginPhonePin.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { type FieldValues, type UseFormSetError } from "react-hook-form";

import { AppAlert } from "@/components/alert/AlertContext";
import { api } from "@/lib/axios/api";
import { applyTokens } from "@/lib/axios/refresh";

import { applyServerErrorsToForm, type BackendResponse } from "../mutation";

// src/features/auth/useLoginPhonePin.ts

export type LoginPhonePinPayload = { phone: string; pin: string };

export type LoginData = {
  access_token?: string;
  access_token_expires_at?: string | null;
  refresh_token?: string;
  refresh_token_expires_at?: string | null;
  user?: Record<string, unknown>;
} | null;

export type LoginPhoneResponse = BackendResponse<LoginData> & {
  timestamp?: string;
};

type Options<TFieldValues extends FieldValues> = {
  setError?: UseFormSetError<TFieldValues>;
  redirectTo?: string | null;
  phoneFieldKey?: "phone" | "phone_number";
  successMessage?: string;
  suppressAlerts?: boolean;
};

export function useLoginPhonePin<TFieldValues extends FieldValues = FieldValues>(
  opts?: Options<TFieldValues>
) {
  const router = useRouter();

  return useMutation<LoginPhoneResponse, AxiosError<BackendResponse>, LoginPhonePinPayload>({
    mutationKey: ["auth", "login-phone"],
    mutationFn: async (payload) => {
      const body =
        (opts?.phoneFieldKey ?? "phone") === "phone_number"
          ? { phone_number: payload.phone, pin: payload.pin }
          : { phone: payload.phone, pin: payload.pin };
      const res = await api().post("/auth/login", body);
      return res.data as LoginPhoneResponse;
    },

    onSuccess: async (out) => {
      const at = out.data?.access_token ?? (out as any)?.token ?? null;
      const exp = out.data?.access_token_expires_at ?? (out as any)?.expires_at ?? null;
      if (at) await applyTokens(at, exp);

      if (!opts?.suppressAlerts) {
        const msg = opts?.successMessage ?? out?.message ?? "Login berhasil";
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: msg,
          autoClose: 1600,
        });
      }
      if (opts?.redirectTo !== null) router.replace(opts?.redirectTo ?? "/");
    },

    onError: (err) => {
      if (opts?.setError && applyServerErrorsToForm(err, opts.setError)) return;
      if (!opts?.suppressAlerts) {
        const m = err.response?.data?.message ?? "Login gagal";
        AppAlert.show?.({ type: "danger", title: "Gagal", message: m });
      }
    },
  });
}
