import { ReactNode } from "react";
import { cookies } from "next/headers";

import "./globals.css";

import ThemeToggle from "@/components/theme/ThemeButton";

import Providers from "./provider";

type Mode = "light" | "dark" | "system";

export const metadata = {
  title: "Sahabat Laundry - Jasa Laundry Antar Jemput & Express",
  description:
    "Layanan laundry antar jemput cepat, bersih, dan higienis. Express 24 jam, harga terjangkau, area terpilih di Kendari.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const cookieTheme = (cookieStore.get("theme")?.value as Mode | undefined) ?? "system";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const htmlProps: Record<string, any> = {
    lang: "id",
    suppressHydrationWarning: true,
  };
  if (cookieTheme === "light" || cookieTheme === "dark") {
    htmlProps["data-theme"] = cookieTheme;
  }

  return (
    <html {...htmlProps}>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className="bg-background text-foreground min-h-dvh antialiased">
        <Providers initialMode={cookieTheme}>
          {children}
          <ThemeToggle />
        </Providers>
      </body>
    </html>
  );
}
