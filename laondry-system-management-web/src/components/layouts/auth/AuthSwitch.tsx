"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useMemo } from "react";

type Props = {
  loginHref?: string;
  registerHref?: string;
};

export default function AuthSwitch({ loginHref = "/login", registerHref = "/register" }: Props) {
  const pathname = usePathname() || "";
  const search = useSearchParams();

  const isOnRegister = useMemo(() => /(^|\/)register(\/|$)/.test(pathname), [pathname]);

  const to = isOnRegister ? loginHref : registerHref;

  const next = search?.get("next");
  const href = next ? `${to}?next=${encodeURIComponent(next)}` : to;

  const labelText = isOnRegister ? <>Sudah punya akun?</> : <>Belum punya akun?</>;

  const linkText = isOnRegister ? "Login" : "Daftar";

  return (
    <div className="mx-4 my-2 mb-6 flex items-center justify-between">
      <div className="text-sm text-slate-600 dark:text-slate-300">
        {labelText}
        <Link
          href={href}
          className="ml-1 text-sm font-semibold text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white"
        >
          {linkText}
        </Link>
      </div>
    </div>
  );
}
