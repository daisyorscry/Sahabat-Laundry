"use client";

import clsx from "clsx";
import * as React from "react";

export function PageContainer({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("mx-auto w-full px-4 py-6 md:px-6 md:py-8", className)} {...props} />;
}
