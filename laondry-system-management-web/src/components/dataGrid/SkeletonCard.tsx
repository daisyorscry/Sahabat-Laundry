"use client";
export default function SkeletonCard() {
  return (
    <div className="bg-[color-mix(in oklab,var(--color-foreground) 6%,var(--color-background))] h-64 animate-pulse rounded-xl border border-[var(--color-border)]" />
  );
}
