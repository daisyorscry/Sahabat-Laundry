// src/components/table/TableShell.tsx
"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utility";

// src/components/table/TableShell.tsx

const bodyVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.02 } },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: 2 },
  show: { opacity: 1, y: 0, transition: { duration: 0.14, ease: "easeOut" } },
};

export function TableContainer(props: HTMLMotionProps<"div">) {
  const { className, ...rest } = props;
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={cn("border-border bg-card-primary overflow-x-auto rounded-lg border", className)}
      {...rest}
    />
  );
}

export function TableEl(props: React.TableHTMLAttributes<HTMLTableElement>) {
  const { className, ...rest } = props;
  return <table className={cn("w-full caption-bottom text-sm", className)} {...rest} />;
}

export function THead(props: HTMLMotionProps<"thead">) {
  const { className, ...rest } = props;
  return (
    <motion.thead
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className={cn(
        // pakai token yang ada: bg-background (dengan opacity) + border bawah saja
        "bg-background/70 border-border border-b backdrop-blur-[1px]",
        className
      )}
      {...rest}
    />
  );
}

export function TBody(props: HTMLMotionProps<"tbody">) {
  const { className, ...rest } = props;
  return (
    <motion.tbody
      variants={bodyVariants}
      initial="hidden"
      animate="show"
      className={cn(className)}
      {...rest}
    />
  );
}

export function TR(props: HTMLMotionProps<"tr">) {
  const { className, ...rest } = props;
  return (
    <motion.tr
      variants={rowVariants}
      className={cn(
        // garis antar baris pakai border-b + token border
        "border-border border-b transition-colors",
        // hover pakai bg-background dengan opacity agar adaptif light/dark
        "hover:bg-background/60",
        className
      )}
      {...rest}
    />
  );
}

export function TH(props: React.ThHTMLAttributes<HTMLTableCellElement>) {
  const { className, ...rest } = props;
  return (
    <th
      className={cn(
        "px-4 py-3 text-left text-[13px] font-semibold whitespace-nowrap transition-colors",
        className
      )}
      {...rest}
    />
  );
}

export function TD(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  const { className, ...rest } = props;
  return <td className={cn("px-4 py-3 align-top transition-colors", className)} {...rest} />;
}
