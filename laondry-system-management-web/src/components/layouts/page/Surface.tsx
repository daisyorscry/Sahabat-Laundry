"use client";

import clsx from "clsx";
import * as React from "react";

import { useFormTheme } from "@/components/theme/formTheme";

type SurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  rounded?: "md" | "lg" | "xl" | "2xl";
  useThemePopover?: boolean;
};

const PADDING = { none: "", sm: "p-3", md: "p-5", lg: "p-6", xl: "p-10" };
const RADIUS = { md: "rounded-md", lg: "rounded-lg", xl: "rounded-xl", "2xl": "rounded-2xl" };

const FALLBACK = "border border-border bg-card text-card-foreground shadow-sm";

export default function Surface({
  className,
  padding = "md",
  rounded = "2xl",
  useThemePopover = true,
  ...props
}: SurfaceProps) {
  const theme = useFormTheme();

  return (
    <section
      className={clsx(
        useThemePopover && theme?.popover ? theme.popover : FALLBACK,
        RADIUS[rounded],
        PADDING[padding],
        className
      )}
      {...props}
    />
  );
}
