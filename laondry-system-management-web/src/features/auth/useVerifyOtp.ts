// useVerifyOtp.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import type { FieldValues, UseFormSetError } from "react-hook-form";

import { AppAlert } from "@/components/alert/AlertContext";
import { api } from "@/lib/axios/api";
import { applyTokens } from "@/lib/axios/refresh";

import { type BackendResponse } from "../mutation";

// useVerifyOtp.ts

export type VerifyOtpPayload = { identity: string; otp: string };

export type TokenBundle = {
  access_token: string;
  access_token_expires_at?: string | null;
  refresh_token?: string | null;
  refresh_token_expires_at?: string | null;
  // beberapa backend kadang kirim 'expires_at'
  expires_at?: string | null;
};

export type VerifyOtpData = {
  token: TokenBundle;
  user?: Record<string, unknown>;
} | null;

export type VerifyOtpResponse = BackendResponse<VerifyOtpData> & {
  timestamp?: string;
};

type ApiErr = AxiosError<BackendResponse<unknown>>;

export function useVerifyOtp<TFieldValues extends FieldValues = FieldValues>(opts?: {
  setError?: UseFormSetError<TFieldValues>;
  redirectTo?: string | null;
  successMessage?: string;
  suppressAlerts?: boolean;
}) {
  const router = useRouter();

  return useMutation<VerifyOtpResponse, ApiErr, VerifyOtpPayload>({
    mutationKey: ["auth", "verify-otp"],
    mutationFn: async (payload) => {
      const res = await api().post("/auth/verify-otp", payload);
      return res.data as VerifyOtpResponse;
    },
    onSuccess: async (out) => {
      const token = out?.data?.token ?? (out as any)?.token ?? null;
      const at: string | null = token?.access_token ?? null;
      const exp: string | null = token?.access_token_expires_at ?? token?.expires_at ?? null;

      if (at) {
        await applyTokens(at, exp);
      }

      if (!opts?.suppressAlerts) {
        const msg = opts?.successMessage ?? out?.message ?? "Masuk berhasil";
        AppAlert.show?.({
          type: "success",
          title: "Berhasil",
          message: msg,
          autoClose: 1600,
        });
      }

      if (opts?.redirectTo !== null) {
        router.replace(opts?.redirectTo ?? "/");
      }
    },
    onError: (err) => {
      AppAlert.show?.({
        type: "danger",
        title: "Gagal",
        message: err.response?.data?.message ?? "Verifikasi OTP gagal",
      });
    },
  });
}
