"use client";

import { PropsWithChildren, useEffect } from "react";

import { useAuth } from "@/lib/axios/secure";

export default function AuthHydrator({ token, children }: PropsWithChildren<{ token: string }>) {
  useEffect(() => {
    useAuth.setState({ accessToken: token });
  }, [token]);

  return <>{children}</>;
}
