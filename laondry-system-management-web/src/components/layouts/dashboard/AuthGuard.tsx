"use client";

import { useRouter } from "next/navigation";
import { PropsWithChildren, useEffect, useState } from "react";

import { getAccessTokenSync, useAuth } from "@/lib/axios/secure";

export default function AuthGuard({ children }: PropsWithChildren) {
  const router = useRouter();
  const token = useAuth((s) => s.accessToken);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = token ?? getAccessTokenSync();
    if (!t) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [token, router]);

  if (!ready) return null;
  return <>{children}</>;
}
