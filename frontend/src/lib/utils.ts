import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getHonorCategoryInfo(score: number) {
  if (score >= 95) {
    return {
      label: "Trusted",
      badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
      color: "emerald",
      percentage: Math.min(100, score),
      description: "Highest trust rating. Eligible for instant booking & premium perks."
    };
  } else if (score >= 80) {
    return {
      label: "Good",
      badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
      color: "blue",
      percentage: score,
      description: "Solid rental history & positive host feedback."
    };
  } else if (score >= 60) {
    return {
      label: "Warning",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
      color: "amber",
      percentage: score,
      description: "Under review due to minor cancellations or late returns."
    };
  } else {
    return {
      label: "Restricted",
      badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
      color: "rose",
      percentage: score,
      description: "Account privileges limited due to policy violations."
    };
  }
}
