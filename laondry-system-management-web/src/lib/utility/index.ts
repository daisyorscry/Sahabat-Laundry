// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge className Tailwind dengan aman.
 * - clsx = conditional join
 * - twMerge = resolve conflict (misal bg-red-500 vs bg-blue-500)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
