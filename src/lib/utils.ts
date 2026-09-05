import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a price. Defaults to PKR (Pakistani Rupee) — the store operates from Pakistan. */
export function formatPrice(value: number, currency: string = "PKR") {
  if (currency === "PKR") {
    const n = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(Math.round(value || 0));
    return `Rs ${n}`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}
