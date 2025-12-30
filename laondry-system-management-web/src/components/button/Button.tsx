/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import clsx from "clsx";
import Link from "next/link";
import React, { memo, useMemo, useRef } from "react";

type Variant = "solid" | "outline" | "ghost" | "link" | "soft";
type Tone = "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";
type Size = "sm" | "md" | "lg";
type FontWeight = "light" | "normal" | "medium" | "semibold" | "bold" | "extrabold";
type RoundedSize = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    variant?: Variant;
    tone?: Tone;
    size?: Size;
    block?: boolean;
    rounded?: string;
    roundedSize?: RoundedSize;

    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    loading?: boolean;
    loadingText?: string;
    href?: string;
    as?: "button" | "a";
    debounceMs?: number;
    fontWeight?: FontWeight;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    uppercase?: boolean;
  };

const toneVars: Record<
  Tone,
  {
    bg: string;
    fgOnBg: string;
    fg: string;
    border: string;
    ring: string;
    softBg: string;
    softHoverBg: string;
    solidHoverBg: string;
  }
> = {
  primary: {
    bg: "var(--color-brand-500)",
    fgOnBg: "var(--color-on-primary)",
    fg: "var(--color-brand-500)",
    border: "var(--color-border)",
    ring: "var(--color-brand-400)",
    softBg: "color-mix(in oklab, var(--color-brand-500) 12%,  var(--color-background))",
    softHoverBg: "color-mix(in oklab, var(--color-brand-500) 18%, var(--color-background))",
    solidHoverBg: "color-mix(in oklab, var(--color-brand-500) 88%, var(--color-foreground))",
  },

  secondary: {
    bg: "var(--color-foreground)",
    fgOnBg: "var(--color-background)",
    fg: "var(--color-foreground)",
    border: "var(--color-border)",
    ring: "var(--color-border)",
    softBg: "color-mix(in oklab, var(--color-foreground) 8%, var(--color-background))",
    softHoverBg: "color-mix(in oklab, var(--color-foreground) 12%, var(--color-background))",
    solidHoverBg: "color-mix(in oklab, var(--color-foreground) 92%, var(--color-background))",
  },

  success: {
    bg: "var(--color-emerald-500)",
    fgOnBg: "var(--color-white)",
    fg: "var(--color-emerald-600)",
    border: "var(--color-emerald-400)",
    ring: "var(--color-emerald-400)",
    softBg: "color-mix(in oklab, var(--color-emerald-500) 12%, var(--color-background))",
    softHoverBg: "color-mix(in oklab, var(--color-emerald-500) 18%, var(--color-background))",
    solidHoverBg: "color-mix(in oklab, var(--color-emerald-500) 88%, var(--color-foreground))",
  },

  warning: {
    bg: "var(--color-amber-500)",
    fgOnBg: "var(--color-black)",
    fg: "var(--color-amber-700)",
    border: "var(--color-amber-400)",
    ring: "var(--color-amber-400)",
    softBg: "color-mix(in oklab, var(--color-amber-500) 12%, var(--color-background))",
    softHoverBg: "color-mix(in oklab, var(--color-amber-500) 18%, var(--color-background))",
    solidHoverBg: "color-mix(in oklab, var(--color-amber-500) 88%, var(--color-foreground))",
  },

  danger: {
    bg: "var(--color-rose-500)",
    fgOnBg: "var(--color-white)",
    fg: "var(--color-rose-600)",
    border: "var(--color-rose-400)",
    ring: "var(--color-rose-400)",
    softBg: "color-mix(in oklab, var(--color-rose-500) 12%, var(--color-background))",
    softHoverBg: "color-mix(in oklab, var(--color-rose-500) 18%, var(--color-background))",
    solidHoverBg: "color-mix(in oklab, var(--color-rose-500) 88%, var(--color-foreground))",
  },

  neutral: {
    bg: "var(--color-background)",
    fgOnBg: "var(--color-foreground)",
    fg: "var(--color-foreground)",
    border: "var(--color-border)",
    ring: "var(--color-border)",
    // netral: blend foreground tipis ke background (lebih konsisten di 2 mode)
    softBg: "color-mix(in oklab, var(--color-foreground) 6%, var(--color-background))",
    softHoverBg: "color-mix(in oklab, var(--color-foreground) 10%, var(--color-background))",
    // solid hover: latar naik sedikit kontras
    solidHoverBg: "color-mix(in oklab, var(--color-background) 94%, var(--color-foreground))",
  },
};

const SIZE: Record<
  Size,
  { px: string; py: string; gap: string; text: string; radius: string; spinner: number }
> = {
  sm: {
    px: "px-3",
    py: "py-1.5",
    gap: "gap-1.5",
    text: "text-[13px]",
    radius: "rounded-lg",
    spinner: 14,
  },
  md: { px: "px-4", py: "py-2", gap: "gap-2", text: "text-sm", radius: "rounded-xl", spinner: 16 },
  lg: {
    px: "px-5",
    py: "py-3",
    gap: "gap-2.5",
    text: "text-base",
    radius: "rounded-2xl",
    spinner: 18,
  },
};

const ROUNDED_MAP: Record<RoundedSize, string> = {
  none: "rounded-none",
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
  "3xl": "rounded-3xl",
  full: "rounded-full",
};

function spinner(size: number, className?: string) {
  return (
    <svg
      className={clsx("animate-spin", className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 008 12H4z" />
    </svg>
  );
}

function useDebounced<T extends (...args: any[]) => void>(fn?: T, wait = 300) {
  const last = useRef(0);
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last.current < wait) return;
    last.current = now;
    fn?.(...args);
  };
}

export const Button = memo(function Button(props: ButtonProps) {
  const {
    children,
    variant = "solid",
    tone = "primary",
    size = "sm",
    block,
    rounded,
    roundedSize,
    leftIcon,
    rightIcon,
    loading,
    loadingText,
    href,
    as,
    debounceMs = 300,
    disabled,
    className,
    onClick,

    fontWeight = "medium",
    italic,
    underline,
    strike,
    uppercase,
    ...rest
  } = props;

  const s = SIZE[size];
  const tv = toneVars[tone];

  const toneStyle = useMemo(
    () =>
      ({
        ["--btn-bg" as any]: tv.bg,
        ["--btn-bg-hover" as any]: tv.solidHoverBg,
        ["--btn-fg-on" as any]: tv.fgOnBg,
        ["--btn-fg" as any]: tv.fg,
        ["--btn-border" as any]: tv.border,
        ["--btn-soft-bg" as any]: tv.softBg,
        ["--btn-soft-hover" as any]: tv.softHoverBg,
        ["--btn-ring" as any]: tv.ring,
      }) as React.CSSProperties,
    [tv]
  );

  const fontClasses = clsx(
    fontWeight && `font-${fontWeight}`,
    italic && "italic",
    underline && "underline",
    strike && "line-through",
    uppercase && "uppercase"
  );

  const radiusClass = rounded ?? (roundedSize ? ROUNDED_MAP[roundedSize] : s.radius);

  const base = clsx(
    "inline-flex items-center justify-center select-none",
    "transition-colors outline-none",
    "focus-visible:ring-2 focus-visible:ring-offset-0 ring-[var(--btn-ring)]",
    s.px,
    s.py,
    s.text,
    s.gap,
    radiusClass,
    block && "w-full",
    disabled || loading ? "pointer-events-none opacity-55" : "cursor-pointer",
    fontClasses
  );

  const classes = useMemo(() => {
    const solid = clsx(
      base,
      "border border-transparent",
      "bg-[var(--btn-bg)] dark:text-white",
      "hover:bg-[var(--btn-bg-hover)]"
      
    );

    const outline = clsx(
      base,
      "bg-transparent",
      "text-[var(--btn-fg)]",
      "border",
      "border-[var(--btn-border)]",
      "hover:bg-[color-mix(in oklab, var(--btn-fg) 6%, transparent)]"
    );

    const ghost = clsx(
      base,
      "border border-transparent bg-transparent",
      "text-[var(--btn-fg)]",
      "hover:bg-[color-mix(in oklab, var(--btn-fg) 6%, transparent)]"
    );

    const link = clsx(
      "inline-flex items-center gap-1 underline-offset-4 hover:underline",
      s.text,
      "text-[var(--btn-fg)]",
      fontClasses,
      radiusClass
    );

    const soft = clsx(
      base,
      "border border-transparent",
      "text-[var(--btn-fg)]",
      "bg-[var(--btn-soft-bg)] hover:bg-[var(--btn-soft-hover)]"
    );

    const dict: Record<Variant, string> = { solid, outline, ghost, link, soft };
    return dict[variant];
  }, [base, s.text, fontClasses, radiusClass, variant]);

  const clickHandler = useDebounced(onClick as any, debounceMs);

  const content = (
    <>
      {loading ? (
        <>
          {spinner(s.spinner, clsx(variant === "link" ? "" : "mr-1"))}
          {loadingText ?? (typeof children === "string" ? children : "Loading")}
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex items-center">{leftIcon}</span>}
          <span className="truncate">{children}</span>
          {rightIcon && <span className="inline-flex items-center">{rightIcon}</span>}
        </>
      )}
    </>
  );

  const ariaCommon = { "aria-busy": !!loading, "aria-disabled": disabled || loading };

  if (href) {
    return (
      <Link
        href={href}
        className={clsx(classes, className)}
        style={toneStyle}
        {...(rest as any)}
        {...ariaCommon}
        onClick={clickHandler as any}
      >
        {content}
      </Link>
    );
  }

  if (as === "a") {
    return (
      <a
        className={clsx(classes, className)}
        style={toneStyle}
        {...(rest as any)}
        {...ariaCommon}
        onClick={clickHandler as any}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type={(rest as any).type ?? "button"}
      disabled={disabled || loading}
      className={clsx(classes, className)}
      style={toneStyle}
      {...(rest as any)}
      {...ariaCommon}
      onClick={clickHandler as any}
    >
      {content}
    </button>
  );
});

export default Button;
