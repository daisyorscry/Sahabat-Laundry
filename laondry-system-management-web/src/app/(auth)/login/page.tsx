"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import FormRenderer from "@/components/form/FormRenderer";
import { FieldConfig } from "@/components/form/types";
import { useLoginEmailPassword } from "@/features/auth/useLoginEmailPassword";
import { useVerifyOtp } from "@/features/auth/useVerifyOtp";

const emailSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Min 6 karakter"),
});
type EmailForm = z.infer<typeof emailSchema>;

const otpSchema = z.object({
  identity: z.string().email(),
  otp: z.string().regex(/^\d{6}$/, "OTP 6 digit"),
});
type OtpForm = z.infer<typeof otpSchema>;

const emailFields: Array<FieldConfig<EmailForm>> = [
  { type: "email", name: "email", label: "Email", placeholder: "nama@contoh.com" },
  { type: "password", name: "password", label: "Password", placeholder: "••••••" },
];

const otpFields: Array<FieldConfig<OtpForm>> = [
  { type: "email", name: "identity", label: "Email", placeholder: "nama@contoh.com" },
  { type: "pin", name: "otp", label: "OTP", length: 6, placeholder: "123456" },
];

export default function LoginPage() {
  const [tab, setTab] = useState<"email" | "otp">("email");
  const [emailForOtp, setEmailForOtp] = useState<string>("");

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    mode: "onChange",
    defaultValues: { email: "daisyorscry@gmail.com", password: "Daisyorscry123^" },
  });
  const otpForm = useForm<OtpForm>({
    resolver: zodResolver(otpSchema),
    mode: "onChange",
    defaultValues: { identity: "", otp: "" },
  });

  const loginEmailMut = useLoginEmailPassword<EmailForm>({
    setError: emailForm.setError,
    redirectTo: null,
  });

  const verifyOtpMut = useVerifyOtp<OtpForm>({
    setError: otpForm.setError,
    redirectTo: "/dashboard",
  });

  const onLoginEmail = (vals: EmailForm) =>
    loginEmailMut.mutate(vals, {
      onSuccess: () => {
        setEmailForOtp(vals.email);
        otpForm.reset({ identity: vals.email, otp: "" });
        setTab("otp");
      },
    });

  const onVerifyOtp = (vals: OtpForm) => verifyOtpMut.mutate(vals);

  return (
    <main>
      <header className="mb-4">
        <h1 className="text-lg font-semibold">Masuk</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Masuk dengan Email & Password, lalu verifikasi OTP.
        </p>
      </header>

      {/* Tabs */}
      <div className="border-border border-border -slate-200 border-border -slate-800 mb-4 flex overflow-hidden rounded-lg border bg-slate-100 p-0.5 dark:border dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setTab("email")}
          className={[
            "flex-1 rounded-md px-3 py-2 text-sm font-medium",
            tab === "email"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
          ].join(" ")}
        >
          Email + Password
        </button>
        <button
          type="button"
          onClick={() => setTab("otp")}
          disabled={!emailForOtp && tab !== "otp"}
          className={[
            "flex-1 rounded-md px-3 py-2 text-sm font-medium",
            tab === "otp"
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
            !emailForOtp && tab !== "otp" ? "cursor-not-allowed opacity-50" : "",
          ].join(" ")}
          title={!emailForOtp ? "Isi email/password dulu" : undefined}
        >
          Verifikasi OTP
        </button>
      </div>

      {/* Panels */}
      {tab === "email" && (
        <section>
          <FormRenderer
            control={emailForm.control}
            fields={emailFields}
            layout={{ mode: "grid", cols: { base: 1 }, gap: "gap-4" }}
          />
          <div className="mt-4 flex items-center justify-between">
            <a
              href="/forgot-password"
              className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              Lupa password?
            </a>
            <button
              type="button"
              onClick={emailForm.handleSubmit(onLoginEmail)}
              disabled={!emailForm.formState.isValid || loginEmailMut.isPending}
              className={[
                "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
                emailForm.formState.isValid && !loginEmailMut.isPending
                  ? "bg-sky-600 text-white hover:bg-sky-700"
                  : "cursor-not-allowed bg-slate-200 text-slate-500",
              ].join(" ")}
            >
              {loginEmailMut.isPending ? "Kirim OTP…" : "Lanjutkan"}
            </button>
          </div>
        </section>
      )}

      {tab === "otp" && (
        <section>
          <FormRenderer
            control={otpForm.control}
            fields={otpFields}
            layout={{
              mode: "grid",
              cols: { base: 1 },
              gap: "gap-4",
              itemClassName: (f) => (f.name === "identity" ? "md:col-span-full" : undefined),
            }}
          />

          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setTab("email")}
              className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              ← Ubah email/password
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const email = otpForm.getValues("identity") || emailForOtp;
                  if (!email) return;
                  // Resend OTP via endpoint yang sama (server abaikan password) atau sediakan /resend-otp
                  loginEmailMut.mutate({ email, password: "***" });
                }}
                className="border-border border-border -slate-300 border-border -slate-700 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 dark:border dark:hover:bg-slate-800"
              >
                Kirim ulang OTP
              </button>

              <button
                type="button"
                onClick={otpForm.handleSubmit(onVerifyOtp)}
                disabled={!otpForm.formState.isValid || verifyOtpMut.isPending}
                className={[
                  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
                  otpForm.formState.isValid && !verifyOtpMut.isPending
                    ? "bg-sky-600 text-white hover:bg-sky-700"
                    : "cursor-not-allowed bg-slate-200 text-slate-500",
                ].join(" ")}
              >
                {verifyOtpMut.isPending ? "Verifikasi…" : "Verifikasi & Masuk"}
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
