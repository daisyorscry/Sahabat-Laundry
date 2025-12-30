// app/provider.tsx
"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AlertProvider } from "@/components/alert/AlertContext";
import { ThemeProvider } from "./theme-provider";

type Mode = "light" | "dark" | "system";

export default function Providers({
  children,
  initialMode,
}: {
  children: ReactNode;
  initialMode: Mode;
}) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <AlertProvider>
        <ThemeProvider initialMode={initialMode}>{children}</ThemeProvider>
      </AlertProvider>
    </QueryClientProvider>
  );
}
