"use client";

import { useRouter } from "next/navigation";
import { PropsWithChildren, useEffect } from "react";

import { useAuth } from "@/lib/axios/secure";

export default function AuthPublicGate({ children }: PropsWithChildren) {
  const router = useRouter();

  const accessToken = useAuth((s) => s.accessToken);
  const hydrated = useAuth((s) => s._hasHydrated);

  useEffect(() => {
    if (hydrated && accessToken) {
      router.replace("/dashboard");
    }
  }, [hydrated, accessToken, router]);

  if (!hydrated) return null;

  if (accessToken) return null;

  return <>{children}</>;
}
