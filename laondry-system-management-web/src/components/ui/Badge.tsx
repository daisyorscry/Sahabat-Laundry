// src/components/ui/Badge.tsx
"use client";

import clsx from "clsx";
import React from "react";

// src/components/ui/Badge.tsx

type Tone = "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";
type Size = "xs" | "sm" | "md";

/** variant & dot disisakan agar tidak breaking, tapi DIABAIKAN */
type _DeprecatedVariant = "solid" | "soft" | "outline";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  /** deprecated: diabaikan */
  variant?: _DeprecatedVariant;
  size?: Size;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
  /** deprecated: diabaikan */
  dot?: boolean;
  leftIcon?: React.ReactNode;
  uppercase?: boolean;
};

const SIZES: Record<Size, { px: string; py: string; text: string; gap: string; radius: string }> = {
  xs: {
    px: "px-2",
    py: "py-1",
    text: "text-[11px] font-semibold",
    gap: "gap-1",
    radius: "rounded-full",
  },
  sm: {
    px: "px-2.5",
    py: "py-1",
    text: "text-xs font-semibold",
    gap: "gap-1.5",
    radius: "rounded-full",
  },
  md: {
    px: "px-3",
    py: "py-2",
    text: "text-sm font-semibold",
    gap: "gap-2",
    radius: "rounded-full",
  },
};

const TONE: Record<
  Tone,
  {
    text: string;
    bg: string;
  }
> = {
  primary: { text: "text-blue-600 dark:text-blue-300", bg: "bg-blue-100 dark:bg-blue-900/40" },
  secondary: {
    text: "text-violet-600 dark:text-violet-300",
    bg: "bg-violet-100 dark:bg-violet-900/40",
  },
  success: { text: "text-green-700 dark:text-green-300", bg: "bg-green-50 dark:bg-green-900/40" },
  warning: { text: "text-amber-600 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-900/40" },
  danger: { text: "text-red-600 dark:text-red-300", bg: "bg-red-100 dark:bg-red-900/40" },
  neutral: { text: "text-slate-600 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800/40" },
};

export default function Badge({
  tone = "neutral",
  /** deprecated: diabaikan */ variant,
  size = "sm",
  rounded,
  /** deprecated: diabaikan */ dot,
  leftIcon,
  uppercase = true,
  className,
  children,
  ...rest
}: BadgeProps) {
  const s = SIZES[size];
  const t = TONE[tone];

  const base = clsx(
    "inline-flex items-center whitespace-nowrap select-none",
    s.px,
    s.py,
    s.text,
    s.gap,
    uppercase && "tracking-wide uppercase",
    rounded ? radiusMap(rounded) : s.radius,
    // Gaya tunggal: pastel pill tanpa border
    t.bg,
    t.text
  );

  return (
    <span className={clsx(base, className)} {...rest}>
      {leftIcon && <span className="inline-flex items-center">{leftIcon}</span>}
      <span className="truncate">{children}</span>
    </span>
  );
}

function radiusMap(r: NonNullable<BadgeProps["rounded"]>) {
  switch (r) {
    case "sm":
      return "rounded-sm";
    case "md":
      return "rounded-md";
    case "lg":
      return "rounded-lg";
    case "xl":
      return "rounded-xl";
    case "full":
      return "rounded-full";
    default:
      return "rounded-md";
  }
}
