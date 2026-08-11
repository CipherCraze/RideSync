import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm border border-transparent active:bg-blue-800",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200/80 active:bg-gray-300",
    outline: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm active:bg-gray-100",
    ghost: "bg-transparent hover:bg-gray-100 text-gray-700 active:bg-gray-200",
    danger: "bg-rose-600 hover:bg-rose-700 text-white shadow-sm border border-transparent active:bg-rose-800",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs rounded-lg font-medium",
    md: "px-4 py-2 text-sm rounded-xl font-medium",
    lg: "px-5 py-2.5 text-base rounded-xl font-semibold",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current fill-none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
}
