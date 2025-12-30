"use client";

import { useEffect, useState, type PropsWithChildren } from "react";
import { useRouter } from "next/navigation";

import LayoutShell from "@/components/layouts/dashboard/LayoutShell";
import ThemeToggle from "@/components/theme/ThemeButton";
import { getAccessTokenSync, useAuth } from "@/lib/axios/secure";

export default function AppLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  const hydrated = useAuth((s) => s._hasHydrated);
  const accessToken = useAuth((s) => s.accessToken);
  const [initialToken] = useState(() => getAccessTokenSync());

  useEffect(() => {
    if (hydrated && !accessToken && !initialToken) {
      router.replace("/login");
    }
  }, [hydrated, accessToken, initialToken, router]);

  if (!hydrated) return null;
  if (!accessToken && !initialToken) return null;

  return (
    <LayoutShell>
      {" "}
      <ThemeToggle />
      {children}
    </LayoutShell>
  );
}
