// src/components/table/EmptyState.tsx
import * as React from "react";

import { cn } from "../../lib/utility";

type ButtonLikeProps = {
  label: string;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
};

type EmptyStateProps = {
  title?: string;
  description?: string;
  text?: string; // backward-compat
  icon?: React.ReactNode;
  illustrationSrc?: string;
  className?: string;
  children?: React.ReactNode;

  variant?: "ghost" | "card"; // card = ada border + bg subtle
  align?: "center" | "left";
  size?: "sm" | "md";

  primaryAction?: ButtonLikeProps;
  secondaryAction?: ButtonLikeProps;

  minHeight?: number | string; // contoh: 240 atau "50vh"
};

export default function EmptyState({
  title,
  description,
  text,
  icon,
  illustrationSrc,
  className,

  variant = "ghost",
  align = "center",
  size = "md",

  primaryAction,
  secondaryAction,

  minHeight = 200,
  children,
}: EmptyStateProps) {
  const hasLeft = align === "left";

  return (
    <section
      role="status"
      aria-live="polite"
      className={cn(
        "w-full",
        variant === "card" && "border-border bg-card-primary rounded-xl border",
        className
      )}
      style={{ minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight }}
    >
      <div
        className={cn(
          "flex gap-4 p-6",
          hasLeft ? "items-start" : "flex-col items-center text-center"
        )}
      >
        {/* Media */}
        <div
          className={cn(
            "shrink-0",
            illustrationSrc
              ? cn(
                  "border-border overflow-hidden rounded-lg border",
                  size === "sm" ? "h-24 w-24" : "h-32 w-32"
                )
              : cn(
                  "bg-card-primary flex items-center justify-center rounded-full",
                  size === "sm" ? "h-10 w-10" : "h-12 w-12"
                )
          )}
          aria-hidden
        >
          {illustrationSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={illustrationSrc} alt="" className="h-full w-full object-cover" />
          ) : icon ? (
            <div className={cn(size === "sm" ? "text-base" : "text-lg", "text-foreground/60")}>
              {icon}
            </div>
          ) : (
            <svg
              className={cn(size === "sm" ? "h-5 w-5" : "h-6 w-6", "text-foreground/60")}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 17v-2a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M7 9h10"
              />
            </svg>
          )}
        </div>

        {/* Body */}
        <div className={cn("flex flex-col", hasLeft ? "items-start text-left" : "items-center")}>
          {(title || description || text) && (
            <div className="space-y-1">
              {title && (
                <h3
                  className={cn(
                    "text-foreground font-semibold",
                    size === "sm" ? "text-sm" : "text-base"
                  )}
                >
                  {title}
                </h3>
              )}
              {(description || text) && (
                <p className={cn("text-foreground/70", size === "sm" ? "text-xs" : "text-sm")}>
                  {description ?? text}
                </p>
              )}
            </div>
          )}

          {children && (
            <div className={cn("mt-2", size === "sm" ? "text-xs" : "text-sm")}>{children}</div>
          )}

          {(primaryAction || secondaryAction) && (
            <div className={cn("mt-3 flex gap-2", hasLeft ? "" : "justify-center")}>
              {primaryAction && <ActionButton intent="primary" {...primaryAction} size={size} />}
              {secondaryAction && (
                <ActionButton intent="secondary" {...secondaryAction} size={size} />
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ActionButton({
  intent,
  label,
  onClick,
  href,
  disabled,
  size = "md",
}: ButtonLikeProps & { intent: "primary" | "secondary"; size?: "sm" | "md" }) {
  const base = cn(
    "inline-flex items-center justify-center rounded-md text-sm transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ring-[var(--border-primary)]",
    disabled && "opacity-60 cursor-not-allowed",
    size === "sm" ? "h-8 px-3" : "h-9 px-3.5"
  );

  const style =
    intent === "primary"
      ? // solid primary token-friendly
        "border border-transparent bg-primary text-white hover:opacity-90"
      : // outline netral token-friendly
        "border border-border bg-transparent text-foreground hover:bg-card-primary";

  const Tag: any = href ? "a" : "button";
  const commonProps = href ? { href } : { type: "button", disabled };

  return (
    <Tag onClick={onClick} className={cn(base, style)} {...commonProps}>
      {label}
    </Tag>
  );
}
