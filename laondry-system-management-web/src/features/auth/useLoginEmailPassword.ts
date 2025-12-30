// useLoginEmailPassword.ts
"use client";

import { useMutation } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import type { FieldValues, UseFormSetError } from "react-hook-form";

import { AppAlert } from "@/components/alert/AlertContext";
import { api } from "@/lib/axios/api";

import { applyServerErrorsToForm, type BackendResponse } from "../mutation";

// useLoginEmailPassword.ts

export type LoginEmailPayload = { email: string; password: string };
export type OtpMeta = {
  otp_sent?: boolean;
  otp_expires_at?: string | null;
  retry_after_sec?: number;
} | null;
export type LoginEmailResponse = BackendResponse<OtpMeta> & {
  timestamp?: string;
};

export function useLoginEmailPassword<TFieldValues extends FieldValues = FieldValues>(opts?: {
  setError?: UseFormSetError<TFieldValues>;
  redirectTo?: string | null;
  successMessage?: string;
  suppressAlerts?: boolean;
}) {
  return useMutation<LoginEmailResponse, AxiosError<BackendResponse>, LoginEmailPayload>({
    mutationKey: ["auth", "login-email"],
    mutationFn: async (payload) => {
      const res = await api().post("/auth/login-email", payload);
      return res.data as LoginEmailResponse;
    },
    onSuccess: (out) => {
      if (!opts?.suppressAlerts) {
        const msg = opts?.successMessage ?? out?.message ?? "OTP telah dikirim ke email kamu.";
        AppAlert.show?.({
          type: "success",
          title: "OTP Dikirim",
          message: msg,
          autoClose: 1600,
        });
      }
      if (opts?.redirectTo) window.location.assign(opts.redirectTo);
    },
    onError: (err) => {
      if (opts?.setError && applyServerErrorsToForm(err, opts.setError)) return;
      if (!opts?.suppressAlerts) {
        const m = err.response?.data?.message ?? "Gagal mengirim OTP";
        AppAlert.show?.({ type: "danger", title: "Gagal", message: m });
      }
    },
  });
}
