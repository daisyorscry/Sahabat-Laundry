"use client";

import type { AxiosError } from "axios";
import { type FieldValues, type Path, type UseFormSetError } from "react-hook-form";

export type BackendResponse<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T | null;
  errors?: Record<string, string[] | string>;
};

export function applyServerErrorsToForm<TFieldValues extends FieldValues>(
  error: AxiosError<BackendResponse>,
  setError: UseFormSetError<TFieldValues>
): boolean {
  const status = error.response?.status;
  const errors = error.response?.data?.errors;
  if (status === 422 && errors) {
    for (const [field, msgs] of Object.entries(errors)) {
      const message = Array.isArray(msgs) ? msgs[0] : String(msgs ?? "Tidak valid");
      setError(field as Path<TFieldValues>, { type: "server", message });
    }
    return true;
  }
  return false;
}

export type BaseOptions<TFieldValues extends FieldValues = FieldValues> = {
  setError?: UseFormSetError<TFieldValues>;
  redirectTo?: string | null;
  successMessage?: string;
  suppressAlerts?: boolean;
  onSuccess?: (out: BackendResponse) => void;
  onError?: (err: AxiosError<BackendResponse>) => void;
};

/** Opsional: variasi spesifik fitur bisa extend BaseOptions */
export type OtpOptions<TFieldValues extends FieldValues = FieldValues> =
  BaseOptions<TFieldValues> & { onOtpSent?: (email: string) => void };

export type PhoneLoginOptions<TFieldValues extends FieldValues = FieldValues> =
  BaseOptions<TFieldValues> & { phoneFieldKey?: "phone" | "phone_number" };
